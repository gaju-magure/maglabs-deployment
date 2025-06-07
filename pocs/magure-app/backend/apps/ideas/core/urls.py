from django.urls import path
from .views import TenantUserCreateView

urlpatterns = [
    path("users/", TenantUserCreateView.as_view(), name="tenant-user-create"),
]
