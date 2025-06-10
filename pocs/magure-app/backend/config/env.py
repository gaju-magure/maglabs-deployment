# backend/config/app_settings.py
import os
from datetime import timedelta

def config(key, default=None, cast=None):
    """Simple config function to replace decouple"""
    value = os.environ.get(key, default)
    if cast and value is not None:
        if cast == int:
            return int(value)
        elif cast == bool:
            return value.lower() in ('true', '1', 'yes', 'on')
        elif cast == list:
            return value.split(',') if value else []
    return value

class Csv:
    """CSV cast function"""
    def __call__(self):
        def parse_csv(value):
            if value:
                return [item.strip() for item in value.split(',')]
            return []
        return parse_csv
    
    def __repr__(self):
        return self.__call__()

class _App:
    port          = config("PORT",         default=8000,       cast=int)
    secret_key    = config("DJANGO_SECRET_KEY", default="changeme123")
    debug_mode    = config("DJANGO_DEBUG", default="True") == "True"
    allowed_hosts = config("DJANGO_ALLOWED_HOSTS", default="*", cast=list)

class _DB:
    engine       = "django_tenants.postgresql_backend"
    name         = config("POSTGRES_DB",       default="maglab")
    user         = config("POSTGRES_USER",     default="postgres")
    password     = config("POSTGRES_PASSWORD", default="postgres")
    host         = config("POSTGRES_HOST",     default="localhost")
    port         = config("POSTGRES_PORT",     default="5432", cast=int)

class _JWT:
    access_token_lifetime  = timedelta(days=10)
    refresh_toekn_lifetime = timedelta(days=70)
    rotate_refresh_token   = False,
    blacklist_after_rotation = True
    algorithm              = "HS256"

class _CORS:
    allowed_origins   = config("CORS_ALLOWED_ORIGINS", default="*", cast=list)
    allow_credentials = True

class _KEYS:
    openAIKey = config("OPENAI_API_KEY")

class _EMAIL:
    backend = config("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
    host = config("EMAIL_HOST", default="localhost")
    port = config("EMAIL_PORT", default=25, cast=int)
    use_tls = config("EMAIL_USE_TLS", default="False") == "True"
    host_user = config("EMAIL_HOST_USER", default="")
    host_password = config("EMAIL_HOST_PASSWORD", default="")
    default_from = config("DEFAULT_FROM_EMAIL", default="noreply@maglabs.com")

class _SERVICES:
    ai_service_url = config("AI_SERVICE_URL")

# instantiate singletons
app  = _App()
db   = _DB()
jwt  = _JWT()
cors = _CORS()
keys = _KEYS()
email = _EMAIL()
services = _SERVICES()
