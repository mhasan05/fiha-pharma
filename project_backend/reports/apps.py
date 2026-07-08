from django.apps import AppConfig


class ReportsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "reports"

    def ready(self):
        # Import report definitions so they self-register in REPORT_REGISTRY.
        from . import definitions  # noqa: F401
