from rest_framework import serializers
from .models import Idea, IdeaLike, ChatSession, ChatMessage, ChatTemplate
from apps.tenants.models import TenantDepartment, TenantRole
from django.db import models

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


# Chat Serializers

class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages with formatted timestamps"""
    
    formatted_time = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'role', 'content', 'message_type', 
            'ai_metadata', 'sequence_number', 'created_at',
            'formatted_time', 'is_processed', 'processing_status'
        ]
        read_only_fields = ['id', 'sequence_number', 'created_at', 'formatted_time']
    
    def get_formatted_time(self, obj):
        """Return human-readable timestamp"""
        return obj.created_at.strftime("%I:%M %p")


class ChatSessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for session lists"""
    
    message_count = serializers.IntegerField(read_only=True)
    last_message_preview = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'title', 'status',
            'message_count', 'last_message_preview', 'time_ago',
            'is_idea_submitted', 'last_activity_at', 'created_at'
        ]
    
    def get_last_message_preview(self, obj):
        """Get preview of last user message"""
        last_msg = obj.messages.filter(role='user').last()
        if last_msg:
            content = last_msg.content
            return content[:80] + "..." if len(content) > 80 else content
        return "No messages yet"
    
    def get_time_ago(self, obj):
        """Return relative time like '2 hours ago'"""
        from django.utils.timesince import timesince
        return timesince(obj.last_activity_at) + " ago"


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    """Full serializer with messages for session detail view"""
    
    messages = ChatMessageSerializer(many=True, read_only=True)
    submitted_idea_details = serializers.SerializerMethodField()
    can_submit_idea = serializers.BooleanField(read_only=True)
    template_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'title', 'status',
            'maglabs_session_id', 'current_stage', 'stage_progress',
            'conversation_health', 'business_context', 'context_metadata',
            'interview_mode', 'interview_type', 'target_stages', 'completed_stages',
            'interview_goals', 'template', 'template_details',
            'messages', 'submitted_idea_details', 'can_submit_idea',
            'is_idea_submitted', 'message_count', 'total_tokens_used',
            'created_at', 'updated_at', 'last_activity_at'
        ]
    
    def get_submitted_idea_details(self, obj):
        """Return details of submitted idea if exists"""
        if obj.submitted_idea:
            return IdeaListSerializer(obj.submitted_idea, context=self.context).data
        return None
    
    def get_template_details(self, obj):
        """Return template details if session was created from template"""
        if obj.template:
            return {
                'id': obj.template.id,
                'name': obj.template.name,
                'description': obj.template.description,
                'conversation_goals': obj.template.conversation_goals
            }
        return None


class ChatSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new chat sessions"""
    
    template_id = serializers.UUIDField(required=False, write_only=True)
    initial_message = serializers.CharField(required=False, write_only=True)
    interview_mode = serializers.BooleanField(required=False, default=False)
    interview_goals = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = ChatSession
        fields = ['title', 'template_id', 'initial_message', 
                 'interview_mode', 'interview_goals']
    
    def create(self, validated_data):
        template_id = validated_data.pop('template_id', None)
        initial_message = validated_data.pop('initial_message', None)
        interview_mode = validated_data.pop('interview_mode', False)
        interview_goals = validated_data.pop('interview_goals', '')
        
        user = self.context['request'].user
        
        # Get template if provided
        template = None
        if template_id:
            try:
                template = ChatTemplate.objects.get(id=template_id, is_active=True)
                # Use template's initial message if no custom message provided
                if not initial_message:
                    initial_message = template.initial_prompt
                # Set interview configuration from template
                if interview_mode:
                    validated_data['interview_type'] = template.maglabs_interview_type
                    validated_data['target_stages'] = template.expected_stages
                    if not interview_goals:
                        interview_goals = template.conversation_goals
            except ChatTemplate.DoesNotExist:
                template = None
        
        # Build context metadata for MagLabs - include unique identifiers to force fresh sessions
        import uuid
        from django.utils import timezone
        
        context_metadata = {
            'user_role': user.role,
            'user_name': user.get_full_name() or user.username,
            'department': user.department.name if user.department else None,
            'department_id': user.department.id if user.department else None,
            'custom_role': user.custom_role.name if user.custom_role else None,
            'custom_role_id': user.custom_role.id if user.custom_role else None,
            # NEW: Force unique MagLabs sessions for each Django session  
            'session_timestamp': timezone.now().isoformat(),
            'unique_identifier': str(uuid.uuid4()),
        }
        
        # Create session
        session = ChatSession.objects.create(
            user=user,
            context_metadata=context_metadata,
            template=template,
            interview_mode=interview_mode,
            interview_goals=interview_goals,
            **validated_data
        )
        
        # Add Django session ID to context after session creation
        session.context_metadata['django_session_id'] = str(session.id)
        session.save()
        
        # If initial_message provided, create it and get AI response
        if initial_message:
            from services.ai_services.maglabs_service import MagLabsService
            from utils.auth_utils import get_jwt_token_from_request
            
            # Create user message
            user_message = ChatMessage.objects.create(
                session=session,
                role='user',
                content=initial_message,
                message_type='text',
                sequence_number=1
            )
            
            try:
                # Extract JWT token from request for authentication forwarding
                auth_token = get_jwt_token_from_request(self.context.get('request'))
                
                # Get AI response to initialize MagLabs session
                ai_service = MagLabsService(auth_token=auth_token)
                ai_response_data = ai_service.create_session(
                    user_context=session.context_metadata,
                    template=template,
                    initial_message=initial_message,
                    auth_token=auth_token
                )
                
                # Create AI response message
                ai_message = ChatMessage.objects.create(
                    session=session,
                    role='assistant',
                    content=ai_response_data['content'],
                    message_type='text',
                    sequence_number=2,
                    ai_metadata=ai_response_data.get('metadata', {})
                )
                
                # Update session with MagLabs data
                session.maglabs_session_id = ai_response_data.get('session_id')
                session.current_stage = ai_response_data.get('stage', 'user_profiling')
                session.stage_progress = ai_response_data.get('stage_progress', 0.0)
                session.conversation_health = ai_response_data.get('conversation_health', 'good')
                session.business_context = ai_response_data.get('business_context', {})
                session.message_count = 2
                
            except Exception as e:
                # If AI service fails, just track the user message
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to initialize MagLabs session: {e}")
                session.message_count = 1
            
            session.save()
        
        return session


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending messages in a chat session"""
    
    content = serializers.CharField()
    message_type = serializers.ChoiceField(
        choices=['text', 'idea_draft', 'question'],
        default='text'
    )
    
    def validate_content(self, value):
        """Ensure message is not empty"""
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty")
        return value.strip()


class SubmitIdeaFromChatSerializer(serializers.Serializer):
    """Serializer for converting chat to idea"""
    
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    priority = serializers.ChoiceField(
        choices=['low', 'medium', 'high', 'critical'],
        default='medium'
    )
    
    def validate(self, data):
        """Ensure session hasn't already submitted an idea"""
        session = self.context['session']
        if session.is_idea_submitted:
            raise serializers.ValidationError("This chat has already been submitted as an idea")
        return data


class ChatTemplateSerializer(serializers.ModelSerializer):
    """Serializer for chat templates with MagLabs configuration"""
    
    department_name = serializers.CharField(source='department.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatTemplate
        fields = [
            'id', 'name', 'description',
            'initial_prompt', 'maglabs_interview_type', 'expected_stages', 
            'stage_prompts', 'conversation_goals', 'temperature', 'focus_stages',
            'is_active', 'department', 'department_name', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        """Return name of user who created this template"""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class ChatTemplateListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for template listings"""
    
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = ChatTemplate
        fields = [
            'id', 'name', 'description',
            'conversation_goals', 'department_name', 'created_at'
        ]


