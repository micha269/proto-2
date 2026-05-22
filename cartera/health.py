import requests
from django.conf import settings
from django.http import JsonResponse

from .supabase_schema import TABLA_AHORROS, TABLA_CREDITOS
from .views import _headers_supabase, _url_tabla


def ping(_request):
    """Comprobación ligera para Docker (no llama a Supabase)."""
    return JsonResponse({"status": "ok", "service": "cooptech-backend"})


def health_check(_request):
    try:
        for tabla in (TABLA_CREDITOS, TABLA_AHORROS):
            respuesta = requests.head(
                _url_tabla(tabla),
                headers={**_headers_supabase(), "Prefer": "count=exact"},
                timeout=15,
            )
            respuesta.raise_for_status()
        return JsonResponse(
            {
                "status": "ok",
                "database": "connected",
                "tablas": [TABLA_CREDITOS, TABLA_AHORROS],
            }
        )
    except Exception as exc:
        return JsonResponse(
            {
                "status": "error",
                "database": "disconnected",
                "detalle": str(exc),
                "tablas": [TABLA_CREDITOS, TABLA_AHORROS],
            },
            status=503,
        )
