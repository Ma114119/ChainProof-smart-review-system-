from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        """Load AI service at startup so you see 'AI is alive' when running runserver."""
        import os
        if os.environ.get('RUN_MAIN') == 'true':  # Avoid loading twice (Django reloader)
            try:
                from . import ai_service  # Triggers model load + prints success/error
            except Exception as e:
                print(f"⚠ AI service error: {e}")
