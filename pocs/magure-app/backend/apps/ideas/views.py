from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models
from django.db.models import Q, Count, Max
from django.utils import timezone
from .models import Idea, IdeaLike, ChatSession, ChatMessage, ChatTemplate
from .serializers import (
    IdeaListSerializer,
    IdeaDetailSerializer,
    IdeaCreateSerializer,
    IdeaUpdateSerializer,
    IdeaStatusUpdateSerializer,
    ChatSessionListSerializer,
    ChatSessionDetailSerializer,
    ChatSessionCreateSerializer,
    ChatMessageSerializer,
    SendMessageSerializer,
    SubmitIdeaFromChatSerializer,
    ChatTemplateSerializer,
)
from services.ai_services.openai_service import OpenAIService

class IdeaViewSet(viewsets.ModelViewSet):
    queryset = Idea.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Idea.objects.all()
        
        # Role-based filtering
        if user.role == 'superadmin':
            # Super admins can see all ideas
            pass
        elif user.role == 'tenant_admin':
            # Tenant admins can see all ideas in their tenant
            # (This would be filtered by tenant middleware in real multi-tenant setup)
            pass
        elif user.role == 'tenant_user':
            # Tenant users can see:
            # 1. Their own ideas (all statuses)
            # 2. Ideas in approved/implemented/testing statuses from their department/role
            queryset = queryset.filter(
                models.Q(user=user) |  # Own ideas
                models.Q(
                    status__in=['approved', 'implemented', 'testing', 'in_development'],
                    department=user.department
                ) |
                models.Q(
                    status__in=['approved', 'implemented', 'testing', 'in_development'],
                    custom_role=user.custom_role
                )
            ).distinct()
        else:
            # For any other roles, filter similarly to tenant_user
            queryset = queryset.filter(
                models.Q(user=user) |  # Own ideas
                models.Q(
                    status__in=['approved', 'implemented', 'testing', 'in_development'],
                    department=user.department
                ) |
                models.Q(
                    status__in=['approved', 'implemented', 'testing', 'in_development'],
                    custom_role=user.custom_role
                )
            ).distinct()
        
        # Apply additional filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        assigned_to_filter = self.request.query_params.get('assigned_to')
        if assigned_to_filter:
            if assigned_to_filter == 'me':
                queryset = queryset.filter(assigned_to=user)
            elif assigned_to_filter == 'unassigned':
                queryset = queryset.filter(assigned_to__isnull=True)
            else:
                try:
                    queryset = queryset.filter(assigned_to_id=int(assigned_to_filter))
                except (ValueError, TypeError):
                    pass
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search) |
                models.Q(description__icontains=search) |
                models.Q(implementation_notes__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return IdeaListSerializer
        elif self.action == 'retrieve':
            return IdeaDetailSerializer
        elif self.action == 'create':
            return IdeaCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return IdeaUpdateSerializer
        return IdeaDetailSerializer

    @action(detail=True, methods=['post'])
    def toggle_pin(self, request, pk=None):
        # Only tenant admins can pin/unpin ideas
        if request.user.role not in ['superadmin', 'tenant_admin']:
            return Response(
                {"error": "Only tenant admins can pin/unpin ideas"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        idea = self.get_object()
        idea.is_pinned = not idea.is_pinned
        idea.save()
        
        serializer = IdeaDetailSerializer(idea, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update the status of an idea with proper validation"""
        idea = self.get_object()
        serializer = IdeaStatusUpdateSerializer(
            idea, 
            data=request.data, 
            context={'request': request},
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            response_serializer = IdeaDetailSerializer(idea, context={'request': request})
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get idea analytics for dashboard"""
        user = request.user
        queryset = self.get_queryset()
        
        # Basic counts
        analytics = {
            'total_ideas': queryset.count(),
            'by_status': {},
            'by_priority': {},
            'assigned_to_me': queryset.filter(assigned_to=user).count() if user.is_authenticated else 0,
            'created_by_me': queryset.filter(user=user).count() if user.is_authenticated else 0,
        }
        
        # Status breakdown
        status_counts = queryset.values('status').annotate(count=models.Count('status'))
        for item in status_counts:
            analytics['by_status'][item['status']] = item['count']
        
        # Priority breakdown
        priority_counts = queryset.values('priority').annotate(count=models.Count('priority'))
        for item in priority_counts:
            analytics['by_priority'][item['priority']] = item['count']
        
        return Response(analytics)

    @action(detail=False, methods=['get'])
    def content_wall(self, request):
        """
        Content wall shows ideas based on user role:
        - Tenant admins: All ideas in their tenant
        - Tenant users: Only refined/approved ideas from their department/role + their own ideas
        """
        user = request.user
        
        # Role-based filtering for content wall access
        if user.role == 'superadmin':
            # Super admins can see all ideas across all tenants
            queryset = Idea.objects.all()
        elif user.role == 'tenant_admin':
            # Tenant admins can see ALL ideas in their tenant (not just public ones)
            # TODO: Add tenant filtering when multi-tenancy is fully implemented
            queryset = Idea.objects.all()
        elif user.role == 'tenant_user':
            # Tenant users can only see:
            # 1. Their own ideas (all statuses)
            # 2. Refined/approved ideas from their department/role only
            public_statuses = ['refined', 'approved', 'implemented', 'testing', 'in_development']
            queryset = Idea.objects.filter(
                models.Q(user=user) |  # Own ideas (all statuses)
                models.Q(
                    department=user.department,
                    status__in=public_statuses
                ) |
                models.Q(
                    custom_role=user.custom_role,
                    status__in=public_statuses
                )
            ).distinct()
        else:
            # For any other roles, apply same restrictions as tenant_user
            public_statuses = ['refined', 'approved', 'implemented', 'testing', 'in_development']
            queryset = Idea.objects.filter(
                models.Q(user=user) |  # Own ideas (all statuses)
                models.Q(
                    department=user.department,
                    status__in=public_statuses
                ) |
                models.Q(
                    custom_role=user.custom_role,
                    status__in=public_statuses
                )
            ).distinct()
        
        # Apply filters
        department_id = request.query_params.get('department')
        if department_id and department_id != 'all':
            try:
                queryset = queryset.filter(department_id=department_id)
            except ValueError:
                pass
        
        role_id = request.query_params.get('role')
        if role_id and role_id != 'all':
            try:
                queryset = queryset.filter(custom_role_id=role_id)
            except ValueError:
                pass
        
        status_filter = request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        priority_filter = request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search) |
                models.Q(description__icontains=search) |
                models.Q(implementation_notes__icontains=search)
            )
        
        # Order by: pinned first, then by priority (critical/high first), then by creation date
        queryset = queryset.order_by('-is_pinned', '-priority', '-created_at')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = IdeaDetailSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = IdeaDetailSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        idea = self.get_object()
        like, created = IdeaLike.objects.get_or_create(
            idea=idea,
            user=request.user
        )
        
        if created:
            message = "Idea liked successfully"
        else:
            message = "Already liked"
            
        serializer = IdeaDetailSerializer(idea, context={'request': request})
        return Response({
            'message': message,
            'idea': serializer.data
        })

    @action(detail=True, methods=['delete'])
    def unlike(self, request, pk=None):
        idea = self.get_object()
        try:
            like = IdeaLike.objects.get(idea=idea, user=request.user)
            like.delete()
            message = "Idea unliked successfully"
        except IdeaLike.DoesNotExist:
            message = "Like not found"
            
        serializer = IdeaDetailSerializer(idea, context={'request': request})
        return Response({
            'message': message,
            'idea': serializer.data
        })

class IdeaRefineAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        idea_text = request.data.get("idea_text")
        conversation_history = request.data.get("conversation_history", None)
        if not idea_text:
            return Response({"error": "idea_text is required"}, status=status.HTTP_400_BAD_REQUEST)
        service = OpenAIService()
        refined = service.refine_idea(idea_text, conversation_history)
        return Response({"refined_idea": refined})

class IdeaSubmitAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        title = request.data.get("title")
        description = request.data.get("description")
        
        if not title or not description:
            return Response(
                {"error": "Both title and description are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the idea with submitted status (default workflow)
        idea = Idea.objects.create(
            user=request.user,
            title=title,
            description=description,
            status='submitted',  # New default status
            department=request.user.department,
            custom_role=request.user.custom_role
        )
        
        # Serialize and return the created idea
        serializer = IdeaDetailSerializer(idea, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# Chat ViewSets

class ChatSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing chat sessions.
    Provides CRUD operations and custom actions for AI interaction.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
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
        return ChatSessionDetailSerializer
    
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
            max_seq=Max('sequence_number')
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
            'idea': IdeaDetailSerializer(idea, context={'request': request}).data,
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
        
        # Generate new response by calling send_message
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
                max_seq=Max('sequence_number')
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
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter templates by department and active status"""
        user = self.request.user
        return ChatTemplate.objects.filter(
            Q(department=None) | Q(department=user.department),
            is_active=True
        )

