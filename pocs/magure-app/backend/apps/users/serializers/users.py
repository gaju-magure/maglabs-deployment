from rest_framework import serializers
from django.contrib.auth import get_user_model

UserModel = get_user_model()

class UserListSerializer(serializers.ModelSerializer):
    profile_avatar = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = UserModel
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 
                  'is_active', 'profile_avatar', 'department_name']
    
    def get_profile_avatar(self, obj):
        if hasattr(obj, 'profile') and obj.profile.profile_avatar:
            return obj.profile.profile_avatar.url
        return None

class UserDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    custom_role = serializers.SerializerMethodField()
    
    class Meta:
        model = UserModel
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 
                  'is_active', 'department', 'custom_role', 'profile']
    
    def get_profile(self, obj):
        if hasattr(obj, 'profile'):
            return {
                'job_title': obj.profile.job_title,
                'phone_number': obj.profile.phone_number,
                'bio': obj.profile.bio,
                'linkedin_url': obj.profile.linkedin_url,
                'profile_avatar': obj.profile.profile_avatar.url if obj.profile.profile_avatar else None,
                'timezone': obj.profile.timezone,
                'hire_date': obj.profile.hire_date,
            }
        return None
    
    def get_department(self, obj):
        if obj.department:
            return {
                'id': obj.department.id,
                'name': obj.department.name
            }
        return None
    
    def get_custom_role(self, obj):
        if obj.custom_role:
            return {
                'id': obj.custom_role.id,
                'name': obj.custom_role.name
            }
        return None

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    department_id = serializers.IntegerField(required=False, allow_null=True)
    custom_role_id = serializers.IntegerField(required=False, allow_null=True)
    job_title = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = UserModel
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role',
                  'department_id', 'custom_role_id', 'job_title', 'phone_number']

    def create(self, validated_data):
        # Extract profile fields
        job_title = validated_data.pop('job_title', '')
        phone_number = validated_data.pop('phone_number', '')
        department_id = validated_data.pop('department_id', None)
        custom_role_id = validated_data.pop('custom_role_id', None)
        
        # Extract password
        password = validated_data.pop('password')
        
        # Create user
        user = UserModel(**validated_data)
        user.set_password(password)
        
        # Set department and custom role
        if department_id:
            user.department_id = department_id
        if custom_role_id:
            user.custom_role_id = custom_role_id
            
        user.save()
        
        # Update profile with additional fields
        if hasattr(user, 'profile'):
            user.profile.job_title = job_title
            user.profile.phone_number = phone_number
            user.profile.save()
        
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    department_id = serializers.IntegerField(required=False, allow_null=True)
    custom_role_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = UserModel
        fields = ['first_name', 'last_name', 'email', 'role', 'is_active',
                  'department_id', 'custom_role_id']
    
    def update(self, instance, validated_data):
        # Handle department and custom role updates
        if 'department_id' in validated_data:
            instance.department_id = validated_data.pop('department_id')
        if 'custom_role_id' in validated_data:
            instance.custom_role_id = validated_data.pop('custom_role_id')
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance
