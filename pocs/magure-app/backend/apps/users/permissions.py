# accounts/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'superadmin'

class IsTenantAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'tenant_admin'

class IsTenantUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'tenant_user'
    
class IsTenantUserForOwnTenant(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow read permissions for everyone authenticated within their tenant
        if request.method in SAFE_METHODS:
            return obj.pk == request.tenant.pk

        # Allow write only for tenant_admin or tenant_user within own tenant
        return request.user.role in ["tenant_admin", "tenant_user"] and obj.pk == request.tenant.pk
