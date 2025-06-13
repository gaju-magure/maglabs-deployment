from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

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


class ChatSession(models.Model):
    """
    Represents a chat conversation session similar to ChatGPT threads.
    Each session can contain multiple messages and may result in an idea submission.
    """
    
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('archived', 'Archived'),
        ('deleted', 'Deleted'),
    ]
    
    # Primary key as UUID for better API security
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Session metadata
    title = models.CharField(
        max_length=255, 
        default="New Chat",
        help_text="Session title, auto-generated or user-defined"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active'
    )
    
    # User relationship - respects tenant boundaries
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='chat_sessions'
    )
    
    # MagLabs Integration Fields
    maglabs_session_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="MagLabs API session ID for conversation tracking"
    )
    current_stage = models.CharField(
        max_length=50,
        default='user_profiling',
        help_text="Current conversation stage in MagLabs interview flow"
    )
    stage_progress = models.FloatField(
        default=0.0,
        help_text="Progress through current stage (0.0 to 1.0)"
    )
    conversation_health = models.CharField(
        max_length=20,
        default='good',
        help_text="Conversation health status from MagLabs"
    )
    business_context = models.JSONField(
        default=dict,
        help_text="Business context data from MagLabs API"
    )
    
    # Interview Mode Configuration
    interview_mode = models.BooleanField(
        default=False,
        help_text="Whether this session is in structured interview mode"
    )
    interview_type = models.CharField(
        max_length=50,
        blank=True,
        help_text="Type of interview flow (business_idea, problem_analysis, etc.)"
    )
    target_stages = models.JSONField(
        default=list,
        help_text="Stages this session aims to complete"
    )
    completed_stages = models.JSONField(
        default=list,
        help_text="Stages that have been completed"
    )
    interview_goals = models.TextField(
        blank=True,
        help_text="Specific objectives for this interview session"
    )
    
    # Template relationship
    template = models.ForeignKey(
        'ChatTemplate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Template used to create this session"
    )
    
    # Context from user profile
    context_metadata = models.JSONField(
        default=dict,
        help_text="Stores department, role, and other user context"
    )
    
    # Idea submission tracking
    submitted_idea = models.ForeignKey(
        'Idea',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_chat_session',
        help_text="The idea created from this chat session"
    )
    is_idea_submitted = models.BooleanField(default=False)
    
    # Session analytics
    message_count = models.PositiveIntegerField(default=0)
    total_tokens_used = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-last_activity_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['last_activity_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity_at = timezone.now()
        self.save(update_fields=['last_activity_at'])
    
    def can_submit_idea(self):
        """Check if this session can be converted to an idea"""
        return not self.is_idea_submitted and self.message_count > 0


class ChatMessage(models.Model):
    """
    Individual messages within a chat session.
    Supports user messages, AI responses, and system messages.
    """
    
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    MESSAGE_TYPES = [
        ('text', 'Text Message'),
        ('idea_draft', 'Idea Draft'),
        ('refinement', 'Refinement Suggestion'),
        ('question', 'Clarifying Question'),
        ('submission', 'Submission Confirmation'),
        ('error', 'Error Message'),
    ]
    
    # Primary key and relationships
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    
    # Message content
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPES,
        default='text'
    )
    
    # AI response metadata
    ai_metadata = models.JSONField(
        default=dict,
        help_text="Stores model info, tokens used, processing time, etc."
    )
    
    # Message organization
    sequence_number = models.PositiveIntegerField(
        help_text="Order of message within session"
    )
    parent_message = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies',
        help_text="For threaded conversations"
    )
    
    # Processing status
    is_processed = models.BooleanField(default=True)
    processing_status = models.CharField(
        max_length=50,
        default='completed',
        help_text="Status of AI processing"
    )
    error_message = models.TextField(
        blank=True,
        help_text="Error details if processing failed"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['sequence_number']
        unique_together = ['session', 'sequence_number']
        indexes = [
            models.Index(fields=['session', 'sequence_number']),
            models.Index(fields=['created_at']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class ChatTemplate(models.Model):
    """
    Enhanced templates for starting conversations with MagLabs integration.
    Templates configure conversation behavior and expected interview stages.
    """
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    initial_prompt = models.TextField(
        help_text="The first message to start the conversation"
    )
    
    # MagLabs Integration Fields
    maglabs_interview_type = models.CharField(
        max_length=50,
        default='business_idea',
        help_text="Type of interview flow in MagLabs API"
    )
    expected_stages = models.JSONField(
        default=list,
        help_text="List of stages this template expects to complete"
    )
    stage_prompts = models.JSONField(
        default=dict,
        help_text="Custom prompts or instructions for specific stages"
    )
    conversation_goals = models.TextField(
        blank=True,
        help_text="What this template aims to achieve"
    )
    
    # Template Configuration
    temperature = models.FloatField(
        default=0.7,
        help_text="AI creativity level (0.0-2.0)"
    )
    focus_stages = models.JSONField(
        default=list,
        help_text="Stages to emphasize in this conversation type"
    )
    
    # Administrative fields
    is_active = models.BooleanField(default=True)
    department = models.ForeignKey(
        'tenants.TenantDepartment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Department-specific template"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who created this template"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['department', 'is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    def get_maglabs_config(self):
        """Get MagLabs configuration for this template"""
        return {
            'interview_type': self.maglabs_interview_type,
            'expected_stages': self.expected_stages,
            'stage_prompts': self.stage_prompts,
            'temperature': self.temperature,
            'focus_stages': self.focus_stages,
            'conversation_goals': self.conversation_goals
        }


