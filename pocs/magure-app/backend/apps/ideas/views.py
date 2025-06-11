from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Idea
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

