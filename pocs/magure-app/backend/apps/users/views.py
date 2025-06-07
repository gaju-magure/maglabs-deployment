from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from apps.users.serializers import (
    UserListSerializer,
    UserDetailSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
)
from rest_framework.permissions import IsAuthenticated, OR
from .permissions import IsSuperAdmin, IsTenantAdmin, IsTenantUser
from rest_framework.pagination import PageNumberPagination

User = get_user_model()

class UserPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = UserPagination

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAuthenticated(), OR(IsSuperAdmin(), IsTenantAdmin())]
        elif self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), OR(IsSuperAdmin(), IsTenantAdmin())]
        elif self.action in ['retrieve', 'list']:
            return [
                IsAuthenticated(), 
                OR(IsSuperAdmin(), OR(IsTenantAdmin(), IsTenantUser()))
            ]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == "superadmin" or user.role == "tenant_admin":
            return User.objects.all()
        else:
            return User.objects.filter(id=user.id)

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        elif self.action == 'retrieve':
            return UserDetailSerializer
        elif self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserDetailSerializer

    def update(self, request, *args, **kwargs):
        # Allow users to update their own profile
        instance = self.get_object()
        if request.user.role not in ['superadmin', 'tenant_admin'] and instance.id != request.user.id:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
