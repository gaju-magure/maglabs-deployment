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

    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'status', 'created_at', 'updated_at', 'user_email', 'user_name', 
            'user_profile', 'department_name', 'custom_role_name', 'is_pinned', 'like_count', 'is_liked'
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

class IdeaDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_profile = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    custom_role_name = serializers.CharField(source='custom_role.name', read_only=True)
    like_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'description', 'status', 'created_at', 'updated_at', 'user_email', 
            'user_name', 'user_profile', 'department_name', 'custom_role_name', 'is_pinned', 'like_count', 'is_liked'
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

class IdeaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idea
        fields = ['title', 'description', 'status']

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
        fields = ['title', 'description', 'status']
