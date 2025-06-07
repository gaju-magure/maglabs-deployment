# backend/accounts/urls.py

from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

urlpatterns = [
    path("login/", TokenObtainPairView.as_view(serializer_class=CustomTokenObtainPairSerializer), name="token_obtain_pair"),
    path("login/refresh/", TokenObtainPairView.as_view(serializer_class=CustomTokenObtainPairSerializer), name="token_refresh"),
    
    # include default Django auth URLs if needed
    path('', include('django.contrib.auth.urls')),
]
