# ChatGPT-like Chat System Implementation Plan

## Executive Summary

This document provides a comprehensive implementation plan for building a ChatGPT-like chat interface within the Magure multi-tenant application. The system will enable users to have AI-powered conversations for idea brainstorming and refinement, with the ability to submit refined ideas to the content wall.

**Important Note**: This implementation uses the MagLabs VLLM API service at `localhost:8001/v1/chat/completions` which is a fully OpenAI-compatible API with additional features like multi-agent interviews, session persistence, and metadata support. The API runs with authentication disabled (`DISABLE_AUTH=true`), so no API keys or auth tokens are required. We can modify the Django backend's `OpenAIService` to fully leverage these capabilities.

## Architecture Overview

### Service Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   Frontend (React)  │────▶│   Backend (Django)   │────▶│  AI Service (FastAPI)│
│   - TypeScript      │     │   - Django REST      │     │  localhost:8001     │
│   - TanStack Query  │     │   - Multi-tenant     │     │  /v1/chat/completions│
│   - Tailwind CSS    │     │   - PostgreSQL       │     │  - Session mgmt     │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
```

### Key Features

1. **Multiple Chat Sessions**: Users can create and manage multiple conversation threads
2. **Persistent Conversations**: Chat history is stored and retrievable
3. **AI-Powered Refinement**: Integration with MagLabs VLLM API for advanced idea refinement
4. **Multi-Agent Interview System**: Leverages the API's 8-stage interview process for comprehensive idea development
5. **Session Persistence**: Maintains AI service session context across requests
6. **Idea Submission**: Convert chat conversations into structured ideas
7. **Department/Role Context**: AI responses consider user's organizational context
8. **Rich Metadata**: Full token usage, processing time, and AI model tracking
9. **Interview Mode**: Special mode for guided idea development with expert questioning
10. **Rich UI**: ChatGPT-like interface with session sidebar and message bubbles

## Phase 1: Database Design

### New Django Models

```python
# backend/apps/ideas/models.py - Add these models

import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class ChatSession(models.Model):
    """
    Represents a chat conversation session similar to ChatGPT threads.
    Each session can contain multiple messages and may result in an idea submission.
    """
    
    CONVERSATION_TYPES = [
        ('brainstorm', 'Brainstorming'),
        ('refine', 'Idea Refinement'),
        ('general', 'General Chat'),
        ('problem_solving', 'Problem Solving'),
        ('feature_design', 'Feature Design'),
    ]
    
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
    conversation_type = models.CharField(
        max_length=20, 
        choices=CONVERSATION_TYPES, 
        default='general'
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
    
    # AI Configuration
    system_prompt = models.TextField(
        blank=True,
        help_text="Custom system prompt for this session"
    )
    ai_model = models.CharField(
        max_length=50,
        default='gpt-4o-mini',
        help_text="AI model used for this session"
    )
    
    # Context from user profile
    context_metadata = models.JSONField(
        default=dict,
        help_text="Stores department, role, and other context"
    )
    
    # AI session tracking for MagLabs API features
    ai_metadata = models.JSONField(
        default=dict,
        help_text="Stores interview session ID, stage, and other AI service metadata"
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
    Predefined templates for starting conversations.
    Helps users begin productive chat sessions.
    """
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    conversation_type = models.CharField(
        max_length=20,
        choices=ChatSession.CONVERSATION_TYPES
    )
    initial_prompt = models.TextField(
        help_text="The first message to start the conversation"
    )
    system_prompt_override = models.TextField(
        blank=True,
        help_text="Custom system prompt for this template"
    )
    is_active = models.BooleanField(default=True)
    
    # Templates can be global or department-specific
    department = models.ForeignKey(
        'tenants.TenantDepartment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Department-specific template"
    )
    
    class Meta:
        ordering = ['name']
```

### Database Migration Strategy

```python
# Generated migration file
# backend/apps/ideas/migrations/0005_chatsession_chatmessage_chattemplate.py

from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):
    dependencies = [
        ('ideas', '0004_idealike'),
        ('tenants', '0009_tenantdepartment_tenantrole'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChatSession',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('title', models.CharField(default='New Chat', max_length=255)),
                ('conversation_type', models.CharField(choices=[('brainstorm', 'Brainstorming'), ('refine', 'Idea Refinement'), ('general', 'General Chat'), ('problem_solving', 'Problem Solving'), ('feature_design', 'Feature Design')], default='general', max_length=20)),
                ('status', models.CharField(choices=[('active', 'Active'), ('archived', 'Archived'), ('deleted', 'Deleted')], default='active', max_length=20)),
                ('system_prompt', models.TextField(blank=True)),
                ('ai_model', models.CharField(default='gpt-4o-mini', max_length=50)),
                ('context_metadata', models.JSONField(default=dict)),
                ('is_idea_submitted', models.BooleanField(default=False)),
                ('message_count', models.PositiveIntegerField(default=0)),
                ('total_tokens_used', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_activity_at', models.DateTimeField(auto_now=True)),
                ('submitted_idea', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='source_chat_session', to='ideas.idea')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chat_sessions', to='auth.user')),
            ],
            options={
                'ordering': ['-last_activity_at'],
            },
        ),
        # Add remaining migrations...
    ]
```

## Phase 2: Backend API Implementation

### API Serializers

```python
# backend/apps/ideas/serializers.py - Add these serializers

from rest_framework import serializers
from .models import ChatSession, ChatMessage, ChatTemplate

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
            'id', 'title', 'conversation_type', 'status',
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
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'title', 'conversation_type', 'status',
            'system_prompt', 'ai_model', 'context_metadata',
            'messages', 'submitted_idea_details', 'can_submit_idea',
            'is_idea_submitted', 'message_count', 'total_tokens_used',
            'created_at', 'updated_at', 'last_activity_at'
        ]
    
    def get_submitted_idea_details(self, obj):
        """Return details of submitted idea if exists"""
        if obj.submitted_idea:
            from .serializers import IdeaSerializer
            return IdeaSerializer(obj.submitted_idea, context=self.context).data
        return None


class ChatSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new chat sessions"""
    
    template_id = serializers.UUIDField(required=False, write_only=True)
    
    class Meta:
        model = ChatSession
        fields = ['title', 'conversation_type', 'template_id']
    
    def create(self, validated_data):
        template_id = validated_data.pop('template_id', None)
        user = self.context['request'].user
        
        # Build context metadata
        context_metadata = {
            'user_role': user.role,
            'user_name': user.get_full_name() or user.username,
            'department': user.department.name if user.department else None,
            'department_id': user.department.id if user.department else None,
            'custom_role': user.custom_role.name if user.custom_role else None,
            'custom_role_id': user.custom_role.id if user.custom_role else None,
        }
        
        # Create session
        session = ChatSession.objects.create(
            user=user,
            context_metadata=context_metadata,
            **validated_data
        )
        
        # If template provided, create initial message
        if template_id:
            try:
                template = ChatTemplate.objects.get(id=template_id, is_active=True)
                if template.system_prompt_override:
                    session.system_prompt = template.system_prompt_override
                    session.save()
                
                # Create initial user message from template
                ChatMessage.objects.create(
                    session=session,
                    role='user',
                    content=template.initial_prompt,
                    message_type='text',
                    sequence_number=1
                )
                session.message_count = 1
                session.save()
            except ChatTemplate.DoesNotExist:
                pass
        
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
```

### API ViewSets and Endpoints

```python
# backend/apps/ideas/views.py - Add these ViewSets

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
import json

class ChatSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing chat sessions.
    Provides CRUD operations and custom actions for AI interaction.
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter sessions by current user and active status"""
        queryset = ChatSession.objects.filter(
            user=self.request.user
        ).annotate(
            message_count=Count('messages')
        )
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        else:
            # Default to non-deleted sessions
            queryset = queryset.exclude(status='deleted')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(messages__content__icontains=search)
            ).distinct()
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return ChatSessionListSerializer
        elif self.action == 'create':
            return ChatSessionCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return ChatSessionDetailSerializer
        return ChatSessionSerializer
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """
        Send a message to the chat and get AI response.
        This is the core interaction endpoint.
        """
        session = self.get_object()
        serializer = SendMessageSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user message
        last_sequence = session.messages.aggregate(
            max_seq=models.Max('sequence_number')
        )['max_seq'] or 0
        
        user_message = ChatMessage.objects.create(
            session=session,
            role='user',
            content=serializer.validated_data['content'],
            message_type=serializer.validated_data['message_type'],
            sequence_number=last_sequence + 1,
            is_processed=True
        )
        
        # Update session
        session.message_count += 1
        session.update_activity()
        
        # Get AI response
        try:
            ai_service = OpenAIService()
            
            # Build conversation history
            conversation_history = self._build_conversation_history(session)
            
            # Add current message
            conversation_history.append({
                'role': 'user',
                'content': user_message.content
            })
            
            # Get AI response using the enhanced chat_completion method
            ai_response_data = ai_service.chat_completion(
                messages=conversation_history,
                session_context=session.context_metadata,
                session_id=session.ai_metadata.get('interview_session_id') if session.ai_metadata else None
            )
            
            # Create AI message
            ai_message = ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=ai_response_data['content'],
                message_type='text',
                sequence_number=last_sequence + 2,
                ai_metadata=ai_response_data['metadata'],
                is_processed=True
            )
            
            # Update session with AI metadata (interview session tracking)
            if ai_response_data.get('interview_session_id'):
                session.ai_metadata = {
                    'interview_session_id': ai_response_data['interview_session_id'],
                    'interview_stage': ai_response_data['metadata'].get('interview_stage'),
                    'last_updated': timezone.now().isoformat()
                }
            
            # Update token usage if available
            if 'usage' in ai_response_data['metadata']:
                session.total_tokens_used += ai_response_data['metadata']['usage'].get('total_tokens', 0)
            
            session.message_count += 1
            session.save()
            
            # Return both messages
            return Response({
                'user_message': ChatMessageSerializer(user_message).data,
                'ai_message': ChatMessageSerializer(ai_message).data,
                'session_updated': ChatSessionDetailSerializer(session, context={'request': request}).data
            })
            
        except Exception as e:
            # Create error message
            error_message = ChatMessage.objects.create(
                session=session,
                role='system',
                content=f"Sorry, I encountered an error: {str(e)}",
                message_type='error',
                sequence_number=last_sequence + 2,
                is_processed=True,
                processing_status='failed',
                error_message=str(e)
            )
            
            return Response({
                'user_message': ChatMessageSerializer(user_message).data,
                'error_message': ChatMessageSerializer(error_message).data,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def submit_as_idea(self, request, pk=None):
        """
        Convert the chat session into a structured idea submission.
        """
        session = self.get_object()
        serializer = SubmitIdeaFromChatSerializer(
            data=request.data,
            context={'session': session}
        )
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the idea
        idea = Idea.objects.create(
            title=serializer.validated_data['title'],
            description=serializer.validated_data['description'],
            priority=serializer.validated_data['priority'],
            user=session.user,
            department=session.user.department,
            custom_role=session.user.custom_role,
            status='submitted'
        )
        
        # Link session to idea
        session.submitted_idea = idea
        session.is_idea_submitted = True
        session.save()
        
        # Create confirmation message
        ChatMessage.objects.create(
            session=session,
            role='system',
            content=f"Your idea '{idea.title}' has been successfully submitted!",
            message_type='submission',
            sequence_number=session.messages.count() + 1
        )
        
        return Response({
            'idea': IdeaSerializer(idea, context={'request': request}).data,
            'session': ChatSessionDetailSerializer(session, context={'request': request}).data,
            'message': 'Idea submitted successfully!'
        })
    
    @action(detail=True, methods=['post'])
    def regenerate_response(self, request, pk=None):
        """
        Regenerate the last AI response in the conversation.
        """
        session = self.get_object()
        
        # Find last AI message
        last_ai_message = session.messages.filter(role='assistant').last()
        if not last_ai_message:
            return Response({'error': 'No AI response to regenerate'}, status=400)
        
        # Find the user message before it
        user_message = session.messages.filter(
            sequence_number__lt=last_ai_message.sequence_number,
            role='user'
        ).last()
        
        if not user_message:
            return Response({'error': 'No user message found'}, status=400)
        
        # Delete the last AI message
        last_ai_message.delete()
        session.message_count -= 1
        
        # Generate new response
        return self.send_message(request, pk=pk)
    
    @action(detail=True, methods=['patch'])
    def update_title(self, request, pk=None):
        """Update session title"""
        session = self.get_object()
        new_title = request.data.get('title', '').strip()
        
        if not new_title:
            return Response({'error': 'Title cannot be empty'}, status=400)
        
        session.title = new_title
        session.save()
        
        return Response({'title': session.title})
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a chat session"""
        session = self.get_object()
        session.status = 'archived'
        session.save()
        return Response({'status': 'archived'})
    
    @action(detail=True, methods=['post'])
    def start_interview(self, request, pk=None):
        """
        Start an AI interview session for comprehensive idea development.
        This leverages the MagLabs API's multi-agent interview system.
        """
        session = self.get_object()
        initial_message = request.data.get('message', 'I have a business idea I want to develop')
        
        try:
            ai_service = OpenAIService()
            result = ai_service.trigger_interview_mode(
                initial_message=initial_message,
                user_context=session.context_metadata
            )
            
            # Create the initial message
            last_sequence = session.messages.aggregate(
                max_seq=models.Max('sequence_number')
            )['max_seq'] or 0
            
            user_message = ChatMessage.objects.create(
                session=session,
                role='user',
                content=initial_message,
                message_type='text',
                sequence_number=last_sequence + 1
            )
            
            # Create AI response
            ai_message = ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=result['content'],
                message_type='text',
                sequence_number=last_sequence + 2,
                ai_metadata=result['metadata']
            )
            
            # Update session metadata
            if result.get('interview_session_id'):
                session.ai_metadata = {
                    'interview_session_id': result['interview_session_id'],
                    'interview_stage': result['metadata'].get('interview_stage'),
                    'interview_mode': True,
                    'started_at': timezone.now().isoformat()
                }
                session.conversation_type = 'refine'  # Switch to refinement mode
            
            session.message_count += 2
            session.save()
            
            return Response({
                'user_message': ChatMessageSerializer(user_message).data,
                'ai_message': ChatMessageSerializer(ai_message).data,
                'session': ChatSessionDetailSerializer(session, context={'request': request}).data,
                'interview_started': bool(result.get('interview_session_id'))
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to start interview: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _build_conversation_history(self, session):
        """
        Build conversation history in format expected by AI service.
        """
        messages = []
        
        # Add system prompt if exists
        if session.system_prompt:
            messages.append({
                'role': 'system',
                'content': session.system_prompt
            })
        
        # Add all messages in order
        for message in session.messages.filter(
            role__in=['user', 'assistant']
        ).order_by('sequence_number'):
            messages.append({
                'role': message.role,
                'content': message.content
            })
        
        return messages


class ChatTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for chat templates.
    Read-only access to predefined conversation starters.
    """
    
    serializer_class = ChatTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter templates by department and active status"""
        user = self.request.user
        return ChatTemplate.objects.filter(
            Q(department=None) | Q(department=user.department),
            is_active=True
        )
```

### Enhanced AI Service Integration

```python
# backend/services/ai_services/openai_service.py - Enhanced to leverage MagLabs VLLM API features

import logging
import httpx
import json
import re
from django.utils import timezone
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

class OpenAIService:
    """
    Enhanced AI service that fully leverages the MagLabs VLLM API.
    The API is OpenAI-compatible with additional features like:
    - Multi-agent interview system
    - Session persistence
    - Metadata support
    - Streaming capabilities
    """
    
    def __init__(self):
        self.api_base_url = 'http://localhost:8001/v1/chat/completions'
        self.default_model = "gpt-4o-mini"
        self.timeout = 30.0
        
    def chat_completion(self, 
                       messages: List[Dict[str, str]], 
                       session_id: Optional[str] = None,
                       session_context: Optional[Dict] = None,
                       stream: bool = False,
                       temperature: float = 0.7,
                       max_tokens: Optional[int] = None) -> Dict[str, Any]:
        """
        Get chat completion from MagLabs VLLM API.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            session_id: Optional session ID for interview continuity
            session_context: User context (department, role, etc.)
            stream: Whether to stream the response
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dict with 'content', 'metadata', and optional 'interview_session_id'
        """
        
        # Build contextual system prompt
        enhanced_messages = self._enhance_messages_with_context(messages, session_context)
        
        # Prepare payload following OpenAI format
        payload = {
            "model": self.default_model,
            "messages": enhanced_messages,
            "temperature": temperature,
            "stream": stream,
            "top_p": 1.0,
            "presence_penalty": 0.0,
            "frequency_penalty": 0.0,
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
            
        # Add metadata for potential interview context
        if session_context:
            payload["metadata"] = {
                "user_context": session_context,
                "chat_type": "idea_refinement"
            }
        
        headers = {'Content-Type': 'application/json'}
        
        # Add interview session header if continuing a session
        if session_id:
            headers['X-Interview-Session-ID'] = session_id
        
        # Note: MagLabs VLLM API runs with DISABLE_AUTH=true, so no auth headers needed
        
        try:
            start_time = timezone.now()
            
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    self.api_base_url,
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
                
            end_time = timezone.now()
            processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
            
            # Parse response
            data = response.json()
            
            if not data.get("choices") or len(data["choices"]) == 0:
                raise ValueError("No valid response from AI service")
                
            # Extract content and metadata
            choice = data["choices"][0]
            content = choice["message"]["content"]
            
            # Build comprehensive metadata
            metadata = {
                'id': data.get('id'),
                'model': data.get('model', self.default_model),
                'created': data.get('created'),
                'finish_reason': choice.get('finish_reason'),
                'usage': data.get('usage', {}),
                'processing_time_ms': processing_time_ms,
                'timestamp': timezone.now().isoformat()
            }
            
            # Check for interview headers in response
            interview_session_id = response.headers.get('X-Interview-Session-ID')
            interview_stage = response.headers.get('X-Interview-Stage')
            
            if interview_session_id:
                metadata['interview_session_id'] = interview_session_id
                metadata['interview_stage'] = interview_stage
            
            return {
                'content': content,
                'metadata': metadata,
                'interview_session_id': interview_session_id
            }
            
        except httpx.TimeoutException:
            logger.error("AI service request timed out")
            raise Exception("The AI service is taking too long to respond. Please try again.")
        except httpx.HTTPStatusError as e:
            logger.error(f"AI service HTTP error: {e.response.status_code}")
            error_detail = e.response.json() if e.response.content else {}
            raise Exception(f"AI service error: {error_detail.get('detail', e.response.status_code)}")
        except Exception as e:
            logger.error(f"Unexpected error in chat completion: {str(e)}")
            raise
    
    def refine_idea(self, idea_text: str, conversation_history: Optional[List[Dict]] = None) -> str:
        """
        Legacy method maintained for backward compatibility.
        Now uses the enhanced chat_completion internally.
        """
        messages = self._build_refinement_prompt(idea_text, conversation_history)
        
        try:
            result = self.chat_completion(messages, temperature=0.7, max_tokens=512)
            return result['content']
        except Exception as e:
            logger.error(f"Error in refine_idea: {e}")
            return "Sorry, there was an error refining your idea. Please try again later."
    
    def score_idea(self, idea_text: str) -> Optional[Dict[str, int]]:
        """
        Score an idea using structured output from the AI.
        """
        messages = [
            {
                "role": "system",
                "content": "You are an expert at evaluating business ideas. Respond only with valid JSON."
            },
            {
                "role": "user",
                "content": (
                    f"Score the following idea on a scale of 1-10 for each category:\n"
                    f"- Clarity: How clear and well-defined is the idea?\n"
                    f"- Creativity: How innovative and unique is the idea?\n"
                    f"- Feasibility: How practical and achievable is the idea?\n"
                    f"- Relevance: How relevant is the idea to current market needs?\n\n"
                    f"Respond in this exact JSON format:\n"
                    f'{{"clarity": 8, "creativity": 7, "feasibility": 9, "relevance": 8}}\n\n'
                    f"Idea: {idea_text}"
                )
            }
        ]
        
        try:
            result = self.chat_completion(messages, temperature=0.2, max_tokens=256)
            content = result['content']
            
            # Extract JSON from response
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            else:
                logger.warning(f"Score idea response not in JSON format: {content}")
                return None
        except Exception as e:
            logger.error(f"Error scoring idea: {e}")
            return None
    
    def _enhance_messages_with_context(self, 
                                     messages: List[Dict[str, str]], 
                                     session_context: Optional[Dict]) -> List[Dict[str, str]]:
        """
        Enhance messages with contextual system prompt based on user information.
        """
        enhanced_messages = []
        
        # Build context-aware system prompt
        system_prompt = self._build_contextual_system_prompt(session_context)
        
        # Add our enhanced system prompt first
        enhanced_messages.append({
            "role": "system",
            "content": system_prompt
        })
        
        # Add all messages, skipping any existing system messages
        for msg in messages:
            if msg['role'] != 'system':
                enhanced_messages.append(msg)
        
        return enhanced_messages
    
    def _build_contextual_system_prompt(self, session_context: Optional[Dict]) -> str:
        """
        Build a context-aware system prompt that helps the AI understand the user better.
        """
        base_prompt = """You are an expert product manager and innovation coach within a corporate environment. 
Your role is to help users refine and develop their ideas through constructive dialogue.

Key responsibilities:
1. Ask clarifying questions to understand the full scope of ideas
2. Identify potential challenges and suggest solutions  
3. Help structure ideas into actionable proposals
4. Consider technical feasibility and business value
5. Guide users toward clear, implementable solutions

Communication style:
- Be professional yet friendly
- Use clear, concise language
- Provide specific, actionable feedback
- Acknowledge good ideas and build upon them
- Be encouraging while maintaining realistic expectations"""

        if session_context:
            context_parts = []
            
            # Add user role context
            if session_context.get('user_role'):
                role_guidance = {
                    'superadmin': "The user is a system administrator with full platform oversight.",
                    'tenant_admin': "The user is an organizational administrator who oversees company initiatives.",
                    'tenant_user': "The user is a team member contributing ideas for organizational improvement."
                }.get(session_context['user_role'], "")
                if role_guidance:
                    context_parts.append(role_guidance)
            
            # Add department context
            if session_context.get('department'):
                context_parts.append(f"They work in the {session_context['department']} department.")
            
            # Add custom role context
            if session_context.get('custom_role'):
                context_parts.append(f"Their specific role is: {session_context['custom_role']}.")
            
            # Add user name for personalization
            if session_context.get('user_name'):
                name = session_context['user_name'].split()[0] if ' ' in session_context['user_name'] else session_context['user_name']
                context_parts.append(f"The user's name is {name}.")
            
            if context_parts:
                base_prompt += "\n\nUser Context:\n" + " ".join(context_parts)
                base_prompt += "\n\nUse this context to provide more relevant and personalized assistance."
        
        return base_prompt
    
    def _build_refinement_prompt(self, idea_text: str, conversation_history: Optional[List[Dict]] = None) -> List[Dict]:
        """
        Build messages for idea refinement (legacy support).
        """
        messages = []
        
        # Add system message
        messages.append({
            "role": "system",
            "content": (
                "You are an expert product manager and innovation coach. "
                "Help the user refine and improve their idea through a friendly, constructive chat. "
                "Ask clarifying questions, suggest improvements, and help them make the idea more actionable."
            )
        })
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add the current idea
        messages.append({
            "role": "user",
            "content": f"My idea: {idea_text}"
        })
        
        return messages
    
    def trigger_interview_mode(self, initial_message: str, user_context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Trigger the multi-agent interview mode for comprehensive idea development.
        This leverages the MagLabs API's interview capabilities.
        """
        messages = [
            {
                "role": "user",
                "content": initial_message
            }
        ]
        
        # The API will automatically detect interview intent and start the process
        return self.chat_completion(
            messages=messages,
            session_context=user_context,
            temperature=0.8  # Slightly higher for more creative responses
        )
```

### URL Configuration

```python
# backend/apps/ideas/urls.py - Update with new endpoints

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    IdeaViewSet, 
    ChatSessionViewSet, 
    ChatTemplateViewSet,
    refine_idea_view,
    submit_idea_view
)

router = DefaultRouter()
router.register(r'ideas', IdeaViewSet, basename='idea')
router.register(r'chat/sessions', ChatSessionViewSet, basename='chat-session')
router.register(r'chat/templates', ChatTemplateViewSet, basename='chat-template')

urlpatterns = [
    path('', include(router.urls)),
    
    # Legacy endpoints for backward compatibility
    path('refine/', refine_idea_view, name='refine-idea'),
    path('submit/', submit_idea_view, name='submit-idea'),
    
    # Chat-specific endpoints are handled by the ViewSet actions:
    # - POST /chat/sessions/{id}/send_message/
    # - POST /chat/sessions/{id}/submit_as_idea/
    # - POST /chat/sessions/{id}/regenerate_response/
    # - PATCH /chat/sessions/{id}/update_title/
    # - POST /chat/sessions/{id}/archive/
]
```

## Phase 3: Frontend Implementation

### TypeScript Interfaces and API Service

```typescript
// frontend/src/services/chatApi/index.ts

import { getBaseUrl } from "@/lib/utils";
import { Idea } from "../ideasApi";

// Type definitions
export interface ChatSession {
  id: string;
  title: string;
  conversation_type: 'brainstorm' | 'refine' | 'general' | 'problem_solving' | 'feature_design';
  status: 'active' | 'archived' | 'deleted';
  message_count: number;
  last_message_preview: string;
  time_ago: string;
  is_idea_submitted: boolean;
  last_activity_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: 'text' | 'idea_draft' | 'refinement' | 'question' | 'submission' | 'error';
  ai_metadata?: {
    model?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    timestamp?: string;
    finish_reason?: string;
    processing_time_ms?: number;
  };
  sequence_number: number;
  created_at: string;
  formatted_time: string;
  is_processed: boolean;
  processing_status: string;
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
  system_prompt: string;
  ai_model: string;
  context_metadata: {
    user_role: string;
    user_name: string;
    department?: string;
    department_id?: string;
    custom_role?: string;
    custom_role_id?: string;
  };
  submitted_idea_details?: Idea;
  can_submit_idea: boolean;
  total_tokens_used: number;
  updated_at: string;
}

export interface ChatTemplate {
  id: string;
  name: string;
  description: string;
  conversation_type: string;
  initial_prompt: string;
  department?: string;
}

export interface CreateSessionRequest {
  title?: string;
  conversation_type?: string;
  template_id?: string;
}

export interface SendMessageRequest {
  content: string;
  message_type?: 'text' | 'idea_draft' | 'question';
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  ai_message?: ChatMessage;
  error_message?: ChatMessage;
  session_updated: ChatSessionDetail;
  error?: string;
}

export interface SubmitIdeaRequest {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SubmitIdeaResponse {
  idea: Idea;
  session: ChatSessionDetail;
  message: string;
}

// Helper function for auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// API Functions

export async function listChatSessions(params?: {
  status?: string;
  search?: string;
}): Promise<ChatSession[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  
  const url = `${getBaseUrl()}/api/v1/ideas/chat/sessions/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat sessions');
  }
  
  return response.json();
}

export async function createChatSession(data: CreateSessionRequest): Promise<ChatSessionDetail> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/chat/sessions/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create chat session');
  }
  
  return response.json();
}

export async function getChatSession(id: string): Promise<ChatSessionDetail> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/chat/sessions/${id}/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat session');
  }
  
  return response.json();
}

export async function sendMessage(
  sessionId: string, 
  data: SendMessageRequest
): Promise<SendMessageResponse> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/send_message/`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send message');
  }
  
  return response.json();
}

export async function regenerateResponse(sessionId: string): Promise<SendMessageResponse> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/regenerate_response/`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to regenerate response');
  }
  
  return response.json();
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<{title: string}> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/update_title/`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to update session title');
  }
  
  return response.json();
}

export async function archiveSession(sessionId: string): Promise<{status: string}> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/archive/`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to archive session');
  }
  
  return response.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to delete session');
  }
}

export async function submitChatAsIdea(
  sessionId: string, 
  data: SubmitIdeaRequest
): Promise<SubmitIdeaResponse> {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/ideas/chat/sessions/${sessionId}/submit_as_idea/`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to submit idea');
  }
  
  return response.json();
}

export async function getChatTemplates(): Promise<ChatTemplate[]> {
  const response = await fetch(`${getBaseUrl()}/api/v1/ideas/chat/templates/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat templates');
  }
  
  return response.json();
}
```

### React Components

```typescript
// frontend/src/pages/Dashboard/ChatPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { getChatSession } from '@/services/chatApi';

export const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  
  const { data: session, isLoading } = useQuery({
    queryKey: ['chatSession', sessionId],
    queryFn: () => sessionId ? getChatSession(sessionId) : null,
    enabled: !!sessionId,
  });
  
  return (
    <ChatLayout>
      {sessionId && session ? (
        <ChatInterface session={session} />
      ) : (
        <EmptyChat onNewChat={(id) => navigate(`/dashboard/chat/${id}`)} />
      )}
    </ChatLayout>
  );
};

// frontend/src/components/chat/ChatLayout.tsx

import React from 'react';
import { ChatSessionSidebar } from './ChatSessionSidebar';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      <ChatSessionSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};

// frontend/src/components/chat/ChatSessionSidebar.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, MessageSquare, Archive, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  listChatSessions, 
  createChatSession, 
  archiveSession,
  type ChatSession 
} from '@/services/chatApi';

export const ChatSessionSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId?: string }>();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['chatSessions', showArchived ? 'archived' : 'active', searchQuery],
    queryFn: () => listChatSessions({
      status: showArchived ? 'archived' : undefined,
      search: searchQuery || undefined,
    }),
  });
  
  const createSessionMutation = useMutation({
    mutationFn: createChatSession,
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      navigate(`/dashboard/chat/${newSession.id}`);
    },
  });
  
  const archiveMutation = useMutation({
    mutationFn: archiveSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
  
  const handleNewChat = () => {
    createSessionMutation.mutate({
      title: 'New Chat',
      conversation_type: 'general',
    });
  };
  
  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const groups: Record<string, ChatSession[]> = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      Older: [],
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.last_activity_at);
      if (sessionDate >= today) {
        groups.Today.push(session);
      } else if (sessionDate >= yesterday) {
        groups.Yesterday.push(session);
      } else if (sessionDate >= weekAgo) {
        groups['Previous 7 Days'].push(session);
      } else if (sessionDate >= monthAgo) {
        groups['Previous 30 Days'].push(session);
      } else {
        groups.Older.push(session);
      }
    });
    
    return groups;
  };
  
  const sessionGroups = groupSessionsByDate(sessions);
  
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          disabled={createSessionMutation.isPending}
        >
          <Plus size={20} />
          New Chat
        </Button>
      </div>
      
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="search"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      {/* Session List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(sessionGroups).map(([groupName, groupSessions]) => {
            if (groupSessions.length === 0) return null;
            
            return (
              <div key={groupName} className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                  {groupName}
                </h3>
                {groupSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === sessionId}
                    onClick={() => navigate(`/dashboard/chat/${session.id}`)}
                    onArchive={() => archiveMutation.mutate(session.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive size={16} />
          {showArchived ? 'Show Active' : 'Show Archived'}
        </Button>
      </div>
    </div>
  );
};

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onArchive: () => void;
}

const SessionItem: React.FC<SessionItemProps> = ({ session, isActive, onClick, onArchive }) => {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-1 p-3 rounded-lg cursor-pointer transition-colors",
        isActive ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <MessageSquare size={16} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{session.title}</h4>
          <p className="text-xs text-gray-500 truncate">{session.last_message_preview}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{session.time_ago}</span>
        {session.is_idea_submitted && (
          <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">
            Submitted
          </span>
        )}
      </div>
    </div>
  );
};

// frontend/src/components/chat/ChatInterface.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, RefreshCw, Lightbulb, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChatMessage } from './ChatMessage';
import { SubmitIdeaDialog } from './SubmitIdeaDialog';
import { toast } from '@/components/ui/use-toast';
import {
  sendMessage,
  regenerateResponse,
  updateSessionTitle,
  type ChatSessionDetail,
  type SendMessageRequest,
} from '@/services/chatApi';

interface ChatInterfaceProps {
  session: ChatSessionDetail;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ session }) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const sendMessageMutation = useMutation({
    mutationFn: (data: SendMessageRequest) => sendMessage(session.id, data),
    onSuccess: (response) => {
      queryClient.setQueryData(['chatSession', session.id], response.session_updated);
      setMessage('');
      scrollToBottom();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const regenerateMutation = useMutation({
    mutationFn: () => regenerateResponse(session.id),
    onSuccess: (response) => {
      queryClient.setQueryData(['chatSession', session.id], response.session_updated);
    },
  });
  
  const updateTitleMutation = useMutation({
    mutationFn: (title: string) => updateSessionTitle(session.id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      queryClient.invalidateQueries({ queryKey: ['chatSession', session.id] });
    },
  });
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [session.messages]);
  
  const handleSend = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate({
      content: message.trim(),
      message_type: 'text',
    });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleEditTitle = () => {
    const newTitle = prompt('Enter new title:', session.title);
    if (newTitle && newTitle !== session.title) {
      updateTitleMutation.mutate(newTitle);
    }
  };
  
  const isProcessing = sendMessageMutation.isPending || regenerateMutation.isPending;
  
  return (
    <>
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{session.title}</h2>
            <p className="text-sm text-gray-500">
              {session.conversation_type.replace('_', ' ')} • {session.message_count} messages
            </p>
          </div>
          <div className="flex items-center gap-2">
            {session.can_submit_idea && !session.is_idea_submitted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubmitDialog(true)}
                className="gap-2"
              >
                <Lightbulb size={16} />
                Submit as Idea
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditTitle}>
                  Edit Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => regenerateMutation.mutate()}>
                  Regenerate Last Response
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Messages */}
        <ScrollArea className="flex-1 px-6">
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            {session.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="animate-spin" size={16} />
                <span>AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="min-h-[80px] pr-12 resize-none"
                disabled={isProcessing}
              />
              <Button
                size="icon"
                className="absolute bottom-2 right-2"
                onClick={handleSend}
                disabled={!message.trim() || isProcessing}
              >
                <Send size={16} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
      
      {/* Submit Idea Dialog */}
      {showSubmitDialog && (
        <SubmitIdeaDialog
          session={session}
          onClose={() => setShowSubmitDialog(false)}
          onSuccess={() => {
            setShowSubmitDialog(false);
            queryClient.invalidateQueries({ queryKey: ['chatSession', session.id] });
            toast({
              title: "Success",
              description: "Your idea has been submitted successfully!",
            });
          }}
        />
      )}
    </>
  );
};

// frontend/src/components/chat/ChatMessage.tsx

import React from 'react';
import { User, Bot, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ChatMessage as ChatMessageType } from '@/services/chatApi';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.message_type === 'error';
  
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-blue-500" : isError ? "bg-red-500" : "bg-gray-700"
      )}>
        {isUser ? (
          <User size={16} className="text-white" />
        ) : isError ? (
          <AlertCircle size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>
      
      <div className={cn("flex-1 space-y-1", isUser && "text-right")}>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <span>{message.formatted_time}</span>
        </div>
        
        <div className={cn(
          "inline-block px-4 py-2 rounded-2xl max-w-[80%]",
          isUser 
            ? "bg-blue-500 text-white" 
            : isError 
            ? "bg-red-50 text-red-900 border border-red-200"
            : "bg-gray-100 text-gray-900"
        )}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {message.ai_metadata?.usage && (
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
              Tokens: {message.ai_metadata.usage.total_tokens}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// frontend/src/components/chat/SubmitIdeaDialog.tsx

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { submitChatAsIdea, type ChatSessionDetail } from '@/services/chatApi';

interface SubmitIdeaDialogProps {
  session: ChatSessionDetail;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitIdeaDialog: React.FC<SubmitIdeaDialogProps> = ({
  session,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(() => {
    // Extract key points from conversation
    const userMessages = session.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');
    return userMessages;
  });
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  
  const submitMutation = useMutation({
    mutationFn: () => submitChatAsIdea(session.id, { title, description, priority }),
    onSuccess: () => {
      onSuccess();
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    submitMutation.mutate();
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit as Idea</DialogTitle>
            <DialogDescription>
              Convert this chat conversation into a structured idea for the content wall.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a clear, concise title for your idea"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your idea in detail..."
                className="min-h-[200px]"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit Idea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

### Route Integration

```typescript
// Update frontend/src/App.tsx to include chat routes

import { ChatPage } from "@/pages/Dashboard/ChatPage";

// In RoleAwareDashboardRoutes component:

{/* Tenant User Routes */}
{user.role === "tenant_user" && (
  <>
    <Route path="chat" element={<ChatPage />} />
    <Route path="chat/:sessionId" element={<ChatPage />} />
    <Route path="ideas" element={<IdeasPage />} />
    <Route path="content" element={<ContentWallPage />} />
    <Route path="*" element={<Navigate to="/dashboard/chat" replace />} />
  </>
)}

{/* Tenant Admin Routes */}
{user.role === "tenant_admin" && (
  <>
    <Route path="chat" element={<ChatPage />} />
    <Route path="chat/:sessionId" element={<ChatPage />} />
    <Route path="content" element={<ContentWallPage />} />
    <Route path="users" element={<UsersPage />} />
    <Route path="organization" element={<OrganizationPage />} />
    <Route path="ideas" element={<IdeasPage />} />
    <Route path="*" element={<Navigate to="/dashboard/content" replace />} />
  </>
)}
```

## Phase 4: Content Wall Integration

### Update Content Wall to Show Chat-Submitted Ideas

```typescript
// In ContentWallPage.tsx, add indication for ideas from chat

const ideaCard = (
  <div className="relative">
    {/* Existing card content */}
    
    {/* Add chat indicator if idea came from chat */}
    {idea.source_chat_session && (
      <div className="absolute top-2 right-2">
        <Badge variant="secondary" className="text-xs">
          From Chat
        </Badge>
      </div>
    )}
  </div>
);
```

## Phase 5: Testing & Deployment

### Testing Checklist

1. **Database Migration**
   ```bash
   python manage.py makemigrations ideas
   python manage.py migrate
   python manage.py migrate_schemas
   ```

2. **API Testing**
   - Test all CRUD operations for chat sessions
   - Test message sending and AI responses
   - Test idea submission from chat
   - Verify multi-tenant isolation

3. **Frontend Testing**
   - Create new chat sessions
   - Send messages and receive AI responses
   - Test session management (rename, archive, delete)
   - Submit ideas from chat
   - Verify responsive design

4. **Integration Testing**
   - End-to-end flow from chat to idea submission
   - Verify ideas appear in content wall
   - Test with different user roles
   - Performance testing with many messages

### Deployment Steps

1. **Backend Deployment**
   - Deploy Django application with new models
   - Run migrations on all tenant schemas
   - Ensure AI service is accessible

2. **Frontend Deployment**
   - Build React application
   - Deploy static assets
   - Update environment variables

3. **Post-Deployment**
   - Monitor error logs
   - Check AI service integration
   - Verify database performance

## Summary

This comprehensive implementation plan provides:

1. **Complete Database Schema** - New models for chat sessions, messages, and templates
2. **Full Backend API** - RESTful endpoints with AI integration
3. **Rich Frontend UI** - ChatGPT-like interface with session management
4. **AI Service Integration** - Context-aware responses using your FastAPI service
5. **End-to-End Flow** - From chat conversation to idea submission
6. **Multi-Tenant Support** - Respects tenant boundaries throughout

The system is designed to integrate seamlessly with your existing architecture while providing a modern, intuitive chat experience for idea refinement and submission.