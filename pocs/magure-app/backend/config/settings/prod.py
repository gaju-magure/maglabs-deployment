from .base import *

DEBUG = False
ALLOWED_HOSTS = config("DJANGO_ALLOWED_HOSTS", default="yourdomain.com").split(",")

# TODO: Configure real email backend, static/media storage, and logging here.
