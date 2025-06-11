from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    """
    Custom user with a `role` field. It lives in:
      - public.accounts_user    (for superadmins or any public-level tenant_admin)
      - <tenant>.accounts_user  (for that tenant's admins/users)

    Roles:
      - superadmin    → global superuser (public schema only)
      - tenant_admin  → per-tenant admin (staff inside a tenant schema)
      - tenant_user   → regular user inside a tenant schema
    """
    ROLE_CHOICES = [
        ("superadmin",   "Super Admin"),
        ("tenant_admin", "Tenant Admin"),
        ("tenant_user",  "Tenant User"),
    ]
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="tenant_user",
        help_text="'superadmin' for global; 'tenant_admin' or 'tenant_user' inside each tenant."
    )

    def is_tenant_admin(self):
        return self.role == "tenant_admin"
    
    # Link to tenant department
    department = models.ForeignKey(
        'tenants.TenantDepartment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members'
    )
    
    # Link to custom tenant role (in addition to base role)
    custom_role = models.ForeignKey(
        'tenants.TenantRole',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )


class UserProfile(models.Model):
    """Extended user profile with professional and personal information"""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    
    # Professional Information
    job_title = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    
    # Personal Information
    bio = models.TextField(max_length=500, blank=True)
    linkedin_url = models.URLField(blank=True)
    
    # Profile Picture
    profile_avatar = models.ImageField(
        upload_to='user_avatars/%Y/%m/%d/', 
        null=True, 
        blank=True,
        help_text="Profile picture (max 5MB)"
    )
    
    # Location & Preferences
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Employment Details
    hire_date = models.DateField(null=True, blank=True)
    manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='direct_reports'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f"Profile for {self.user.get_full_name() or self.user.username}"


# Signal to create UserProfile automatically when User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile when a new User is created"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile when the User is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()
