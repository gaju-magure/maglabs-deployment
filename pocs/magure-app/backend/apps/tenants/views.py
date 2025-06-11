from rest_framework import mixins, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, OR, AllowAny
from apps.users.permissions import IsSuperAdmin, IsTenantAdmin, IsTenantUser
from rest_framework.views import APIView
from rest_framework.response import Response
from django_tenants.utils import schema_context
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import Tenant, TenantOnboarding
from .serializers import (
    TenantCreateSerializer, TenantInfoSerializer, OnboardingTokenSerializer,
    OnboardingStepSerializer, ProfileSetupSerializer, CompanyDetailsSerializer,
    PreferencesSerializer, SendInvitationSerializer
)
from services.email_service import EmailService

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

        tenant_name = tenant.name
        
        try:
            # Django-tenants with auto_drop_schema=True will automatically:
            # 1. Drop the PostgreSQL schema and all its data
            # 2. Delete the tenant model instance
            # 3. Clean up related Domain and TenantOnboarding records via CASCADE
            tenant.delete()
            
            return Response({
                'message': f'Tenant "{tenant_name}" deleted successfully. You can now create a new tenant with the same details.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Handle case where schema doesn't exist or other deletion errors
            error_str = str(e).lower()
            
            if 'does not exist' in error_str or 'schema' in error_str:
                # Schema doesn't exist, but we can still delete the tenant record
                # First, temporarily disable auto_drop_schema to avoid the error
                tenant.auto_drop_schema = False
                tenant.save()
                tenant.delete()
                
                return Response({
                    'message': f'Tenant "{tenant_name}" deleted successfully. Schema was already removed or never existed.'
                }, status=status.HTTP_200_OK)
            else:
                # Other unexpected errors
                return Response({
                    'error': f'Failed to delete tenant: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsSuperAdmin])
    def send_invitation(self, request, pk=None):
        """Send onboarding invitation to tenant admin"""
        tenant = self.get_object()
        
        if tenant.onboarding_status == Tenant.OnboardingStatus.COMPLETED:
            return Response(
                {'error': 'Tenant onboarding is already completed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if this is a resend (tenant already has in_progress status)
        is_resend = tenant.onboarding_status == Tenant.OnboardingStatus.IN_PROGRESS
        
        # Generate new onboarding token (always creates fresh token)
        token = tenant.generate_onboarding_token()
        
        # Mark email as sent in onboarding tracker
        try:
            onboarding = tenant.onboarding
            # Don't mark email_sent again if already marked (to preserve progress)
            if not onboarding.email_sent:
                onboarding.mark_step_completed('email_sent')
        except TenantOnboarding.DoesNotExist:
            TenantOnboarding.objects.create(tenant=tenant)
            onboarding = tenant.onboarding
            onboarding.mark_step_completed('email_sent')
        
        # Update tenant status
        tenant.onboarding_status = Tenant.OnboardingStatus.IN_PROGRESS
        tenant.save()
        
        # Send onboarding invitation email
        email_sent = EmailService.send_onboarding_invitation(tenant, token)
        
        action_message = 'resent' if is_resend else 'sent'
        
        if email_sent:
            return Response({
                'message': f'Onboarding invitation {action_message} successfully',
                'email_sent': True,
                'is_resend': is_resend,
                'admin_email': tenant.admin_email
            }, status=status.HTTP_200_OK)
        else:
            # Even if email fails, we still return success since the token is generated
            # This allows for manual sharing of the onboarding link
            return Response({
                'message': f'Onboarding invitation prepared for {action_message}, but email delivery failed',
                'email_sent': False,
                'is_resend': is_resend,
                'token': str(token),  # Include token for manual sharing if email fails
                'admin_email': tenant.admin_email
            }, status=status.HTTP_200_OK)



class OnboardingVerifyTokenView(APIView):
    """Verify onboarding token and return tenant info"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OnboardingTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        tenant = Tenant.objects.get(onboarding_token=token)
        
        # Get tenant info with onboarding progress
        tenant_info = TenantInfoSerializer(tenant).data
        
        return Response({
            'tenant': tenant_info,
            'valid': True
        }, status=status.HTTP_200_OK)


class OnboardingProfileSetupView(APIView):
    """Handle tenant admin profile setup"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ProfileSetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        tenant = Tenant.objects.get(onboarding_token=token)
        
        # Update admin user profile in tenant schema
        with schema_context(tenant.schema_name):
            User = get_user_model()
            admin_user = User.objects.filter(role='tenant_admin').first()
            
            if admin_user:
                admin_user.first_name = serializer.validated_data['first_name']
                admin_user.last_name = serializer.validated_data['last_name']
                admin_user.set_password(serializer.validated_data['password'])
                admin_user.save()
        
        # Mark profile setup as completed
        onboarding = tenant.onboarding
        onboarding.mark_step_completed('profile_setup')
        
        return Response({
            'message': 'Profile setup completed successfully'
        }, status=status.HTTP_200_OK)


class OnboardingCompanyDetailsView(APIView):
    """Handle tenant company details setup"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = CompanyDetailsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        tenant = Tenant.objects.get(onboarding_token=token)
        
        # Update tenant with company details
        tenant.name = serializer.validated_data['company_name']
        tenant.save()
        
        # You could save additional company details in a separate model
        # For now, we'll just mark the step as completed
        onboarding = tenant.onboarding
        onboarding.mark_step_completed('company_details')
        
        return Response({
            'message': 'Company details saved successfully'
        }, status=status.HTTP_200_OK)


class OnboardingPreferencesView(APIView):
    """Handle tenant preferences setup"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PreferencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        tenant = Tenant.objects.get(onboarding_token=token)
        
        # Save preferences (you might want to create a TenantPreferences model)
        # For now, we'll just mark the step as completed
        onboarding = tenant.onboarding
        onboarding.mark_step_completed('preferences')
        
        # Check if onboarding is now completed and send notification email
        is_completed = tenant.onboarding_status == Tenant.OnboardingStatus.COMPLETED
        if is_completed:
            EmailService.send_onboarding_completion_notification(tenant)
        
        return Response({
            'message': 'Preferences saved successfully',
            'onboarding_completed': is_completed
        }, status=status.HTTP_200_OK)


class OnboardingStatusView(APIView):
    """Get onboarding status for a token"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OnboardingTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        tenant = Tenant.objects.get(onboarding_token=token)
        
        try:
            onboarding = tenant.onboarding
            return Response({
                'tenant_name': tenant.name,
                'onboarding_status': tenant.onboarding_status,
                'completion_percentage': onboarding.completion_percentage,
                'completed_steps': onboarding.completed_steps,
                'total_steps': onboarding.total_steps,
                'steps': {
                    'email_sent': onboarding.email_sent,
                    'profile_setup': onboarding.profile_setup_completed,
                    'company_details': onboarding.company_details_completed,
                    'preferences': onboarding.preferences_completed
                }
            }, status=status.HTTP_200_OK)
        except TenantOnboarding.DoesNotExist:
            return Response({
                'error': 'Onboarding record not found'
            }, status=status.HTTP_404_NOT_FOUND)
