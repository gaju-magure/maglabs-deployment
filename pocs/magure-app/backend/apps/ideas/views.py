from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Idea, IdeaLike
from .serializers import (
    IdeaListSerializer,
    IdeaDetailSerializer,
    IdeaCreateSerializer,
    IdeaUpdateSerializer,
)
from services.ai_services.openai_service import OpenAIService

class IdeaViewSet(viewsets.ModelViewSet):
    queryset = Idea.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see only their own ideas; admins can see all
        user = self.request.user
        if user.role in ['superadmin', 'tenant_admin']:
            return Idea.objects.all()
        return Idea.objects.filter(user=user)

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
        
        serializer = IdeaDetailSerializer(idea)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def content_wall(self, request):
        # For content wall, show all refined ideas in the tenant
        # Ordered by: pinned first, then by creation date (newest first)
        queryset = Idea.objects.filter(status='refined').order_by('-is_pinned', '-created_at')
        
        # Apply tenant filtering if user is not superadmin
        if request.user.role not in ['superadmin']:
            # For tenant users, this will be automatically filtered by tenant
            # due to django-tenants or similar multi-tenant setup
            pass
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = IdeaListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = IdeaListSerializer(queryset, many=True)
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
        
        # Create the idea with refined status
        idea = Idea.objects.create(
            user=request.user,
            title=title,
            description=description,
            status='refined'
        )
        
        # Serialize and return the created idea
        serializer = IdeaDetailSerializer(idea)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

