import os

ENV = os.getenv("DJANGO_ENV", "dev").lower()

if ENV == "production":
    from .prod import *
else:
    from .dev import *
