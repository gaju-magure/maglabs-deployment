from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending emails"""
    
    @staticmethod
    def send_onboarding_invitation(tenant, token):
        """
        Send onboarding invitation email to tenant admin
        
        Args:
            tenant: Tenant instance
            token: Onboarding token (UUID)
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Get primary domain for the tenant
            from apps.tenants.models import Domain
            primary_domain = Domain.objects.filter(tenant=tenant, is_primary=True).first()
            if not primary_domain:
                logger.error(f"No primary domain found for tenant {tenant.name}")
                return False
            
            # Construct onboarding URL
            onboarding_url = f"https://{primary_domain.domain}/onboarding/{token}"
            
            # Email context
            context = {
                'tenant_name': tenant.name,
                'admin_email': tenant.admin_email,
                'onboarding_url': onboarding_url,
                'support_email': getattr(settings, 'DEFAULT_FROM_EMAIL', 'support@maglabs.com'),
                'company_name': 'MagLabs',
                'token_expiry_hours': 48
            }
            
            # Render email templates
            subject = f"Welcome to {context['company_name']} - Complete Your Setup"
            html_message = render_to_string('emails/onboarding_invitation.html', context)
            plain_message = render_to_string('emails/onboarding_invitation.txt', context)
            
            # Send email
            success = send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[tenant.admin_email],
                html_message=html_message,
                fail_silently=False
            )
            
            if success:
                logger.info(f"Onboarding invitation sent to {tenant.admin_email} for tenant {tenant.name}")
                return True
            else:
                logger.error(f"Failed to send onboarding invitation to {tenant.admin_email}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending onboarding invitation: {str(e)}")
            return False
    
    @staticmethod
    def send_onboarding_completion_notification(tenant):
        """
        Send notification when onboarding is completed
        
        Args:
            tenant: Tenant instance
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Get primary domain for the tenant
            from apps.tenants.models import Domain
            primary_domain = Domain.objects.filter(tenant=tenant, is_primary=True).first()
            if not primary_domain:
                logger.error(f"No primary domain found for tenant {tenant.name}")
                return False
            
            # Dashboard URL
            dashboard_url = f"https://{primary_domain.domain}/dashboard"
            
            # Email context
            context = {
                'tenant_name': tenant.name,
                'admin_email': tenant.admin_email,
                'dashboard_url': dashboard_url,
                'support_email': getattr(settings, 'DEFAULT_FROM_EMAIL', 'support@maglabs.com'),
                'company_name': 'MagLabs'
            }
            
            # Render email templates
            subject = f"Welcome to {context['company_name']} - Setup Complete!"
            html_message = render_to_string('emails/onboarding_completion.html', context)
            plain_message = render_to_string('emails/onboarding_completion.txt', context)
            
            # Send email
            success = send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[tenant.admin_email],
                html_message=html_message,
                fail_silently=False
            )
            
            if success:
                logger.info(f"Onboarding completion notification sent to {tenant.admin_email} for tenant {tenant.name}")
                return True
            else:
                logger.error(f"Failed to send onboarding completion notification to {tenant.admin_email}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending onboarding completion notification: {str(e)}")
            return False