# backend/config/app_settings.py
from decouple import config, Csv
from datetime import timedelta

class _App:
    port          = config("PORT",         default=8000,       cast=int)
    secret_key    = config("DJANGO_SECRET_KEY", default="changeme123")
    debug_mode    = config("DJANGO_DEBUG", default="True") == "True"
    allowed_hosts = config("DJANGO_ALLOWED_HOSTS", default="*", cast=Csv())

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
    allowed_origins   = config("CORS_ALLOWED_ORIGINS", default="*", cast=Csv())
    allow_credentials = True

# instantiate singletons
app  = _App()
db   = _DB()
jwt  = _JWT()
cors = _CORS()
