from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models
from .models import Idea, IdeaLike
from .serializers import (
    IdeaListSerializer,
    IdeaDetailSerializer,
    IdeaCreateSerializer,
    IdeaUpdateSerializer,
    IdeaStatusUpdateSerializer,
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

