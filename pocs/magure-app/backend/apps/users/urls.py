# backend/accounts/urls.py

from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("login/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # include default Django auth URLs if needed
    path('', include('django.contrib.auth.urls')),
]
