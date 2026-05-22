import logging
import pickle
import threading
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote

import requests
from django.conf import settings
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.renderers import BrowsableAPIRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from .renderers import PrettyJSONRenderer
from .supabase_schema import (
    CAMPO_FECHA_AHORRO,
    CAMPO_FECHA_CREDITO,
    CAMPOS_NUMERICOS_CREDITO,
    COLS_AHORROS,
    COLS_CREDITOS,
    TABLA_AHORROS,
    TABLA_CREDITOS,
)

logger = logging.getLogger(__name__)

UMBRAL_ALERTA_PROBABILIDAD = 40.0
PAGE_SIZE_DEFAULT = 50
PAGE_SIZE_MAX = 500
CHUNK_SIZE = 1000
PARALLEL_FETCH = 8
BATCH_TOKENS_AHORRO = 150
CACHE_TTL_SEG = 600
FETCH_TIMEOUT = 120
FETCH_RETRIES = 3

_cache_cartera: dict[str, dict] = {}
_carga_lock = threading.Lock()
_cargando_global = False
_CACHE_FILE = Path(settings.BASE_DIR) / ".cache" / "cartera_dashboard.pkl"


def _calcular_probabilidad_mora(dias_mora: int, saldo_ahorro: float, monto_credito: float) -> float:
    probabilidad = 12.0
    if dias_mora and int(dias_mora) > 0:
        probabilidad += 45.0
    if monto_credito > 0 and saldo_ahorro < (monto_credito * 0.05):
        probabilidad += 35.0
    return min(probabilidad, 100.0)


def _nombre_anonimo(token_seguridad: str) -> str:
    token = (token_seguridad or "").strip().upper()
    sufijo = token[-6:] if len(token) >= 6 else token
    return f"SOCIO_CRYPT_{sufijo}"


def _base_url_supabase() -> str:
    return settings.SUPABASE_PROJECT_URL.rstrip("/")


def _headers_supabase() -> dict:
    api_key = settings.SUPABASE_SECRET_KEY
    return {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }


def _url_tabla(nombre_tabla: str) -> str:
    return f"{_base_url_supabase()}/rest/v1/{quote(nombre_tabla, safe='')}"


def _contar_filas_tabla(nombre_tabla: str) -> int:
    respuesta = requests.head(
        _url_tabla(nombre_tabla),
        headers={**_headers_supabase(), "Prefer": "count=exact"},
        timeout=20,
    )
    respuesta.raise_for_status()
    rango = respuesta.headers.get("content-range", "")
    if "/" in rango:
        return int(rango.split("/")[-1])
    return 0


def _params_tabla(columnas: str, campo_fecha: str, search: str) -> dict:
    params = {
        "select": columnas,
        "order": f"{campo_fecha}.desc,token_seguridad.asc",
    }
    if search:
        params["token_seguridad"] = f"ilike.*{search}*"
    return params


def _fetch_chunk(
    nombre_tabla: str,
    params: dict,
    offset: int,
) -> tuple[int, list[dict]]:
    headers = {
        **_headers_supabase(),
        "Range-Unit": "items",
        "Range": f"{offset}-{offset + CHUNK_SIZE - 1}",
    }
    ultimo_error = None
    for intento in range(FETCH_RETRIES):
        try:
            respuesta = requests.get(
                _url_tabla(nombre_tabla),
                headers=headers,
                params=params,
                timeout=FETCH_TIMEOUT,
            )
            respuesta.raise_for_status()
            return offset, respuesta.json()
        except (requests.Timeout, requests.ConnectionError) as exc:
            ultimo_error = exc
            time.sleep(1.5 * (intento + 1))
    raise ultimo_error  # type: ignore[misc]


def _consultar_tabla_paginada(
    nombre_tabla: str,
    columnas: str,
    campo_fecha: str,
    search: str = "",
) -> list[dict]:
    params = _params_tabla(columnas, campo_fecha, search)
    try:
        total_filas = _contar_filas_tabla(nombre_tabla)
    except requests.RequestException:
        total_filas = CHUNK_SIZE

    offsets = list(range(0, total_filas, CHUNK_SIZE))
    if not offsets:
        offsets = [0]

    lotes: dict[int, list] = {}
    workers = min(PARALLEL_FETCH, max(1, len(offsets)))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(_fetch_chunk, nombre_tabla, params, off) for off in offsets]
        for fut in as_completed(futures):
            offset, lote = fut.result()
            lotes[offset] = lote

    filas: list[dict] = []
    for offset in sorted(lotes.keys()):
        filas.extend(lotes[offset])
    return filas


def _fetch_ahorro_batch(tokens_batch: list[str]) -> list[dict]:
    if not tokens_batch:
        return []
    lista = ",".join(tokens_batch)
    params = {
        "select": COLS_AHORROS,
        "token_seguridad": f"in.({lista})",
        "order": f"{CAMPO_FECHA_AHORRO}.desc",
        "limit": "10000",
    }
    ultimo_error = None
    for intento in range(FETCH_RETRIES):
        try:
            respuesta = requests.get(
                _url_tabla(TABLA_AHORROS),
                headers=_headers_supabase(),
                params=params,
                timeout=FETCH_TIMEOUT,
            )
            respuesta.raise_for_status()
            return respuesta.json()
        except (requests.Timeout, requests.ConnectionError) as exc:
            ultimo_error = exc
            time.sleep(1.5 * (intento + 1))
    raise ultimo_error  # type: ignore[misc]


def _consultar_ahorros_para_tokens(tokens: list[str]) -> dict[str, dict]:
    ahorro: dict[str, dict] = {}
    if not tokens:
        return ahorro
    lotes = [tokens[i : i + BATCH_TOKENS_AHORRO] for i in range(0, len(tokens), BATCH_TOKENS_AHORRO)]
    workers = min(PARALLEL_FETCH, max(1, len(lotes)))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for filas in pool.map(_fetch_ahorro_batch, lotes):
            _mapa_ultimo_desde_filas(filas, ahorro)
    return ahorro


def _guardar_cache_disco(entrada: dict) -> None:
    try:
        _CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(_CACHE_FILE, "wb") as archivo:
            pickle.dump(entrada, archivo, protocol=pickle.HIGHEST_PROTOCOL)
    except OSError:
        logger.warning("No se pudo guardar cache en disco", exc_info=True)


def _leer_cache_disco() -> dict | None:
    if not _CACHE_FILE.exists():
        return None
    try:
        with open(_CACHE_FILE, "rb") as archivo:
            entrada = pickle.load(archivo)
        if time.time() - entrada.get("ts", 0) < CACHE_TTL_SEG:
            return entrada
    except (OSError, pickle.PickleError):
        logger.warning("Cache en disco corrupta o ilegible", exc_info=True)
    return None


def _mapa_ultimo_desde_filas(
    registros: list[dict],
    mapa: dict[str, dict] | None = None,
) -> dict[str, dict]:
    resultado = mapa if mapa is not None else {}
    for fila in registros:
        token = fila.get("token_seguridad")
        if token and token not in resultado:
            resultado[token] = fila
    return resultado


def _parse_float(valor) -> float:
    try:
        return float(valor or 0)
    except (TypeError, ValueError):
        return 0.0


def _parse_int(valor) -> int:
    try:
        return int(float(valor or 0))
    except (TypeError, ValueError):
        return 0


def _normalizar_credito(fila: dict) -> dict:
    salida = dict(fila)
    for campo in CAMPOS_NUMERICOS_CREDITO:
        if campo in salida:
            if campo == "dias_mora" or campo in ("nro_oficina", "dia_pago", "plazo", "nro_cuotas", "nro_cargas_fam", "nro_creditos", "nro_cuotas_atra"):
                salida[campo] = _parse_int(salida.get(campo))
            else:
                salida[campo] = round(_parse_float(salida.get(campo)), 2)
    return salida


def _cache_key(search: str) -> str:
    return search.strip().lower() or "__all__"


def _construir_entrada_dashboard(
    credito: dict[str, dict],
    ahorro: dict[str, dict],
    filas_credito_bd: int = 0,
    filas_ahorro_bd: int = 0,
) -> dict:
    agencias = _extraer_agencias(credito)
    return {
        "ts": time.time(),
        "credito": credito,
        "ahorro": ahorro,
        "agencias": agencias,
        "metricas": _calcular_metricas_globales(credito, ahorro),
        "universo_bd": {
            "filas_tabla_creditos": filas_credito_bd or len(credito),
            "filas_tabla_ahorros": filas_ahorro_bd,
            "socios_unicos_credito": len(credito),
            "total_agencias": len(agencias),
        },
    }


def _sincronizar_desde_supabase(search: str = "") -> dict:
    global _cargando_global
    logger.info("Sincronizando cartera desde Supabase (search=%r)", search or "*")
    credito_raw = _consultar_tabla_paginada(
        TABLA_CREDITOS, COLS_CREDITOS, CAMPO_FECHA_CREDITO, search
    )
    credito = _mapa_ultimo_desde_filas(credito_raw)
    tokens = list(credito.keys())
    ahorro = _consultar_ahorros_para_tokens(tokens)

    try:
        filas_credito_bd = _contar_filas_tabla(TABLA_CREDITOS)
        filas_ahorro_bd = _contar_filas_tabla(TABLA_AHORROS)
    except requests.RequestException:
        filas_credito_bd = len(credito_raw)
        filas_ahorro_bd = 0

    entrada = _construir_entrada_dashboard(
        credito, ahorro, filas_credito_bd, filas_ahorro_bd
    )
    logger.info(
        "Sincronización lista: %s socios, %s agencias",
        len(credito),
        len(entrada["agencias"]),
    )
    return entrada


def _iniciar_sync_background() -> None:
    def worker():
        global _cargando_global
        with _carga_lock:
            if _cargando_global:
                return
            _cargando_global = True
        try:
            entrada = _sincronizar_desde_supabase("")
            with _carga_lock:
                _cache_cartera[_cache_key("")] = entrada
            _guardar_cache_disco(entrada)
        except Exception:
            logger.exception("Error en sincronización en segundo plano")
        finally:
            with _carga_lock:
                _cargando_global = False

    threading.Thread(target=worker, daemon=True, name="sync-cartera").start()


def _obtener_datos_dashboard(search: str = "") -> dict | None:
    clave = _cache_key(search)
    ahora = time.time()

    if clave in _cache_cartera:
        entrada = _cache_cartera[clave]
        if ahora - entrada["ts"] < CACHE_TTL_SEG:
            return entrada

    if not search:
        disco = _leer_cache_disco()
        if disco:
            _cache_cartera[clave] = disco
            if ahora - disco["ts"] >= CACHE_TTL_SEG and not _cargando_global:
                _iniciar_sync_background()
            return disco

    if search:
        with _carga_lock:
            entrada = _sincronizar_desde_supabase(search)
            _cache_cartera[clave] = entrada
            return entrada

    with _carga_lock:
        if clave in _cache_cartera:
            return _cache_cartera[clave]
        if not _cargando_global:
            _iniciar_sync_background()

    return None


def esta_sincronizando() -> bool:
    return _cargando_global


def _construir_socio(token: str, fila_credito: dict, fila_ahorro: dict) -> dict:
    monto_credito = _parse_float(fila_credito.get("monto_credito"))
    dias_mora = _parse_int(fila_credito.get("dias_mora"))
    saldo_disponible = _parse_float(fila_ahorro.get("saldo_disponible"))
    probabilidad = _calcular_probabilidad_mora(dias_mora, saldo_disponible, monto_credito)

    credito_norm = _normalizar_credito(fila_credito)
    return {
        "token_seguridad": token,
        "nombre_anon": _nombre_anonimo(token),
        "monto_credito": round(monto_credito, 2),
        "dias_mora": dias_mora,
        "probabilidad_mora": round(probabilidad, 2),
        "saldo_disponible": round(saldo_disponible, 2),
        "saldo_capital": credito_norm.get("saldo_capital", 0),
        "calificacion": credito_norm.get("calificacion") or "",
        "tipo_cartera": credito_norm.get("tipo_cartera") or "",
        "estado_op": credito_norm.get("estado_op") or "",
        "fecha_corte": credito_norm.get("fecha_corte") or "",
        "nro_oficina": credito_norm.get("nro_oficina"),
        "credito": credito_norm,
        "ahorro": {
            "saldo_disponible": round(saldo_disponible, 2),
            "fecha_corte_ahorro": fila_ahorro.get("fecha_corte_ahorro") or "",
        },
    }


def _resolver_token_socio(codigo: str, credito: dict[str, dict]) -> str | None:
    codigo = codigo.strip().upper()
    if codigo in credito:
        return codigo
    for token in credito:
        token_upper = (token or "").upper()
        if codigo in token_upper or token_upper in codigo:
            return token
    return None


def _buscar_socio_por_id(socio_id: str) -> dict | None:
    codigo = socio_id.strip().upper()
    if not codigo:
        return None

    try:
        datos = _obtener_datos_dashboard("")
        if datos:
            credito = datos["credito"]
            ahorro = datos["ahorro"]
            token = _resolver_token_socio(codigo, credito)
            if token:
                return _construir_socio(token, credito[token], ahorro.get(token, {}))
    except requests.RequestException:
        logger.warning("Cache no disponible para búsqueda de socio %s", codigo)

    credito_raw = _consultar_tabla_paginada(
        TABLA_CREDITOS, COLS_CREDITOS, CAMPO_FECHA_CREDITO, codigo
    )
    if not credito_raw:
        return None

    credito = _mapa_ultimo_desde_filas(credito_raw)
    token = _resolver_token_socio(codigo, credito)
    if not token:
        return None

    ahorro = _consultar_ahorros_para_tokens([token])
    return _construir_socio(token, credito[token], ahorro.get(token, {}))


def _codigo_oficina(valor) -> str:
    if valor is None or valor == "":
        return ""
    if isinstance(valor, float) and valor == int(valor):
        return str(int(valor))
    return str(valor).strip()


def _extraer_agencias(credito: dict[str, dict]) -> list[dict]:
    conteo = Counter()
    for fila in credito.values():
        codigo = _codigo_oficina(fila.get("nro_oficina"))
        if codigo:
            conteo[codigo] += 1

    def _orden(item: tuple[str, int]):
        codigo = item[0]
        try:
            return (0, int(codigo))
        except ValueError:
            return (1, codigo)

    return [
        {
            "codigo": codigo,
            "label": f"Agencia {codigo}",
            "socios": cantidad,
        }
        for codigo, cantidad in sorted(conteo.items(), key=_orden)
    ]


def _variante_riesgo_prob(prob: float) -> str:
    if prob >= 65:
        return "critico"
    if prob >= 40:
        return "moderado"
    return "estable"


def _token_pasa_filtro_perfil(
    token: str,
    credito: dict[str, dict],
    ahorro: dict[str, dict],
    tipo_riesgo: str,
    rango_score: str,
) -> bool:
    fila_credito = credito[token]
    fila_ahorro = ahorro.get(token, {})
    prob = _calcular_probabilidad_mora(
        _parse_int(fila_credito.get("dias_mora")),
        _parse_float(fila_ahorro.get("saldo_disponible")),
        _parse_float(fila_credito.get("monto_credito")),
    )
    if tipo_riesgo != "todos" and _variante_riesgo_prob(prob) != tipo_riesgo:
        return False
    if rango_score == "alto" and prob < 65:
        return False
    if rango_score == "medio" and (prob < 40 or prob >= 65):
        return False
    if rango_score == "bajo" and prob >= 40:
        return False
    return True


def _filtrar_tokens_por_perfil(
    tokens: list[str],
    credito: dict[str, dict],
    ahorro: dict[str, dict],
    tipo_riesgo: str,
    rango_score: str,
) -> list[str]:
    if tipo_riesgo == "todos" and rango_score == "todos":
        return tokens
    return [
        token
        for token in tokens
        if _token_pasa_filtro_perfil(token, credito, ahorro, tipo_riesgo, rango_score)
    ]


def _filtrar_tokens_por_oficina(
    tokens: list[str],
    credito: dict[str, dict],
    oficina: str,
) -> list[str]:
    codigo = oficina.strip()
    if not codigo:
        return tokens
    return [
        token
        for token in tokens
        if _codigo_oficina(credito[token].get("nro_oficina")) == codigo
    ]


def _calcular_metricas_globales(credito: dict[str, dict], ahorro: dict[str, dict]) -> dict:
    alertas = 0
    capital = 0.0
    for token, fila_credito in credito.items():
        fila_ahorro = ahorro.get(token, {})
        monto = _parse_float(fila_credito.get("monto_credito"))
        dias = _parse_int(fila_credito.get("dias_mora"))
        saldo = _parse_float(fila_ahorro.get("saldo_disponible"))
        prob = _calcular_probabilidad_mora(dias, saldo, monto)
        capital += monto
        if prob >= UMBRAL_ALERTA_PROBABILIDAD or dias > 0:
            alertas += 1

    return {
        "total_socios_analizados": len(credito),
        "alertas_comportamentales_activas": alertas,
        "capital_exposicion_preventiva": round(capital, 2),
    }


class PredictivoResumenAPI(APIView):
    """Agregaciones predictivas sobre todos los socios en caché (sin límite de muestra)."""

    authentication_classes = []
    permission_classes = []
    renderer_classes = [PrettyJSONRenderer, BrowsableAPIRenderer]

    def get(self, request):
        from .predictivo import calcular_resumen_predictivo

        filtros = {
            "oficina": (request.query_params.get("oficina") or "").strip(),
            "tipo_riesgo": (request.query_params.get("tipo_riesgo") or "todos").strip(),
            "rango_score": (request.query_params.get("rango_score") or "todos").strip(),
            "solo_mora": (request.query_params.get("solo_mora") or "todos").strip(),
            "calificacion": (request.query_params.get("calificacion") or "todas").strip(),
        }

        try:
            datos = _obtener_datos_dashboard("")
            if datos is None:
                return Response(
                    {
                        "sincronizando": True,
                        "mensaje": "Sincronizando cartera con Supabase.",
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            resumen = calcular_resumen_predictivo(
                datos["credito"],
                datos["ahorro"],
                filtros,
            )
            resumen["metricas_globales"] = datos["metricas"]
            resumen["agencias"] = datos["agencias"]
            resumen["universo_bd"] = datos.get("universo_bd")
            return Response(resumen, status=status.HTTP_200_OK)
        except requests.RequestException as exc:
            logger.exception("Error en resumen predictivo")
            return Response(
                {"error": "No se pudo calcular el resumen predictivo.", "detalle": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class SocioDetalleAPI(APIView):
    """Busca un socio por token_seguridad o fragmento de ID en Supabase."""

    authentication_classes = []
    permission_classes = []
    renderer_classes = [PrettyJSONRenderer, BrowsableAPIRenderer]

    def get(self, request, socio_id: str):
        try:
            socio = _buscar_socio_por_id(socio_id)
            if not socio:
                return Response(
                    {"error": f"Socio {socio_id} no encontrado"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(socio, status=status.HTTP_200_OK)
        except requests.RequestException as exc:
            logger.exception("Error buscando socio %s", socio_id)
            return Response(
                {"error": "No se pudo consultar el socio en Supabase.", "detalle": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class DashboardAnalisisAPI(APIView):
    authentication_classes = []
    permission_classes = []
    renderer_classes = [PrettyJSONRenderer, BrowsableAPIRenderer]

    def get(self, request):
        accept = request.META.get("HTTP_ACCEPT", "")
        if "text/html" in accept and "application/json" not in accept.split(",")[0].strip():
            return redirect("/")

        search = (request.query_params.get("search") or "").strip()
        oficina = (request.query_params.get("oficina") or "").strip()
        tipo_riesgo = (request.query_params.get("tipo_riesgo") or "todos").strip()
        rango_score = (request.query_params.get("rango_score") or "todos").strip()
        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = int(request.query_params.get("page_size", PAGE_SIZE_DEFAULT))
        except (TypeError, ValueError):
            page_size = PAGE_SIZE_DEFAULT
        page_size = max(1, min(page_size, PAGE_SIZE_MAX))

        try:
            datos = _obtener_datos_dashboard(search)
            if datos is None:
                return Response(
                    {
                        "sincronizando": True,
                        "mensaje": "Sincronizando cartera con Supabase. Reintente en unos segundos.",
                        "metricas": {
                            "total_socios_analizados": 0,
                            "alertas_comportamentales_activas": 0,
                            "capital_exposicion_preventiva": 0,
                        },
                        "socios": [],
                        "agencias": [],
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            credito = datos["credito"]
            ahorro = datos["ahorro"]
        except requests.RequestException as exc:
            logger.exception("Error consultando Supabase REST por HTTPS")
            detalle = str(exc)
            if hasattr(exc, "response") and exc.response is not None:
                detalle = exc.response.text[:500]
            return Response(
                {
                    "error": "No se pudo leer la cartera desde Supabase en la nube.",
                    "detalle": detalle,
                    "tablas_esperadas": [TABLA_CREDITOS, TABLA_AHORROS],
                    "proyecto": _base_url_supabase(),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        agencias = datos["agencias"]
        metricas = datos["metricas"]
        universo_bd = datos["universo_bd"]
        tokens_ordenados = sorted(credito.keys())
        if oficina:
            tokens_ordenados = _filtrar_tokens_por_oficina(tokens_ordenados, credito, oficina)
        tokens_ordenados = _filtrar_tokens_por_perfil(
            tokens_ordenados, credito, ahorro, tipo_riesgo, rango_score
        )
        total_socios = len(tokens_ordenados)
        total_pages = max(1, (total_socios + page_size - 1) // page_size)
        page = min(page, total_pages)
        inicio = (page - 1) * page_size
        fin = inicio + page_size
        tokens_pagina = tokens_ordenados[inicio:fin]

        socios = [
            _construir_socio(token, credito[token], ahorro.get(token, {}))
            for token in tokens_pagina
        ]
        return Response(
            {
                "metricas": metricas,
                "socios": socios,
                "paginacion": {
                    "page": page,
                    "page_size": page_size,
                    "total_socios": total_socios,
                    "total_pages": total_pages,
                    "has_next": page < total_pages,
                    "has_prev": page > 1,
                },
                "agencias": agencias,
                "filtro_oficina": oficina or None,
                "filtros_perfil": {
                    "tipo_riesgo": tipo_riesgo,
                    "rango_score": rango_score,
                },
                "universo_bd": universo_bd,
                "modo": "supabase_rest",
                "esquema": {
                    "creditos": TABLA_CREDITOS,
                    "ahorros": TABLA_AHORROS,
                    "transacciones": "Supabase Transacciones",
                    "columnas_credito": COLS_CREDITOS.split(","),
                    "columnas_ahorro": COLS_AHORROS.split(","),
                },
                "total_registros": len(socios),
                "ui_dashboard": "/",
            },
            status=status.HTTP_200_OK,
        )
