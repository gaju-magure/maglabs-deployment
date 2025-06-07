from rest_framework import mixins, viewsets, status

from rest_framework.permissions import IsAuthenticated, OR
from apps.users.permissions import IsSuperAdmin, IsTenantAdmin, IsTenantUser

from rest_framework.response import Response
from django_tenants.utils import schema_context

from .models import Tenant
from .serializers import TenantCreateSerializer, TenantInfoSerializer

class TenantViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    lookup_field = "pk"
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAuthenticated(), IsSuperAdmin()]
        elif self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), OR(IsSuperAdmin(), IsTenantAdmin())]
        elif self.action in ['retrieve', 'list']:
            return [
                IsAuthenticated(), 
                OR(IsSuperAdmin(), OR(IsTenantAdmin(), IsTenantUser()))
            ]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return TenantCreateSerializer
        return TenantInfoSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == "superadmin":
            return Tenant.objects.all()
        elif user.role in ["tenant_admin", "tenant_user"]:
            return Tenant.objects.filter(pk=self.request.tenant.pk)
        else:
            return Tenant.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role != "superadmin":
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenant = serializer.save()

        info = TenantInfoSerializer(tenant).data
        return Response(info, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        tenant = self.get_object()
        if not (request.user.role == "superadmin" or (request.user.role == "tenant_admin" and tenant.pk == request.tenant.pk)):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(tenant, data=request.data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        tenant = self.get_object()
        if request.user.role != "superadmin":
            return Response(status=status.HTTP_403_FORBIDDEN)

        tenant.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
