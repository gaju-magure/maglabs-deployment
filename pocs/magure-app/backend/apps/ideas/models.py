from django.db import models
from django.conf import settings

class Idea(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('refined', 'Refined'),
        ('in_development', 'In Development'),
        ('testing', 'Testing'),
        ('implemented', 'Implemented'),
        ('rejected', 'Rejected'),
        ('on_hold', 'On Hold'),
        ('needs_clarification', 'Needs Clarification'),
        ('approved', 'Approved'),
        ('archived', 'Archived'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='submitted')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ideas')
    is_pinned = models.BooleanField(default=False)
    
    # Workflow management fields
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_ideas',
        help_text="User assigned to work on this idea"
    )
    estimated_effort = models.CharField(
        max_length=20,
        choices=[
            ('small', 'Small (1-2 days)'),
            ('medium', 'Medium (1-2 weeks)'),
            ('large', 'Large (1+ months)'),
        ],
        null=True,
        blank=True,
        help_text="Estimated effort to implement"
    )
    business_value = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
        ],
        null=True,
        blank=True,
        help_text="Business value/impact"
    )
    implementation_notes = models.TextField(
        blank=True,
        help_text="Implementation notes and technical details"
    )
    rejection_reason = models.TextField(
        blank=True,
        help_text="Reason for rejection if status is rejected"
    )
    status_updated_at = models.DateTimeField(auto_now=True)
    status_updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='status_updated_ideas',
        help_text="User who last updated the status"
    )
    
    # Department and role context when idea was created
    department = models.ForeignKey(
        'tenants.TenantDepartment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ideas',
        help_text="Department of the user when idea was created"
    )
    custom_role = models.ForeignKey(
        'tenants.TenantRole',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ideas',
        help_text="Custom role of the user when idea was created"
    )

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    @property
    def like_count(self):
        return self.likes.count()
    
    def is_liked_by(self, user):
        if user.is_anonymous:
            return False
        return self.likes.filter(user=user).exists()
    
    def update_status(self, new_status, updated_by, notes=None):
        """
        Update the status of the idea with proper tracking
        """
        from django.utils import timezone
        
        if new_status not in dict(self.STATUS_CHOICES):
            raise ValueError(f"Invalid status: {new_status}")
        
        self.status = new_status
        self.status_updated_at = timezone.now()
        self.status_updated_by = updated_by
        
        if notes:
            if new_status == 'rejected':
                self.rejection_reason = notes
            else:
                self.implementation_notes = notes
        
        self.save()
    
    def can_transition_to(self, new_status, user):
        """
        Check if the idea can transition to the new status based on current state and user permissions
        """
        # Basic role-based permissions
        if user.role in ['admin', 'tenant_admin']:
            return True
        
        # Regular users can only update their own ideas to certain statuses
        if self.user == user:
            allowed_transitions = {
                'submitted': ['needs_clarification'],
                'needs_clarification': ['submitted'],
                'on_hold': ['submitted'],
            }
            return new_status in allowed_transitions.get(self.status, [])
        
        return False
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['created_at']),
            models.Index(fields=['assigned_to']),
        ]


class IdeaLike(models.Model):
    idea = models.ForeignKey(Idea, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='idea_likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['idea', 'user']
        
    def __str__(self):
        return f"{self.user.email} likes {self.idea.title}"
