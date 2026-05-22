import threading

from django.apps import AppConfig


class CarteraConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "cartera"
    verbose_name = "Cartera Cooperativa Tulcán"

    def ready(self):
        if not _es_runserver():
            return

        def precalentar():
            try:
                from cartera.views import _iniciar_sync_background, _leer_cache_disco

                if _leer_cache_disco():
                    return
                _iniciar_sync_background()
            except Exception:
                pass

        threading.Thread(target=precalentar, daemon=True, name="precalentar-cartera").start()


def _es_runserver() -> bool:
    import sys

    return "runserver" in sys.argv
