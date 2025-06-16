# backend/tenants/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TenantViewSet, OnboardingVerifyTokenView, OnboardingProfileSetupView, 
    OnboardingCompanyDetailsView, OnboardingPreferencesView, OnboardingStatusView, 
    OnboardingStepManagementView, TenantBrandingViewSet, DefaultThemeTemplateViewSet,
    TenantAssetViewSet
)
from .admin_views import TenantDepartmentViewSet, TenantRoleViewSet

router = DefaultRouter()
router.register(r'', TenantViewSet, basename='tenants')

# Admin routers for department and role management
admin_router = DefaultRouter()
admin_router.register(r'departments', TenantDepartmentViewSet, basename='tenant-departments')
admin_router.register(r'roles', TenantRoleViewSet, basename='tenant-roles')

# Branding routers
branding_router = DefaultRouter()
branding_router.register(r'branding', TenantBrandingViewSet, basename='tenant-branding')
branding_router.register(r'templates', DefaultThemeTemplateViewSet, basename='theme-templates')
branding_router.register(r'assets', TenantAssetViewSet, basename='tenant-assets')

urlpatterns = router.urls + [
    # Enhanced Onboarding endpoints
    path('onboarding/verify-token/', OnboardingVerifyTokenView.as_view(), name='onboarding-verify-token'),
    path('onboarding/profile-setup/', OnboardingProfileSetupView.as_view(), name='onboarding-profile-setup'),
    path('onboarding/company-details/', OnboardingCompanyDetailsView.as_view(), name='onboarding-company-details'),
    path('onboarding/preferences/', OnboardingPreferencesView.as_view(), name='onboarding-preferences'),
    path('onboarding/status/', OnboardingStatusView.as_view(), name='onboarding-status'),
    path('onboarding/step/', OnboardingStepManagementView.as_view(), name='onboarding-step-management'),
    
    # Admin management endpoints
    path('admin/', include(admin_router.urls)),
    
    # Branding management endpoints
    path('', include(branding_router.urls)),
]
