from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile
from apps.tenants.models import TenantDepartment, TenantRole

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model"""
    
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'user_id', 'username', 'email', 'full_name',
            'job_title', 'department', 'phone_number',
            'bio', 'linkedin_url', 'profile_avatar',
            'timezone', 'hire_date', 'manager',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating UserProfile"""
    
    class Meta:
        model = UserProfile
        fields = [
            'job_title', 'department', 'phone_number',
            'bio', 'linkedin_url', 'timezone', 
            'hire_date', 'manager'
        ]


class UserProfileAvatarSerializer(serializers.ModelSerializer):
    """Serializer for updating profile avatar"""
    
    class Meta:
        model = UserProfile
        fields = ['profile_avatar']
    
    def validate_profile_avatar(self, value):
        """Validate uploaded image"""
        if value:
            # Check file size (max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Image file too large. Max size is 5MB.")
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    f"Invalid image type. Allowed types: {', '.join(allowed_types)}"
                )
        
        return value


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for TenantDepartment"""
    
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantDepartment
        fields = [
            'id', 'name', 'description', 'parent_department',
            'department_head', 'is_active', 'member_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def validate_name(self, value):
        """Validate that department name is unique within the tenant"""
        request = self.context.get('request')
        if not request:
            return value
            
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return value
        
        # Check for existing department with same name in the same tenant
        queryset = TenantDepartment.objects.filter(
            tenant=tenant,
            name__iexact=value  # Case-insensitive check
        )
        
        # If updating an existing department, exclude it from the check
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)
        
        if queryset.exists():
            raise serializers.ValidationError(
                f"A department with the name '{value}' already exists in this tenant."
            )
        
        return value


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for TenantRole"""
    
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantRole
        fields = [
            'id', 'name', 'description', 'permissions',
            'parent_role', 'is_active', 'is_system_role',
            'user_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_system_role']
    
    def get_user_count(self, obj):
        return obj.users.count()
    
    def validate_name(self, value):
        """Validate that role name is unique within the tenant"""
        request = self.context.get('request')
        if not request:
            return value
            
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return value
        
        # Check for existing role with same name in the same tenant
        queryset = TenantRole.objects.filter(
            tenant=tenant,
            name__iexact=value  # Case-insensitive check
        )
        
        # If updating an existing role, exclude it from the check
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)
        
        if queryset.exists():
            raise serializers.ValidationError(
                f"A custom role with the name '{value}' already exists in this tenant."
            )
        
        return value