# backend/tenants/urls.py

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    TenantViewSet, OnboardingVerifyTokenView, OnboardingProfileSetupView,
    OnboardingCompanyDetailsView, OnboardingPreferencesView, OnboardingStatusView
)

router = DefaultRouter()
router.register(r'', TenantViewSet, basename='tenants')

urlpatterns = router.urls + [
    # Onboarding endpoints
    path('onboarding/verify-token/', OnboardingVerifyTokenView.as_view(), name='onboarding-verify-token'),
    path('onboarding/profile-setup/', OnboardingProfileSetupView.as_view(), name='onboarding-profile-setup'),
    path('onboarding/company-details/', OnboardingCompanyDetailsView.as_view(), name='onboarding-company-details'),
    path('onboarding/preferences/', OnboardingPreferencesView.as_view(), name='onboarding-preferences'),
    path('onboarding/status/', OnboardingStatusView.as_view(), name='onboarding-status'),
]
