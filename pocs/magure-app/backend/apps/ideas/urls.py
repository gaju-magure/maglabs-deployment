from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import IdeaViewSet, IdeaRefineAPIView, IdeaScoreAPIView

router = DefaultRouter()
router.register(r'ideas', IdeaViewSet, basename='idea')

urlpatterns = router.urls + [
    path('refine/', IdeaRefineAPIView.as_view(), name='idea-refine'),
    path('score/', IdeaScoreAPIView.as_view(), name='idea-score'),
]
