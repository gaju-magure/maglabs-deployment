from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Q
from apps.tenants.models import TenantDepartment, TenantRole
from apps.users.serializers import DepartmentSerializer, RoleSerializer
from apps.users.permissions import IsTenantAdmin


class TenantDepartmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tenant departments"""
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]
    
    def get_queryset(self):
        """Filter departments by current tenant"""
        # Get tenant from request (handled by django-tenants middleware)
        return TenantDepartment.objects.filter(
            tenant__schema_name=self.request.tenant.schema_name
        ).annotate(member_count=Count('members'))
    
    def perform_create(self, serializer):
        """Set tenant and created_by when creating department"""
        serializer.save(
            tenant=self.request.tenant,
            created_by=self.request.user
        )
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get department hierarchy tree"""
        departments = self.get_queryset().filter(parent_department__isnull=True)
        
        def build_tree(dept):
            return {
                'id': dept.id,
                'name': dept.name,
                'description': dept.description,
                'member_count': dept.member_count,
                'children': [build_tree(child) for child in dept.sub_departments.all()]
            }
        
        tree_data = [build_tree(dept) for dept in departments]
        return Response(tree_data)
    
    @action(detail=True, methods=['post'])
    def assign_head(self, request, pk=None):
        """Assign department head"""
        department = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
            department.department_head = user
            department.save()
            
            return Response({
                'message': f'{user.get_full_name()} assigned as department head',
                'department': DepartmentSerializer(department).data
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class TenantRoleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tenant roles"""
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]
    
    def get_queryset(self):
        """Filter roles by current tenant"""
        return TenantRole.objects.filter(
            tenant__schema_name=self.request.tenant.schema_name
        ).annotate(user_count=Count('users'))
    
    def perform_create(self, serializer):
        """Set tenant and created_by when creating role"""
        serializer.save(
            tenant=self.request.tenant,
            created_by=self.request.user
        )
    
    def destroy(self, request, *args, **kwargs):
        """Prevent deletion of system roles"""
        role = self.get_object()
        if role.is_system_role:
            return Response(
                {'error': 'System roles cannot be deleted'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a role with new name"""
        role = self.get_object()
        new_name = request.data.get('name')
        
        if not new_name:
            return Response(
                {'error': 'New role name is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if name already exists
        if TenantRole.objects.filter(
            tenant=self.request.tenant, 
            name=new_name
        ).exists():
            return Response(
                {'error': 'Role with this name already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create duplicate
        new_role = TenantRole.objects.create(
            tenant=self.request.tenant,
            name=new_name,
            description=f"Copy of {role.description}",
            permissions=role.permissions.copy(),
            parent_role=role.parent_role,
            is_active=True,
            is_system_role=False,
            created_by=self.request.user
        )
        
        return Response({
            'message': 'Role duplicated successfully',
            'role': RoleSerializer(new_role).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def permissions_list(self, request):
        """Get list of available permissions"""
        # This can be customized based on your permission system
        permissions = {
            'user_management': {
                'create_user': 'Create new users',
                'edit_user': 'Edit user details',
                'delete_user': 'Delete users',
                'view_user': 'View user details',
            },
            'department_management': {
                'create_department': 'Create departments',
                'edit_department': 'Edit departments',
                'delete_department': 'Delete departments',
                'assign_department_head': 'Assign department heads',
            },
            'role_management': {
                'create_role': 'Create custom roles',
                'edit_role': 'Edit roles',
                'delete_role': 'Delete roles',
                'assign_role': 'Assign roles to users',
            },
            'content_management': {
                'create_content': 'Create content',
                'edit_content': 'Edit content',
                'delete_content': 'Delete content',
                'publish_content': 'Publish content',
            }
        }
        return Response(permissions)