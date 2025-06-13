from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    IdeaViewSet, 
    IdeaRefineAPIView, 
    IdeaSubmitAPIView,
    ChatSessionViewSet,
    ChatTemplateViewSet
)

router = DefaultRouter()
router.register(r'ideas', IdeaViewSet, basename='idea')
router.register(r'chat/sessions', ChatSessionViewSet, basename='chat-session')
router.register(r'chat/templates', ChatTemplateViewSet, basename='chat-template')

urlpatterns = router.urls + [
    # Legacy endpoints for backward compatibility
    path('refine/', IdeaRefineAPIView.as_view(), name='idea-refine'),
    path('submit/', IdeaSubmitAPIView.as_view(), name='idea-submit'),
    
    # Chat-specific endpoints are handled by the ViewSet actions:
    # - POST /chat/sessions/{id}/send_message/
    # - POST /chat/sessions/{id}/submit_as_idea/
    # - POST /chat/sessions/{id}/regenerate_response/
    # - PATCH /chat/sessions/{id}/update_title/
    # - POST /chat/sessions/{id}/archive/
    # - POST /chat/sessions/{id}/reset_session/
    # - POST /chat/sessions/{id}/start_interview/
    # - POST /chat/sessions/{id}/advance_stage/
    # 
    # Template endpoints:
    # - GET /chat/templates/by_category/
    # - POST /chat/templates/{id}/create_session/
]
