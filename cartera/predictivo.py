"""Agregaciones predictivas sobre el universo completo de socios en caché."""

from collections import Counter

UMBRAL_ALERTA_PROBABILIDAD = 40.0

BANDAS_SCORE = [
    {"key": "0-25", "label": "0–25%", "min": 0, "max": 25, "fill": "#34d399"},
    {"key": "25-40", "label": "25–40%", "min": 25, "max": 40, "fill": "#3DAA4A"},
    {"key": "40-65", "label": "40–65%", "min": 40, "max": 65, "fill": "#F39237"},
    {"key": "65-100", "label": "65–100%", "min": 65, "max": 100.01, "fill": "#ef4444"},
]

BANDAS_DIAS_MORA = [
    {"key": "0", "label": "Al día (0 d)", "min": 0, "max": 1, "fill": "#3DAA4A"},
    {"key": "1-30", "label": "1–30 días", "min": 1, "max": 31, "fill": "#F39237"},
    {"key": "31-90", "label": "31–90 días", "min": 31, "max": 91, "fill": "#ea580c"},
    {"key": "90+", "label": "Más de 90 d", "min": 91, "max": float("inf"), "fill": "#ef4444"},
]

BANDAS_MONTO = [
    {"key": "bajo", "label": "< $5.000", "min": 0, "max": 5000, "fill": "#3DAA4A"},
    {"key": "medio", "label": "$5k – $15k", "min": 5000, "max": 15000, "fill": "#F39237"},
    {"key": "alto", "label": "$15k – $50k", "min": 15000, "max": 50000, "fill": "#ea580c"},
    {"key": "muy-alto", "label": "> $50.000", "min": 50000, "max": float("inf"), "fill": "#ef4444"},
]

BANDAS_AHORRO = [
    {"key": "critico", "label": "< 5% crédito", "min": 0, "max": 0.05, "fill": "#ef4444"},
    {"key": "bajo", "label": "5% – 20%", "min": 0.05, "max": 0.2, "fill": "#F39237"},
    {"key": "medio", "label": "20% – 50%", "min": 0.2, "max": 0.5, "fill": "#fbbf24"},
    {"key": "saludable", "label": "> 50%", "min": 0.5, "max": float("inf"), "fill": "#3DAA4A"},
]

COLORES_CALIF = ["#3DAA4A", "#1F6B3D", "#F39237", "#ea580c", "#ef4444", "#6366f1", "#8b5cf6", "#0ea5e9"]
COLORES_TIPO = ["#3DAA4A", "#F39237", "#1F6B3D", "#ef4444", "#0ea5e9", "#a855f7", "#64748b"]


def _variante_riesgo(prob: float) -> str:
    if prob >= 65:
        return "critico"
    if prob >= 40:
        return "moderado"
    return "estable"


def _en_banda(valor: float, bandas: list) -> str | None:
    for banda in bandas:
        if valor >= banda["min"] and valor < banda["max"]:
            return banda["key"]
    return None


def _pasa_filtros(socio: dict, filtros: dict) -> bool:
    prob = socio["probabilidad_mora"]
    variant = _variante_riesgo(prob)

    tipo = filtros.get("tipo_riesgo") or "todos"
    if tipo != "todos" and variant != tipo:
        return False

    rango = filtros.get("rango_score") or "todos"
    if rango == "alto" and prob < 65:
        return False
    if rango == "medio" and (prob < 40 or prob >= 65):
        return False
    if rango == "bajo" and prob >= 40:
        return False

    mora = filtros.get("solo_mora") or "todos"
    if mora == "si" and socio["dias_mora"] <= 0:
        return False
    if mora == "no" and socio["dias_mora"] > 0:
        return False

    calif = filtros.get("calificacion") or "todas"
    if calif != "todas":
        if (socio.get("calificacion") or "").strip().upper() != calif.upper():
            return False

    return True


def _histograma_desde_conteo(bandas: list, conteo: dict, total: int) -> list:
    return [
        {
            "key": b["key"],
            "label": b["label"],
            "fill": b["fill"],
            "cantidad": conteo.get(b["key"], 0),
            "porcentaje": round((conteo.get(b["key"], 0) / total) * 100) if total else 0,
        }
        for b in bandas
    ]


def _pastel_desde_conteo(items: list[tuple], colores: list, limite: int = 8) -> list:
    ordenados = sorted(items, key=lambda x: x[1], reverse=True)
    top = ordenados[:limite]
    otros = sum(v for _, v in ordenados[limite:])
    segmentos = []
    for i, (label, valor) in enumerate(top):
        if valor <= 0:
            continue
        segmentos.append(
            {
                "id": str(label),
                "label": str(label)[:20],
                "labelCompleto": str(label),
                "valor": valor,
                "color": colores[i % len(colores)],
            }
        )
    if otros > 0:
        segmentos.append(
            {"id": "otros", "label": "Otros", "valor": otros, "color": "#94a3b8"}
        )
    total = sum(s["valor"] for s in segmentos) or 1
    for s in segmentos:
        s["porcentaje"] = round((s["valor"] / total) * 100)
    return segmentos


def calcular_resumen_predictivo(credito: dict, ahorro: dict, filtros: dict) -> dict:
    from .views import _codigo_oficina, _construir_socio, _filtrar_tokens_por_oficina

    oficina = (filtros.get("oficina") or "").strip()
    tokens = sorted(credito.keys())
    if oficina:
        tokens = _filtrar_tokens_por_oficina(tokens, credito, oficina)

    califs_universo = set()
    for token in tokens:
        cal = (credito[token].get("calificacion") or "").strip().upper()
        if cal:
            califs_universo.add(cal)

    conteo_score = {b["key"]: 0 for b in BANDAS_SCORE}
    conteo_mora_dias = {b["key"]: 0 for b in BANDAS_DIAS_MORA}
    conteo_monto = {b["key"]: 0 for b in BANDAS_MONTO}
    conteo_ahorro = {b["key"]: 0 for b in BANDAS_AHORRO}

    criticos = moderados = estables = 0
    con_mora = sin_mora = 0
    capital_critico = capital_moderado = capital_estable = 0.0
    suma_score = 0.0
    alertas = 0
    capital_riesgo = 0.0

    conteo_calif = Counter()
    conteo_tipo = Counter()
    conteo_agencia = {}

    top_candidatos: list[dict] = []

    total_filtrado = 0

    for token in tokens:
        fila_c = credito[token]
        fila_a = ahorro.get(token, {})
        socio = _construir_socio(token, fila_c, fila_a)

        if not _pasa_filtros(socio, filtros):
            continue

        total_filtrado += 1
        prob = socio["probabilidad_mora"]
        dias = socio["dias_mora"]
        monto = socio["monto_credito"]
        ahorro_val = socio["saldo_disponible"]

        suma_score += prob
        if prob >= UMBRAL_ALERTA_PROBABILIDAD or dias > 0:
            alertas += 1
        if prob >= 40:
            capital_riesgo += monto

        variant = _variante_riesgo(prob)
        if variant == "critico":
            criticos += 1
            capital_critico += monto
        elif variant == "moderado":
            moderados += 1
            capital_moderado += monto
        else:
            estables += 1
            capital_estable += monto

        if dias > 0:
            con_mora += 1
        else:
            sin_mora += 1

        k_score = _en_banda(prob, BANDAS_SCORE)
        if k_score:
            conteo_score[k_score] += 1
        k_mora = _en_banda(float(dias), BANDAS_DIAS_MORA)
        if k_mora:
            conteo_mora_dias[k_mora] += 1
        k_monto = _en_banda(monto, BANDAS_MONTO)
        if k_monto:
            conteo_monto[k_monto] += 1
        ratio = (ahorro_val / monto) if monto > 0 else 1.0
        k_ahorro = _en_banda(ratio, BANDAS_AHORRO)
        if k_ahorro:
            conteo_ahorro[k_ahorro] += 1

        cal = (socio.get("calificacion") or "Sin cal.").strip().upper() or "SIN CAL."
        conteo_calif[cal] += 1
        tipo = (socio.get("tipo_cartera") or "Sin tipo").strip() or "Sin tipo"
        conteo_tipo[tipo] += 1

        cod_ag = _codigo_oficina(socio.get("nro_oficina")) or "—"
        if cod_ag not in conteo_agencia:
            conteo_agencia[cod_ag] = {"codigo": cod_ag, "total": 0, "alertas": 0, "suma_score": 0.0}
        ag = conteo_agencia[cod_ag]
        ag["total"] += 1
        ag["suma_score"] += prob
        if prob >= 40 or dias > 0:
            ag["alertas"] += 1

        if len(top_candidatos) < 10:
            top_candidatos.append(socio)
            top_candidatos.sort(key=lambda s: (-s["probabilidad_mora"], -s["dias_mora"]))
        else:
            peor = top_candidatos[-1]
            if (prob, dias) > (peor["probabilidad_mora"], peor["dias_mora"]):
                top_candidatos[-1] = socio
                top_candidatos.sort(key=lambda s: (-s["probabilidad_mora"], -s["dias_mora"]))

    total = total_filtrado or 1
    tasa_alerta = (alertas / total_filtrado * 100) if total_filtrado else 0.0
    tasa_mora = (con_mora / total_filtrado * 100) if total_filtrado else 0.0

    por_agencia = sorted(
        [
            {
                **ag,
                "tasaAlerta": round((ag["alertas"] / ag["total"]) * 100, 1) if ag["total"] else 0,
                "scorePromedio": round(ag["suma_score"] / ag["total"], 1) if ag["total"] else 0,
            }
            for ag in conteo_agencia.values()
        ],
        key=lambda x: x["tasaAlerta"],
        reverse=True,
    )[:12]

    pastel_riesgo = _pastel_desde_conteo(
        [("Crítico", criticos), ("Moderado", moderados), ("Estable", estables)],
        ["#ef4444", "#F39237", "#3DAA4A"],
        limite=3,
    )
    pastel_mora = _pastel_desde_conteo(
        [("Con mora", con_mora), ("Al día", sin_mora)],
        ["#ef4444", "#3DAA4A"],
        limite=2,
    )

    return {
        "universo_completo": True,
        "total_universo_oficina": len(tokens),
        "total_analizados": total_filtrado,
        "metricas": {
            "score_promedio": round(suma_score / total_filtrado, 2) if total_filtrado else 0,
            "tasa_alerta": round(tasa_alerta, 2),
            "tasa_mora_real": round(tasa_mora, 2),
            "capital_en_riesgo": round(capital_riesgo, 2),
            "criticos": criticos,
            "moderados": moderados,
            "estables": estables,
            "alertas": alertas,
        },
        "histogramas": {
            "score": _histograma_desde_conteo(BANDAS_SCORE, conteo_score, total_filtrado),
            "dias_mora": _histograma_desde_conteo(BANDAS_DIAS_MORA, conteo_mora_dias, total_filtrado),
            "montos": _histograma_desde_conteo(BANDAS_MONTO, conteo_monto, total_filtrado),
            "ahorro_ratio": _histograma_desde_conteo(BANDAS_AHORRO, conteo_ahorro, total_filtrado),
        },
        "pasteles": {
            "riesgo": pastel_riesgo,
            "mora": pastel_mora,
            "calificacion": _pastel_desde_conteo(conteo_calif.items(), COLORES_CALIF, 8),
            "tipo_cartera": _pastel_desde_conteo(conteo_tipo.items(), COLORES_TIPO, 6),
            "capital_riesgo": _pastel_desde_conteo(
                [
                    ("Capital crítico", int(capital_critico)),
                    ("Capital moderado", int(capital_moderado)),
                    ("Capital estable", int(capital_estable)),
                ],
                ["#ef4444", "#F39237", "#3DAA4A"],
                3,
            ),
        },
        "por_agencia": por_agencia,
        "top_riesgo": sorted(
            top_candidatos,
            key=lambda s: (-s["probabilidad_mora"], -s["dias_mora"]),
        ),
        "calificaciones_disponibles": sorted(califs_universo),
    }
