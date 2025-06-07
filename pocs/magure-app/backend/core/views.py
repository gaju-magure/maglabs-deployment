# backend/core/views.py

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TenantUserCreateSerializer

class TenantUserCreateView(APIView):
    """
    POST /api/users/  under a tenant subdomain 
    Requires:
      - logged-in user with role="tenant_admin"
    Body:
      {
        "email": "someuser@acme.localhost",
        "password": "UserPass123",
        "first_name": "Alice",
        "last_name": "Smith"
      }
    Creates a new tenant_user in <schema>.accounts_user with role="tenant_user".
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Only tenant-admins may create tenant users
        if not request.user.is_staff or request.user.role != "tenant_admin":
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        serializer = TenantUserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_user = serializer.save()
        return Response({
            "id": new_user.id,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "message": "Tenant user created."
        }, status=status.HTTP_201_CREATED)
