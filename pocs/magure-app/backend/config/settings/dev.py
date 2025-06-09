from .base import *

DEBUG = True

INSTALLED_APPS += ["django_extensions"]  # optional dev tools

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
