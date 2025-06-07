from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django admin (public schema)
    path("admin/", admin.site.urls),

    # Tenant-related endpoints (public schema for managing tenants)
    path("api/v1/tenants/", include("tenants.urls")),

    # Authentication endpoints (login, JWT token)
    path("api/v1/accounts/", include("accounts.urls")),

    # Tenant-scoped APIs
    path("api/v1/", include("core.urls")),
]
