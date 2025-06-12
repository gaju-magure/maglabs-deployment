from rest_framework import serializers
from .models import Idea, IdeaLike
from apps.tenants.models import TenantDepartment, TenantRole

class IdeaListSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_profile = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    custom_role_name = serializers.CharField(source='custom_role.name', read_only=True)
    like_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    status_updated_by_name = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_change_status = serializers.SerializerMethodField()

    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'status', 'priority', 'created_at', 'updated_at', 'user_email', 'user_name', 
            'user_profile', 'department_name', 'custom_role_name', 'is_pinned', 'like_count', 'is_liked',
            'assigned_to_name', 'estimated_effort', 'business_value', 'status_updated_at', 'status_updated_by_name',
            'can_edit', 'can_change_status'
        ]
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    
    def get_user_profile(self, obj):
        if hasattr(obj.user, 'profile'):
            profile = obj.user.profile
            return {
                'job_title': profile.job_title,
                'bio': profile.bio,
                'profile_avatar': profile.profile_avatar.url if profile.profile_avatar else None,
            }
        return None
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.is_liked_by(request.user)
        return False
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None
    
    def get_status_updated_by_name(self, obj):
        if obj.status_updated_by:
            return obj.status_updated_by.get_full_name() or obj.status_updated_by.username
        return None
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not (request and hasattr(request, 'user') and request.user.is_authenticated):
            return False
        
        user = request.user
        # Admins and tenant superadmins can edit all ideas
        if user.role in ['superadmin', 'tenant_admin']:
            return True
        
        # Users can edit their own ideas
        return obj.user == user
    
    def get_can_change_status(self, obj):
        request = self.context.get('request')
        if not (request and hasattr(request, 'user') and request.user.is_authenticated):
            return False
        
        user = request.user
        # Admins and tenant superadmins can change any status
        if user.role in ['superadmin', 'tenant_admin']:
            return True
        
        # Regular users have limited status change permissions
        if obj.user == user:
            return obj.status in ['submitted', 'needs_clarification', 'on_hold']
        
        return False

class IdeaDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_profile = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    custom_role_name = serializers.CharField(source='custom_role.name', read_only=True)
    like_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    status_updated_by_name = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_change_status = serializers.SerializerMethodField()
    available_status_transitions = serializers.SerializerMethodField()

    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'description', 'status', 'priority', 'created_at', 'updated_at', 'user_email', 
            'user_name', 'user_profile', 'department_name', 'custom_role_name', 'is_pinned', 'like_count', 'is_liked',
            'assigned_to', 'assigned_to_name', 'estimated_effort', 'business_value', 'implementation_notes', 
            'rejection_reason', 'status_updated_at', 'status_updated_by_name', 'can_edit', 'can_change_status',
            'available_status_transitions'
        ]
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    
    def get_user_profile(self, obj):
        if hasattr(obj.user, 'profile'):
            profile = obj.user.profile
            return {
                'job_title': profile.job_title,
                'bio': profile.bio,
                'profile_avatar': profile.profile_avatar.url if profile.profile_avatar else None,
            }
        return None
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.is_liked_by(request.user)
        return False
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None
    
    def get_status_updated_by_name(self, obj):
        if obj.status_updated_by:
            return obj.status_updated_by.get_full_name() or obj.status_updated_by.username
        return None
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not (request and hasattr(request, 'user') and request.user.is_authenticated):
            return False
        
        user = request.user
        # Admins and tenant superadmins can edit all ideas
        if user.role in ['superadmin', 'tenant_admin']:
            return True
        
        # Users can edit their own ideas
        return obj.user == user
    
    def get_can_change_status(self, obj):
        request = self.context.get('request')
        if not (request and hasattr(request, 'user') and request.user.is_authenticated):
            return False
        
        user = request.user
        return obj.can_transition_to('', user)  # Just check general permission
    
    def get_available_status_transitions(self, obj):
        request = self.context.get('request')
        if not (request and hasattr(request, 'user') and request.user.is_authenticated):
            return []
        
        user = request.user
        available_statuses = []
        
        for status_value, status_label in Idea.STATUS_CHOICES:
            if status_value != obj.status and obj.can_transition_to(status_value, user):
                available_statuses.append({'value': status_value, 'label': status_label})
        
        return available_statuses

class IdeaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idea
        fields = ['title', 'description', 'priority']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
        else:
            raise serializers.ValidationError("User context is required for idea creation")
        
        # Capture user's current department and custom role
        validated_data['department'] = user.department
        validated_data['custom_role'] = user.custom_role
        
        return Idea.objects.create(user=user, **validated_data)

class IdeaUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idea
        fields = ['title', 'description', 'priority', 'estimated_effort', 'business_value', 'implementation_notes']
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        
        # Only allow updates if user can edit the idea
        if not user or (user.role not in ['superadmin', 'tenant_admin'] and instance.user != user):
            raise serializers.ValidationError("You don't have permission to edit this idea")
        
        return super().update(instance, validated_data)


class IdeaStatusUpdateSerializer(serializers.ModelSerializer):
    notes = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Idea
        fields = ['status', 'priority', 'assigned_to', 'notes']
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        
        if not user:
            raise serializers.ValidationError("Authentication required")
        
        new_status = validated_data.get('status', instance.status)
        new_priority = validated_data.get('priority', instance.priority)
        notes = validated_data.pop('notes', None)
        
        # Check if user can transition to new status
        if new_status != instance.status and not instance.can_transition_to(new_status, user):
            raise serializers.ValidationError(f"You cannot transition this idea to {new_status}")
        
        # Update the status with proper tracking
        if new_status != instance.status:
            instance.update_status(new_status, user, notes)
        
        # Update priority if user has permission (tenant admins can update priority)
        if user.role in ['superadmin', 'tenant_admin'] and new_priority != instance.priority:
            instance.priority = new_priority
            instance.save()
        
        # Update other fields if user has permission
        if user.role in ['superadmin', 'tenant_admin']:
            assigned_to = validated_data.get('assigned_to')
            if assigned_to is not None:
                instance.assigned_to = assigned_to
                instance.save()
        
        return instance
