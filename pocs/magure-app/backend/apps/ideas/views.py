from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models
from django.db.models import Q, Count, Max
from django.utils import timezone
from .models import Idea, IdeaLike, ChatSession, ChatMessage, ChatTemplate
from utils.auth_utils import get_jwt_token_from_request
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
    ChatTemplateListSerializer,
)
from services.ai_services.maglabs_service import MagLabsService
import logging

logger = logging.getLogger(__name__)

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
        if not idea_text:
            return Response({"error": "idea_text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Use MagLabs service for idea refinement
        try:
            # Extract JWT token from request for authentication forwarding
            auth_token = get_jwt_token_from_request(request)
            service = MagLabsService(auth_token=auth_token)
            messages = [{"role": "user", "content": f"Please help me refine this idea: {idea_text}"}]
            result = service.send_message(messages, auth_token=auth_token)
            return Response({"refined_idea": result['content']})
        except ConnectionError as e:
            error_str = str(e).lower()
            if 'authentication failed' in error_str or 'invalid or expired jwt token' in error_str:
                return Response({
                    'error': 'Authentication failed. Please log in again.',
                    'error_type': 'authentication_error',
                    'requires_login': True
                }, status=status.HTTP_401_UNAUTHORIZED)
            elif 'access denied' in error_str or 'insufficient permissions' in error_str:
                return Response({
                    'error': 'You don\'t have permission to access the AI service.',
                    'error_type': 'authorization_error'
                }, status=status.HTTP_403_FORBIDDEN)
            else:
                logger.error(f"Connection error refining idea: {e}")
                return Response({"error": "AI service unavailable. Please try again later."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error(f"Error refining idea: {e}")
            return Response({"error": "Failed to refine idea"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    
    def create(self, request, *args, **kwargs):
        """
        Create a new chat session and return full session data including ID.
        """
        # Use create serializer for input validation
        serializer = ChatSessionCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Create the session
        session = serializer.save()
        
        # Use detail serializer for response to include all fields including ID
        response_serializer = ChatSessionDetailSerializer(session, context={'request': request})
        
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
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
            # Extract JWT token from request for authentication forwarding
            auth_token = get_jwt_token_from_request(request)
            ai_service = MagLabsService(auth_token=auth_token)
            
            # Build conversation history
            conversation_history = self._build_conversation_history(session)
            
            # Add current message
            conversation_history.append({
                'role': 'user',
                'content': user_message.content
            })
            
            # Get AI response using MagLabs service with template configuration
            ai_response_data = ai_service.send_message(
                messages=conversation_history,
                user_context=session.context_metadata,
                session_id=session.maglabs_session_id,
                conversation_config=ai_service._get_conversation_config(
                    session.template
                ),
                auth_token=auth_token
            )
            
            # Validate AI response
            if not ai_response_data or 'content' not in ai_response_data:
                raise ValueError("Invalid response from AI service - missing content")
            
            if not ai_response_data['content'].strip():
                raise ValueError("AI service returned empty response")
            
            # Prepare comprehensive AI metadata including stage progression
            comprehensive_metadata = {
                **ai_response_data.get('metadata', {}),  # Include original metadata
                **ai_response_data.get('stage_data', {}),  # Include enhanced stage progression data
                # Legacy fields for backward compatibility
                'session_id': ai_response_data.get('session_id'),
                'stage': ai_response_data.get('stage'),
                'stage_progress': ai_response_data.get('stage_progress'),
                'conversation_health': ai_response_data.get('conversation_health'),
                'suggested_actions': ai_response_data.get('suggested_actions', [])
            }
            
            # Create AI message with comprehensive metadata
            ai_message = ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=ai_response_data['content'],
                message_type='text',
                sequence_number=last_sequence + 2,
                ai_metadata=comprehensive_metadata,
                is_processed=True
            )
            
            # Update session with MagLabs metadata
            if ai_response_data.get('session_id'):
                session.maglabs_session_id = ai_response_data['session_id']
            
            session.current_stage = ai_response_data.get('stage', session.current_stage)
            session.stage_progress = ai_response_data.get('stage_progress', session.stage_progress)
            session.conversation_health = ai_response_data.get('conversation_health', session.conversation_health)
            session.business_context = ai_response_data.get('business_context', session.business_context)
            
            # Update token usage if available
            metadata = ai_response_data.get('metadata', {})
            if 'usage' in metadata:
                session.total_tokens_used += metadata['usage'].get('total_tokens', 0)
            
            session.message_count += 1
            session.save()
            
            logger.info(f"Successfully processed message for session {session.id}")
            
            # Return both messages
            return Response({
                'user_message': ChatMessageSerializer(user_message).data,
                'ai_message': ChatMessageSerializer(ai_message).data,
                'session_updated': ChatSessionDetailSerializer(session, context={'request': request}).data
            })
            
        except ConnectionError as e:
            logger.error(f"Connection error to AI service for session {session.id}: {str(e)}")
            
            # Check if this is an authentication error
            error_str = str(e).lower()
            if 'authentication failed' in error_str or 'invalid or expired jwt token' in error_str:
                # Authentication error - user needs to re-login
                return Response({
                    'error': 'Authentication failed. Please log in again.',
                    'error_type': 'authentication_error',
                    'requires_login': True
                }, status=status.HTTP_401_UNAUTHORIZED)
            elif 'access denied' in error_str or 'insufficient permissions' in error_str:
                # Authorization error - user doesn't have permission
                return Response({
                    'error': 'You don\'t have permission to access the AI service.',
                    'error_type': 'authorization_error'
                }, status=status.HTTP_403_FORBIDDEN)
            elif 'token limit' in error_str or 'session' in error_str:
                try:
                    # Attempt session reset by creating new unique context
                    import uuid
                    from django.utils import timezone
                    
                    # Update session context to force new MagLabs session
                    session.context_metadata['session_reset'] = str(uuid.uuid4())
                    session.context_metadata['reset_timestamp'] = timezone.now().isoformat()
                    session.context_metadata['reset_reason'] = 'token_limit_exceeded'
                    session.maglabs_session_id = ''  # Clear old session ID
                    session.save()
                    
                    # Retry the AI request with new context
                    ai_response_data = ai_service.send_message(
                        messages=conversation_history,
                        user_context=session.context_metadata,
                        session_id=None,  # Force new session
                        conversation_config=ai_service._get_conversation_config(
                            session.template
                        ),
                        auth_token=auth_token
                    )
                    
                    # Create successful AI message
                    ai_message = ChatMessage.objects.create(
                        session=session,
                        role='assistant',
                        content=ai_response_data['content'],
                        message_type='text',
                        sequence_number=last_sequence + 2,
                        ai_metadata=ai_response_data.get('metadata', {}),
                        is_processed=True
                    )
                    
                    # Update session with new MagLabs data
                    if ai_response_data.get('session_id'):
                        session.maglabs_session_id = ai_response_data['session_id']
                    session.current_stage = ai_response_data.get('stage', session.current_stage)
                    session.stage_progress = ai_response_data.get('stage_progress', session.stage_progress)
                    session.conversation_health = ai_response_data.get('conversation_health', session.conversation_health)
                    session.business_context = ai_response_data.get('business_context', session.business_context)
                    session.message_count += 1
                    session.save()
                    
                    logger.info(f"Successfully reset session {session.id} and got AI response")
                    
                    # Return success with session reset notification
                    return Response({
                        'user_message': ChatMessageSerializer(user_message).data,
                        'ai_message': ChatMessageSerializer(ai_message).data,
                        'session_updated': ChatSessionDetailSerializer(session, context={'request': request}).data,
                        'session_reset': True,
                        'reset_message': 'Session was automatically refreshed to continue the conversation.'
                    })
                    
                except Exception as retry_error:
                    logger.error(f"Session reset failed for session {session.id}: {str(retry_error)}")
                    # Fall through to original error handling
            
            error_message = ChatMessage.objects.create(
                session=session,
                role='system',
                content="I'm having trouble connecting to the AI service. The session may need to be refreshed. Please try again or create a new conversation.",
                message_type='error',
                sequence_number=last_sequence + 2,
                is_processed=True,
                processing_status='failed',
                error_message=str(e)
            )
            
            return Response({
                'user_message': ChatMessageSerializer(user_message).data,
                'error_message': ChatMessageSerializer(error_message).data,
                'error': 'Connection to AI service failed. Please try again or create a new conversation.',
                'suggest_new_session': True
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
        except ValueError as e:
            logger.error(f"Invalid AI response for session {session.id}: {str(e)}")
            error_message = ChatMessage.objects.create(
                session=session,
                role='system',
                content="I received an invalid response from the AI service. Please try rephrasing your message.",
                message_type='error',
                sequence_number=last_sequence + 2,
                is_processed=True,
                processing_status='failed',
                error_message=str(e)
            )
            
            return Response({
                'user_message': ChatMessageSerializer(user_message).data,
                'error_message': ChatMessageSerializer(error_message).data,
                'error': 'Invalid AI response. Please try again with a different message.'
            }, status=status.HTTP_502_BAD_GATEWAY)
            
        except Exception as e:
            logger.error(f"Unexpected error in send_message for session {session.id}: {str(e)}")
            error_message = ChatMessage.objects.create(
                session=session,
                role='system',
                content="Sorry, I encountered an unexpected error. Our team has been notified. Please try again.",
                message_type='error',
                sequence_number=last_sequence + 2,
                is_processed=True,
                processing_status='failed',
                error_message=str(e)
            )
            
            return Response({
                'user_message': ChatMessageSerializer(user_message).data,
                'error_message': ChatMessageSerializer(error_message).data,
                'error': 'An unexpected error occurred. Please try again.'
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
    def reset_session(self, request, pk=None):
        """
        Manually reset the MagLabs session for this chat.
        Useful when token limits are hit or session becomes unresponsive.
        """
        session = self.get_object()
        
        try:
            import uuid
            from django.utils import timezone
            
            # Update context metadata to force new MagLabs session
            session.context_metadata['manual_reset'] = str(uuid.uuid4())
            session.context_metadata['reset_timestamp'] = timezone.now().isoformat()
            session.context_metadata['reset_by'] = request.user.username
            session.context_metadata['reset_reason'] = 'manual_user_request'
            
            # Clear old MagLabs session data
            old_session_id = session.maglabs_session_id
            session.maglabs_session_id = ''
            session.current_stage = 'user_profiling'
            session.stage_progress = 0.0
            session.conversation_health = 'good'
            session.business_context = {}
            
            # Reset interview mode if active
            if session.interview_mode:
                session.interview_mode = False
                session.interview_goals = ''
                session.target_stages = []
                session.completed_stages = []
            
            session.save()
            
            # Create system message about the reset
            last_sequence = session.messages.aggregate(
                max_seq=Max('sequence_number')
            )['max_seq'] or 0
            
            ChatMessage.objects.create(
                session=session,
                role='system',
                content="🔄 Session has been reset. Your conversation history is preserved, but the AI context has been refreshed. You can continue chatting normally.",
                message_type='system',
                sequence_number=last_sequence + 1,
                ai_metadata={'reset_event': True, 'old_session_id': old_session_id}
            )
            
            session.message_count += 1
            session.update_activity()
            
            logger.info(f"Session {session.id} manually reset by user {request.user.username}")
            
            return Response({
                'message': 'Session reset successfully',
                'session_updated': ChatSessionDetailSerializer(session, context={'request': request}).data,
                'reset_info': {
                    'old_session_id': old_session_id,
                    'reset_timestamp': timezone.now().isoformat(),
                    'conversation_preserved': True
                }
            })
            
        except Exception as e:
            logger.error(f"Error resetting session {session.id}: {str(e)}")
            return Response({
                'error': 'Failed to reset session. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def start_interview(self, request, pk=None):
        """
        Activate structured interview mode for this session.
        Utilizes MagLabs multi-agent interview system with conversation type awareness.
        """
        session = self.get_object()
        interview_goals = request.data.get('interview_goals', '')
        
        # Check if interview mode is already active
        if session.interview_mode:
            return Response({
                'error': 'Interview mode is already active for this session',
                'current_stage': session.current_stage,
                'progress': session.stage_progress
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Extract JWT token from request for authentication forwarding
            auth_token = get_jwt_token_from_request(request)
            ai_service = MagLabsService(auth_token=auth_token)
            
            # Ensure session has fresh context for interview mode
            if not session.maglabs_session_id:
                import uuid
                from django.utils import timezone
                session.context_metadata['interview_init'] = str(uuid.uuid4())
                session.context_metadata['interview_timestamp'] = timezone.now().isoformat()
                session.save()
            
            # Activate interview mode using MagLabs service
            result = ai_service.start_interview_mode(
                session_id=session.maglabs_session_id,
                template=session.template,
                interview_goals=interview_goals,
                auth_token=auth_token
            )
            
            # Validate response
            if not result or 'content' not in result:
                raise ValueError("Invalid response from MagLabs service")
            
            # Update session with interview configuration
            session.interview_mode = True
            session.interview_type = result.get('interview_type', 'business_idea')
            session.interview_goals = interview_goals
            
            # Get configuration for target stages
            config = ai_service._get_conversation_config(session.template)
            session.target_stages = config.get('expected_completion', [])
            
            # Update MagLabs tracking
            if result.get('session_id'):
                session.maglabs_session_id = result['session_id']
            session.current_stage = result.get('stage', session.current_stage)
            session.stage_progress = result.get('stage_progress', session.stage_progress)
            session.conversation_health = result.get('conversation_health', session.conversation_health)
            
            session.save()
            
            # Create interview activation message
            last_sequence = session.messages.aggregate(
                max_seq=Max('sequence_number')
            )['max_seq'] or 0
            
            ai_message = ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=result['content'],
                message_type='text',
                sequence_number=last_sequence + 1,
                ai_metadata=result.get('metadata', {})
            )
            
            session.message_count += 1
            session.update_activity()
            
            logger.info(f"Interview mode activated for session {session.id}")
            
            return Response({
                'message': 'Interview mode activated successfully',
                'ai_message': ChatMessageSerializer(ai_message).data,
                'session_updated': ChatSessionDetailSerializer(session, context={'request': request}).data,
                'interview_config': {
                    'target_stages': session.target_stages,
                    'current_stage': session.current_stage,
                    'progress': session.stage_progress,
                    'health': session.conversation_health
                }
            })
            
        except ConnectionError as e:
            logger.error(f"Connection error activating interview mode for session {session.id}: {str(e)}")
            
            # Check if this is a session-related error and attempt reset
            error_str = str(e).lower()
            if 'token limit' in error_str or 'session' in error_str or 'unprocessable' in error_str:
                try:
                    import uuid
                    from django.utils import timezone
                    
                    # Reset session context for interview mode
                    session.context_metadata['interview_reset'] = str(uuid.uuid4())
                    session.context_metadata['interview_retry_timestamp'] = timezone.now().isoformat()
                    session.context_metadata['retry_reason'] = 'interview_activation_failed'
                    session.maglabs_session_id = ''  # Clear problematic session
                    session.save()
                    
                    # Retry interview activation with fresh context
                    result = ai_service.start_interview_mode(
                        session_id=None,  # Force new session
                        template=session.template,
                        interview_goals=interview_goals
                    )
                    
                    if result and 'content' in result:
                        # Update session with interview configuration
                        session.interview_mode = True
                        session.interview_type = result.get('interview_type', 'business_idea')
                        session.interview_goals = interview_goals
                        
                        # Get configuration for target stages
                        config = ai_service._get_conversation_config(session.template)
                        session.target_stages = config.get('expected_completion', [])
                        
                        # Update MagLabs tracking
                        if result.get('session_id'):
                            session.maglabs_session_id = result['session_id']
                        session.current_stage = result.get('stage', session.current_stage)
                        session.stage_progress = result.get('stage_progress', session.stage_progress)
                        session.conversation_health = result.get('conversation_health', session.conversation_health)
                        session.save()
                        
                        # Create interview activation message
                        last_sequence = session.messages.aggregate(
                            max_seq=Max('sequence_number')
                        )['max_seq'] or 0
                        
                        ai_message = ChatMessage.objects.create(
                            session=session,
                            role='assistant',
                            content=result['content'],
                            message_type='text',
                            sequence_number=last_sequence + 1,
                            ai_metadata=result.get('metadata', {})
                        )
                        
                        session.message_count += 1
                        session.update_activity()
                        
                        logger.info(f"Interview mode activated after session reset for session {session.id}")
                        
                        return Response({
                            'message': 'Interview mode activated successfully (session was refreshed)',
                            'ai_message': ChatMessageSerializer(ai_message).data,
                            'session_updated': ChatSessionDetailSerializer(session, context={'request': request}).data,
                            'interview_config': {
                                'target_stages': session.target_stages,
                                'current_stage': session.current_stage,
                                'progress': session.stage_progress,
                                'health': session.conversation_health
                            },
                            'session_reset': True
                        })
                        
                except Exception as retry_error:
                    logger.error(f"Interview mode retry failed for session {session.id}: {str(retry_error)}")
            
            return Response({
                'error': 'Failed to activate interview mode due to connection issues. Please try creating a new conversation.',
                'suggest_new_session': True
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
        except ValueError as e:
            logger.error(f"Invalid response activating interview mode for session {session.id}: {str(e)}")
            return Response({
                'error': 'Received invalid response from AI service. Please try again.'
            }, status=status.HTTP_502_BAD_GATEWAY)
            
        except Exception as e:
            logger.error(f"Unexpected error activating interview mode for session {session.id}: {str(e)}")
            return Response({
                'error': 'Failed to activate interview mode. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def advance_stage(self, request, pk=None):
        """
        Manually advance to the next interview stage when user is ready.
        """
        session = self.get_object()
        target_stage = request.data.get('target_stage')
        
        if not session.interview_mode:
            return Response({
                'error': 'Session is not in interview mode'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not target_stage:
            return Response({
                'error': 'target_stage is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            ai_service = MagLabsService()
            
            # Request stage advancement
            result = ai_service.advance_to_stage(
                session_id=session.maglabs_session_id,
                target_stage=target_stage,
                template=session.template
            )
            
            # Update session stage tracking
            session.current_stage = result.get('stage', target_stage)
            session.stage_progress = result.get('stage_progress', 0.0)
            session.conversation_health = result.get('conversation_health', session.conversation_health)
            
            # Mark previous stage as completed
            if target_stage not in session.completed_stages:
                session.completed_stages = session.completed_stages + [session.current_stage]
            
            session.save()
            
            # Create stage advancement message
            last_sequence = session.messages.aggregate(
                max_seq=Max('sequence_number')
            )['max_seq'] or 0
            
            ai_message = ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=result['content'],
                message_type='text',
                sequence_number=last_sequence + 1,
                ai_metadata=result.get('metadata', {})
            )
            
            session.message_count += 1
            session.update_activity()
            
            return Response({
                'message': f'Advanced to {target_stage} stage',
                'ai_message': ChatMessageSerializer(ai_message).data,
                'session_updated': ChatSessionDetailSerializer(session, context={'request': request}).data
            })
            
        except Exception as e:
            logger.error(f"Error advancing stage for session {session.id}: {str(e)}")
            return Response({
                'error': 'Failed to advance stage. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
    def _build_conversation_history(self, session):
        """
        Build conversation history in format expected by MagLabs AI service.
        """
        messages = []
        
        # Add all messages in order (MagLabs handles system prompts internally)
        for message in session.messages.filter(
            role__in=['user', 'assistant']
        ).order_by('sequence_number'):
            messages.append({
                'role': message.role,
                'content': message.content
            })
        
        return messages


class ChatTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing chat templates with MagLabs integration.
    Templates configure conversation behavior and interview stages.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter templates by department and active status"""
        user = self.request.user
        queryset = ChatTemplate.objects.filter(is_active=True)
        
        # Filter by department - show global templates and user's department templates
        if user.department:
            queryset = queryset.filter(
                Q(department=None) | Q(department=user.department)
            )
        else:
            queryset = queryset.filter(department=None)
        
        return queryset.order_by('name')
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return ChatTemplateListSerializer
        return ChatTemplateSerializer
    
    def perform_create(self, serializer):
        """Set the created_by user when creating templates"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get all available templates"""
        queryset = self.get_queryset()
        templates = ChatTemplateListSerializer(queryset, many=True).data
        return Response({'templates': templates})
    
    @action(detail=True, methods=['post'])
    def create_session(self, request, pk=None):
        """Create a new chat session using this template"""
        template = self.get_object()
        
        # Extract any custom parameters
        custom_message = request.data.get('initial_message')
        interview_mode = request.data.get('interview_mode', False)
        custom_goals = request.data.get('interview_goals', '')
        
        # Create session data
        session_data = {
            'title': request.data.get('title', f"New {template.name} Chat"),
            'template_id': template.id,
            'interview_mode': interview_mode,
            'interview_goals': custom_goals or template.conversation_goals
        }
        
        if custom_message:
            session_data['initial_message'] = custom_message
        
        # Use the ChatSessionCreateSerializer to create the session
        serializer = ChatSessionCreateSerializer(
            data=session_data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            session = serializer.save()
            
            # Return full session details
            response_serializer = ChatSessionDetailSerializer(
                session, 
                context={'request': request}
            )
            
            return Response({
                'message': f'Session created from template: {template.name}',
                'session': response_serializer.data,
                'template_config': template.get_maglabs_config()
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


