from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from .models import UserProfile
from apps.users.serializers import (
    UserListSerializer,
    UserDetailSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserBasicCreateSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    UserProfileAvatarSerializer,
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
            # Use basic serializer for superadmins, full serializer for tenant admins
            if self.request.user.role == "superadmin":
                return UserBasicCreateSerializer
            else:
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
    
    @action(detail=True, methods=['get', 'put', 'patch'], url_path='profile')
    def profile(self, request, pk=None):
        """Get or update user profile"""
        user = self.get_object()
        
        if request.method == 'GET':
            # Get or create profile if it doesn't exist
            profile, created = UserProfile.objects.get_or_create(user=user)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        
        else:  # PUT or PATCH
            # Check permissions - users can only update their own profile
            if request.user.role not in ['superadmin', 'tenant_admin'] and user.id != request.user.id:
                return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
            # Get or create profile if it doesn't exist
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            serializer = UserProfileUpdateSerializer(
                profile, 
                data=request.data, 
                partial=(request.method == 'PATCH')
            )
            if serializer.is_valid():
                serializer.save()
                return Response(UserProfileSerializer(profile).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(
        detail=True, 
        methods=['post'], 
        url_path='profile/avatar',
        parser_classes=[MultiPartParser, FormParser]
    )
    def upload_avatar(self, request, pk=None):
        """Upload profile avatar"""
        user = self.get_object()
        
        # Check permissions
        if request.user.role not in ['superadmin', 'tenant_admin'] and user.id != request.user.id:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get or create profile if it doesn't exist
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        serializer = UserProfileAvatarSerializer(profile, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Avatar uploaded successfully',
                'avatar_url': profile.profile_avatar.url if profile.profile_avatar else None
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'], url_path='profile/avatar')
    def delete_avatar(self, request, pk=None):
        """Delete profile avatar"""
        user = self.get_object()
        
        # Check permissions
        if request.user.role not in ['superadmin', 'tenant_admin'] and user.id != request.user.id:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get or create profile if it doesn't exist
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        if profile.profile_avatar:
            profile.profile_avatar.delete(save=True)
            return Response({'message': 'Avatar deleted successfully'})
        
        return Response({'message': 'No avatar to delete'}, status=status.HTTP_400_BAD_REQUEST)
