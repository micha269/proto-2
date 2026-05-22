from django.urls import path
from django.views.generic import TemplateView

from .health import health_check, ping
from .views import DashboardAnalisisAPI, PredictivoResumenAPI, SocioDetalleAPI

urlpatterns = [
    path("", TemplateView.as_view(template_name="dashboard.html"), name="dashboard-ui"),
    path("api/ping/", ping, name="ping"),
    path("api/health/", health_check, name="health-check"),
    path("api/dashboard/analisis/", DashboardAnalisisAPI.as_view(), name="dashboard-analisis"),
    path(
        "api/dashboard/predictivo/resumen/",
        PredictivoResumenAPI.as_view(),
        name="predictivo-resumen",
    ),
    path("api/socio/<str:socio_id>/", SocioDetalleAPI.as_view(), name="socio-detalle"),
]
