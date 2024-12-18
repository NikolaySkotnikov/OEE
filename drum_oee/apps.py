from django.apps import AppConfig


class DrumOeeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'drum_oee'

    def ready(self):
        import drum_oee.signals