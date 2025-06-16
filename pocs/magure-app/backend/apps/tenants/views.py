from rest_framework import mixins, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, OR, AllowAny
from apps.users.permissions import IsSuperAdmin, IsTenantAdmin, IsTenantUser
from rest_framework.views import APIView
from rest_framework.response import Response
from django_tenants.utils import schema_context
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import Tenant
from .serializers import (
    TenantCreateSerializer, TenantInfoSerializer,
    TenantBrandingSerializer, TenantBrandingCreateUpdateSerializer,
    DefaultThemeTemplateSerializer, TenantAssetSerializer
)
from .onboarding_serializers import (
    OnboardingTokenSerializer,
    ProfileSetupSerializer, CompanyDetailsSerializer,
    PreferencesSerializer, OnboardingStatusSerializer, 
    OnboardingStepSerializer
)
from .onboarding_models import TenantProfile, AdminProfile, WorkspacePreferences, OnboardingProgress
from .branding_models import TenantBranding, DefaultThemeTemplate, TenantAsset
from config.domain_config import get_frontend_url, get_dashboard_url
from django.utils import timezone
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
        
        # Check if schema exists before attempting deletion
        schema_exists = self._check_schema_exists(tenant.schema_name)
        
        try:
            if schema_exists:
                # Schema exists, proceed with normal deletion
                tenant.delete()
            else:
                # Schema doesn't exist, delete tenant record directly
                self._delete_tenant_record_only(tenant)
            
            return Response({
                'message': f'Tenant "{tenant_name}" deleted successfully. You can now create a new tenant with the same details.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Handle case where schema doesn't exist or other deletion errors
            error_str = str(e).lower()
            
            if 'does not exist' in error_str or 'schema' in error_str:
                # Schema doesn't exist, but we can still delete the tenant record
                # Use raw SQL to bypass Django's schema creation logic
                try:
                    from django.db import connection
                    
                    # Get tenant ID before deletion
                    tenant_id = tenant.id
                    
                    # Delete tenant record directly from database to avoid schema operations
                    with connection.cursor() as cursor:
                        # Delete related records first (CASCADE should handle this, but being explicit)
                        cursor.execute("DELETE FROM tenants_domain WHERE tenant_id = %s", [tenant_id])
                        cursor.execute("DELETE FROM tenant_profiles WHERE tenant_id = %s", [tenant_id])
                        cursor.execute("DELETE FROM workspace_preferences WHERE tenant_id = %s", [tenant_id])
                        cursor.execute("DELETE FROM onboarding_progress WHERE tenant_id = %s", [tenant_id])
                        # Delete the tenant record
                        cursor.execute("DELETE FROM tenants_tenant WHERE id = %s", [tenant_id])
                    
                    return Response({
                        'message': f'Tenant "{tenant_name}" deleted successfully. Schema was already removed or never existed.'
                    }, status=status.HTTP_200_OK)
                    
                except Exception as inner_e:
                    return Response({
                        'error': f'Failed to delete tenant record: {str(inner_e)}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                # Other unexpected errors
                return Response({
                    'error': f'Failed to delete tenant: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _check_schema_exists(self, schema_name):
        """Check if a PostgreSQL schema exists"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = %s)",
                    [schema_name]
                )
                return cursor.fetchone()[0]
        except Exception:
            return False
    
    def _delete_tenant_record_only(self, tenant):
        """Delete tenant record directly from database without schema operations"""
        from django.db import connection
        
        tenant_id = tenant.id
        
        # Delete tenant record directly from database to avoid schema operations
        with connection.cursor() as cursor:
            # Delete related records first (domains, onboarding progress, etc.)
            cursor.execute("DELETE FROM tenants_domain WHERE tenant_id = %s", [tenant_id])
            cursor.execute("DELETE FROM tenant_profiles WHERE tenant_id = %s", [tenant_id])
            cursor.execute("DELETE FROM workspace_preferences WHERE tenant_id = %s", [tenant_id])
            cursor.execute("DELETE FROM onboarding_progress WHERE tenant_id = %s", [tenant_id])
            # Delete the main tenant record
            cursor.execute("DELETE FROM tenants_tenant WHERE id = %s", [tenant_id])
    
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
        
        # Mark email as sent in enhanced onboarding tracker
        try:
            progress = tenant.onboarding_progress
        except OnboardingProgress.DoesNotExist:
            progress = OnboardingProgress.objects.create(
                tenant=tenant,
                session_id='',
                ip_address='',
                user_agent='system_invitation'
            )
        
        # Mark email step as completed if not already done
        if 'EMAIL_INVITATION' not in progress.completed_steps:
            progress.mark_step_completed('EMAIL_INVITATION')
        
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
    """Verify onboarding token and return tenant info with environment-aware URLs"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OnboardingTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        tenant = Tenant.objects.get(onboarding_token=token)
        
        # Get or create onboarding progress tracker
        progress, created = OnboardingProgress.objects.get_or_create(
            tenant=tenant,
            defaults={
                'session_id': request.session.session_key or '',
                'ip_address': self._get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', '')
            }
        )
        
        # Prepare response with environment info
        environment_info = {
            'frontend_url': get_frontend_url(tenant.schema_name),
            'dashboard_url': get_dashboard_url(tenant.schema_name),
            'api_domain': request.get_host(),
            'is_development': 'localhost' in request.get_host() or '127.0.0.1' in request.get_host()
        }
        
        # Get tenant info with onboarding progress
        tenant_info = TenantInfoSerializer(tenant).data
        
        return Response({
            'tenant': tenant_info,
            'valid': True,
            'onboarding_progress': {
                'current_step': progress.current_step,
                'completion_percentage': progress.completion_percentage,
                'completed_steps': progress.completed_steps,
                'total_steps': progress.total_steps,
                'can_edit_steps': {step[0]: progress.can_edit_step(step[0]) for step in OnboardingProgress.STEPS}
            },
            'environment_info': environment_info
        }, status=status.HTTP_200_OK)
    
    def _get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip



class OnboardingProfileSetupView(APIView):
    """Enhanced tenant admin profile setup"""
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
                # Update basic profile and set password
                admin_user.first_name = serializer.validated_data['first_name']
                admin_user.last_name = serializer.validated_data['last_name']
                admin_user.set_password(serializer.validated_data['password'])
                admin_user.save()
                
                # Create or update admin profile with enhanced data
                admin_profile, created = AdminProfile.objects.get_or_create(
                    user=admin_user,
                    defaults={
                        'job_title': serializer.validated_data.get('job_title', ''),
                        'department': serializer.validated_data.get('department', ''),
                        'phone_number': serializer.validated_data.get('phone_number', ''),
                        'linkedin_profile': serializer.validated_data.get('linkedin_profile', ''),
                        'preferred_language': serializer.validated_data.get('preferred_language', 'en'),
                        'two_factor_enabled': serializer.validated_data.get('two_factor_enabled', False),
                    }
                )
                
                # Handle profile avatar if provided
                if 'profile_avatar' in serializer.validated_data:
                    admin_profile.profile_avatar = serializer.validated_data['profile_avatar']
                    admin_profile.save()
        
        # Mark profile setup as completed and store step data
        progress = tenant.onboarding_progress
        step_data = {
            'first_name': serializer.validated_data['first_name'],
            'last_name': serializer.validated_data['last_name'],
            'job_title': serializer.validated_data.get('job_title', ''),
            'department': serializer.validated_data.get('department', ''),
            'preferred_language': serializer.validated_data.get('preferred_language', 'en'),
        }
        progress.mark_step_completed('PROFILE_SETUP', step_data)
        
        return Response({
            'message': 'Admin profile setup completed successfully',
            'next_step': progress.current_step,
            'completion_percentage': progress.completion_percentage
        }, status=status.HTTP_200_OK)


class OnboardingCompanyDetailsView(APIView):
    """Enhanced tenant company details setup"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = CompanyDetailsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        tenant = Tenant.objects.get(onboarding_token=token)
        
        # Update tenant with basic company details
        tenant.name = serializer.validated_data['company_name']
        tenant.save()
        
        # Create or update tenant profile with enhanced company details
        tenant_profile, created = TenantProfile.objects.get_or_create(
            tenant=tenant,
            defaults={
                'company_website': serializer.validated_data.get('company_website', ''),
                'company_description': serializer.validated_data.get('company_description', ''),
                'business_type': serializer.validated_data.get('business_type', 'B2B'),
                'annual_revenue_range': serializer.validated_data.get('annual_revenue_range', ''),
                'founded_year': serializer.validated_data.get('founded_year'),
                'primary_contact_phone': serializer.validated_data.get('primary_contact_phone', ''),
                'street_address': serializer.validated_data.get('street_address', ''),
                'city': serializer.validated_data.get('city', ''),
                'state_province': serializer.validated_data.get('state_province', ''),
                'postal_code': serializer.validated_data.get('postal_code', ''),
                'country': serializer.validated_data.get('country', ''),
            }
        )
        
        # Handle company logo if provided
        if 'company_logo' in serializer.validated_data:
            tenant_profile.company_logo = serializer.validated_data['company_logo']
            tenant_profile.save()
        
        # Mark company details as completed and store step data
        progress = tenant.onboarding_progress
        step_data = {
            'company_name': serializer.validated_data['company_name'],
            'company_size': serializer.validated_data['company_size'],
            'industry': serializer.validated_data['industry'],
            'business_type': serializer.validated_data.get('business_type', 'B2B'),
            'country': serializer.validated_data.get('country', ''),
            'city': serializer.validated_data.get('city', ''),
        }
        progress.mark_step_completed('COMPANY_DETAILS', step_data)
        
        return Response({
            'message': 'Company details saved successfully',
            'next_step': progress.current_step,
            'completion_percentage': progress.completion_percentage
        }, status=status.HTTP_200_OK)


class OnboardingPreferencesView(APIView):
    """Enhanced tenant workspace preferences setup"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PreferencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        tenant = Tenant.objects.get(onboarding_token=token)
        
        # Create or update workspace preferences
        workspace_prefs, created = WorkspacePreferences.objects.get_or_create(
            tenant=tenant,
            defaults={
                'currency': serializer.validated_data.get('currency', 'USD'),
                'number_format': serializer.validated_data.get('number_format', 'US'),
                'first_day_of_week': serializer.validated_data.get('first_day_of_week', 'MONDAY'),
                'work_start_time': serializer.validated_data.get('work_start_time', '09:00'),
                'work_end_time': serializer.validated_data.get('work_end_time', '17:00'),
                'work_days': serializer.validated_data.get('work_days', [0, 1, 2, 3, 4]),
                'auto_logout_minutes': serializer.validated_data.get('auto_logout_minutes', 480),
                'enabled_modules': serializer.validated_data.get('enabled_modules', ['ideas', 'dashboard']),
                'email_provider': serializer.validated_data.get('email_provider', ''),
                'calendar_integration_enabled': serializer.validated_data.get('calendar_integration_enabled', False),
                'slack_integration_enabled': serializer.validated_data.get('slack_integration_enabled', False),
                'data_retention_days': serializer.validated_data.get('data_retention_days', 365),
                'backup_frequency': serializer.validated_data.get('backup_frequency', 'WEEKLY'),
            }
        )
        
        # Mark workspace configuration as completed and store step data
        progress = tenant.onboarding_progress
        step_data = {
            'timezone': serializer.validated_data.get('timezone', 'UTC'),
            'currency': serializer.validated_data.get('currency', 'USD'),
            'date_format': serializer.validated_data.get('date_format', 'MM/DD/YYYY'),
            'theme': serializer.validated_data.get('theme', 'system'),
            'notifications_enabled': serializer.validated_data.get('notifications_enabled', True),
            'enabled_modules': serializer.validated_data.get('enabled_modules', ['ideas', 'dashboard']),
        }
        progress.mark_step_completed('PREFERENCES', step_data)
        
        # Check if onboarding is now completed
        if progress.current_step == 'COMPLETE':
            # Update tenant onboarding status and set completion timestamp
            tenant.onboarding_status = Tenant.OnboardingStatus.COMPLETED
            tenant.onboarding_completed_at = timezone.now()
            tenant.save()
            
            # Send completion notification email
            EmailService.send_onboarding_completion_notification(tenant)
            
            is_completed = True
        else:
            is_completed = False
        
        return Response({
            'message': 'Workspace preferences saved successfully',
            'next_step': progress.current_step,
            'completion_percentage': progress.completion_percentage,
            'onboarding_completed': is_completed,
            'dashboard_url': get_dashboard_url(tenant.schema_name) if is_completed else None
        }, status=status.HTTP_200_OK)


class OnboardingStatusView(APIView):
    """Get comprehensive onboarding status for a token"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OnboardingTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        tenant = Tenant.objects.get(onboarding_token=token)
        
        try:
            progress = tenant.onboarding_progress
            
            # Prepare environment info
            environment_info = {
                'frontend_url': get_frontend_url(tenant.schema_name),
                'dashboard_url': get_dashboard_url(tenant.schema_name),
                'api_domain': request.get_host(),
                'is_development': 'localhost' in request.get_host() or '127.0.0.1' in request.get_host()
            }
            
            # Prepare step editing capabilities
            can_edit_steps = {step[0]: progress.can_edit_step(step[0]) for step in OnboardingProgress.STEPS}
            
            status_data = {
                'tenant_name': tenant.name,
                'onboarding_status': tenant.onboarding_status,
                'current_step': progress.current_step,
                'completion_percentage': progress.completion_percentage,
                'completed_steps': progress.completed_steps,
                'total_steps': progress.total_steps,
                'can_edit_steps': can_edit_steps,
                'step_data': progress.step_data,
                'environment_info': environment_info,
                'last_activity': progress.last_activity_at,
                'started_at': progress.started_at,
                'completed_at': progress.completed_at
            }
            
            response = OnboardingStatusSerializer(status_data)
            return Response(response.data, status=status.HTTP_200_OK)
            
        except OnboardingProgress.DoesNotExist:
            # Create new progress tracker if it doesn't exist
            progress = OnboardingProgress.objects.create(
                tenant=tenant,
                session_id=request.session.session_key or '',
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Return initial status
            environment_info = {
                'frontend_url': get_frontend_url(tenant.schema_name),
                'dashboard_url': get_dashboard_url(tenant.schema_name),
                'api_domain': request.get_host(),
                'is_development': 'localhost' in request.get_host() or '127.0.0.1' in request.get_host()
            }
            
            status_data = {
                'tenant_name': tenant.name,
                'onboarding_status': tenant.onboarding_status,
                'current_step': 'WELCOME',
                'completion_percentage': 0,
                'completed_steps': [],
                'total_steps': 6,
                'can_edit_steps': {'WELCOME': True},
                'step_data': {},
                'environment_info': environment_info,
                'last_activity': progress.last_activity_at,
                'started_at': progress.started_at,
                'completed_at': None
            }
            
            response = OnboardingStatusSerializer(status_data)
            return Response(response.data, status=status.HTTP_200_OK)
    
    def _get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class OnboardingStepManagementView(APIView):
    """Handle individual step completion and editing"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Complete or update a specific onboarding step"""
        serializer = OnboardingStepSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        step_name = serializer.validated_data['step_name']
        step_data = serializer.validated_data.get('step_data', {})
        
        tenant = Tenant.objects.get(onboarding_token=token)
        progress = tenant.onboarding_progress
        
        # Check if step can be edited
        if not progress.can_edit_step(step_name):
            return Response({
                'error': f'Step {step_name} cannot be edited at this time'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark step as completed with data
        progress.mark_step_completed(step_name, step_data)
        
        return Response({
            'message': f'Step {step_name} completed successfully',
            'current_step': progress.current_step,
            'completion_percentage': progress.completion_percentage,
            'next_step': progress.current_step if progress.current_step != 'COMPLETE' else None
        }, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update data for a previously completed step"""
        serializer = EnhancedOnboardingStepSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        step_name = serializer.validated_data['step_name']
        step_data = serializer.validated_data.get('step_data', {})
        
        tenant = Tenant.objects.get(onboarding_token=token)
        progress = tenant.onboarding_progress
        
        # Check if step can be edited
        if not progress.can_edit_step(step_name):
            return Response({
                'error': f'Step {step_name} cannot be edited at this time'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update step data
        progress.step_data[step_name] = step_data
        progress.save()
        
        return Response({
            'message': f'Step {step_name} updated successfully',
            'step_data': progress.get_step_data(step_name)
        }, status=status.HTTP_200_OK)
    
    def get(self, request):
        """Get data for a specific step"""
        token = request.query_params.get('token')
        step_name = request.query_params.get('step_name')
        
        if not token or not step_name:
            return Response({
                'error': 'Both token and step_name are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tenant = Tenant.objects.get(onboarding_token=token)
            progress = tenant.onboarding_progress
            
            step_data = progress.get_step_data(step_name)
            is_completed = progress.is_step_completed(step_name)
            can_edit = progress.can_edit_step(step_name)
            
            return Response({
                'step_name': step_name,
                'step_data': step_data,
                'is_completed': is_completed,
                'can_edit': can_edit
            }, status=status.HTTP_200_OK)
            
        except Tenant.DoesNotExist:
            return Response({
                'error': 'Invalid onboarding token'
            }, status=status.HTTP_404_NOT_FOUND)
        except OnboardingProgress.DoesNotExist:
            return Response({
                'error': 'Onboarding progress not found'
            }, status=status.HTTP_404_NOT_FOUND)


class TenantBrandingViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tenant branding"""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TenantBrandingCreateUpdateSerializer
        return TenantBrandingSerializer
    
    def get_queryset(self):
        # Only return branding for current tenant
        return TenantBranding.objects.filter(tenant=self.request.tenant)
    
    def get_object(self):
        # Get or create branding for current tenant
        branding, created = TenantBranding.objects.get_or_create(
            tenant=self.request.tenant,
            defaults={
                'setup_source': 'admin_panel',
                'customization_level': 'basic'
            }
        )
        return branding
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['tenant'] = self.request.tenant
        return context
    
    def list(self, request, *args, **kwargs):
        """Get current tenant's branding configuration"""
        branding = self.get_object()
        serializer = self.get_serializer(branding)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Create or update tenant branding"""
        branding = self.get_object()
        serializer = self.get_serializer(branding, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        response_serializer = TenantBrandingSerializer(branding)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    def update(self, request, *args, **kwargs):
        """Update tenant branding"""
        return self.create(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Partially update tenant branding"""
        return self.create(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def apply_template(self, request):
        """Apply a theme template to tenant branding"""
        template_id = request.data.get('template_id')
        if not template_id:
            return Response(
                {'error': 'template_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            template = DefaultThemeTemplate.objects.get(
                template_id=template_id, 
                is_active=True
            )
        except DefaultThemeTemplate.DoesNotExist:
            return Response(
                {'error': 'Template not found or inactive'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        branding = self.get_object()
        branding.apply_template(template)
        
        serializer = TenantBrandingSerializer(branding)
        return Response({
            'message': f'Template "{template.template_name}" applied successfully',
            'branding': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def reset_to_default(self, request):
        """Reset branding to default template"""
        default_template = DefaultThemeTemplate.get_default_template()
        if not default_template:
            return Response(
                {'error': 'No default template available'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        branding = self.get_object()
        branding.apply_template(default_template)
        
        serializer = TenantBrandingSerializer(branding)
        return Response({
            'message': 'Branding reset to default template',
            'branding': serializer.data
        })


class DefaultThemeTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for browsing available theme templates"""
    serializer_class = DefaultThemeTemplateSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get_queryset(self):
        return DefaultThemeTemplate.objects.filter(is_active=True).order_by(
            '-popularity_score', 'template_name'
        )
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get available template categories"""
        categories = DefaultThemeTemplate.objects.filter(
            is_active=True
        ).values_list('template_category', flat=True).distinct()
        
        return Response({
            'categories': list(categories)
        })
    
    @action(detail=False, methods=['get'])
    def industries(self, request):
        """Get available target industries"""
        # Get all unique industries from target_industries JSON arrays
        templates = DefaultThemeTemplate.objects.filter(is_active=True)
        industries = set()
        
        for template in templates:
            if template.target_industries:
                industries.update(template.target_industries)
        
        return Response({
            'industries': sorted(list(industries))
        })
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get template recommendations based on tenant profile"""
        # Try to get tenant's industry from company profile
        try:
            tenant_profile = self.request.tenant.profile
            company_details = tenant_profile.business_type or 'general'
            
            recommended_templates = DefaultThemeTemplate.get_recommendations_for_industry(
                company_details.lower()
            )
            
            serializer = self.get_serializer(recommended_templates, many=True)
            return Response({
                'recommendations': serializer.data,
                'based_on': company_details
            })
            
        except Exception:
            # Fallback to popular templates
            popular_templates = self.get_queryset()[:3]
            serializer = self.get_serializer(popular_templates, many=True)
            return Response({
                'recommendations': serializer.data,
                'based_on': 'popularity'
            })


class TenantAssetViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tenant assets (logos, images)"""
    serializer_class = TenantAssetSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get_queryset(self):
        # Get branding for current tenant
        try:
            branding = TenantBranding.objects.get(tenant=self.request.tenant)
            return TenantAsset.objects.filter(tenant_branding=branding)
        except TenantBranding.DoesNotExist:
            return TenantAsset.objects.none()
    
    def perform_create(self, serializer):
        # Ensure asset is associated with current tenant's branding
        branding, created = TenantBranding.objects.get_or_create(
            tenant=self.request.tenant,
            defaults={
                'setup_source': 'admin_panel',
                'customization_level': 'basic'
            }
        )
        serializer.save(
            tenant_branding=branding,
            uploaded_by=self.request.user
        )
