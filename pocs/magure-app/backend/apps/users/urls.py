# backend/accounts/urls.py

from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from rest_framework.routers import DefaultRouter
from apps.users.serializers import CustomTokenObtainPairSerializer
from .views import UserViewSet

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("login/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
] + router.urls
