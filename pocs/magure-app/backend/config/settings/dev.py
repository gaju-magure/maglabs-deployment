from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*", "http://admin.localhost:8080"]

INSTALLED_APPS += ["django_extensions"]  # optional dev tools

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
