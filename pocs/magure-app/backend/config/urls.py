from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django admin (public schema)
    path("admin/", admin.site.urls),

    path("api/v1/tenants/", include("apps.tenants.urls")),

    path("api/v1/accounts/", include("apps.users.urls")),

    path("api/v1/ideas/", include("apps.ideas.urls")),
]
