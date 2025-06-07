# backend/tenants/urls.py

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet

router = DefaultRouter()
router.register(r'', TenantViewSet, basename='tenants')

urlpatterns = router.urls
