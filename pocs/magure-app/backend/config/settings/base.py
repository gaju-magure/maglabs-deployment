from config.env import *
from pathlib import Path
from datetime import timedelta

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load SECRET_KEY from environment
SECRET_KEY = app.secret_key
DEBUG = app.debug_mode
ALLOWED_HOSTS = app.allowed_hosts

# Guarantee that Tenant & Domain models are discovered
TENANT_MODEL = "tenants.Tenant"
TENANT_DOMAIN_MODEL = "tenants.Domain"
AUTH_USER_MODEL = "users.User"

# Application definition
SHARED_APPS = [
    "django_tenants",
    "apps.tenants",
    "apps.users",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",  # optional if you want blacklisting
]

TENANT_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "apps.users",
    "apps.ideas",
    "rest_framework_simplejwt.token_blacklist",  # optional if you want blacklisting
]

INSTALLED_APPS = SHARED_APPS + [app for app in TENANT_APPS if app not in SHARED_APPS]

MIDDLEWARE = [
    "django_tenants.middleware.TenantMainMiddleware",  # detects tenant from hostname
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # for any shared templates
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": [
            "django.template.context_processors.debug",
            "django.template.context_processors.request",
            "django.contrib.auth.context_processors.auth",
            "django.contrib.messages.context_processors.messages",
        ]},
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---------- Database (Postgres + django-tenants) ----------

DATABASES = {
    "default": {
        "ENGINE": "django_tenants.postgresql_backend",
        "NAME": db.name,
        "USER": db.user,
        "PASSWORD": db.password,
        "HOST": db.host,
        "PORT": db.port,
    }
}
# Use the TenantSyncRouter to route per-tenant model queries into the right schema
DATABASE_ROUTERS = ["django_tenants.routers.TenantSyncRouter"]

# ---------- CORS (to allow React) ----------
CORS_ALLOW_ALL_ORIGINS = True

# CORS_ALLOWED_ORIGINS = cors.allowed_origins

# ---------- Internationalization & Timezone ----------

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ---------- Static & Media ----------

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ---------- REST Framework ----------

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": jwt.access_token_lifetime,
    "REFRESH_TOKEN_LIFETIME":  jwt.refresh_toekn_lifetime,
    "ROTATE_REFRESH_TOKENS": jwt.rotate_refresh_token,
    "BLACKLIST_AFTER_ROTATION": jwt.blacklist_after_rotation,
    "ALGORITHM": "HS256",
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# ---------- Tenant settings (django-tenants) ----------

# Shared apps run in public schema; tenant apps run in their own schemas
PUBLIC_SCHEMA_NAME = "public"
