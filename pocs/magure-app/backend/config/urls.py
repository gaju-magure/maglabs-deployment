from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django admin (public schema)
    path("admin/", admin.site.urls),

    # Tenant-related endpoints (public schema for managing tenants)
    path("api/v1/tenants/", include("apps.tenants.urls")),

    # Authentication endpoints (login, JWT token)
    path("api/v1/accounts/", include("apps.users.urls")),

    # User CRUD endpoints
    path("api/v1/", include("apps.users.urls")),

    # Tenant-scoped APIs
    path("api/v1/", include("apps.ideas.urls")),
]
