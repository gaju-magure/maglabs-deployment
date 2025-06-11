from django.db import models
from django.conf import settings

class Idea(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_review', 'In Review'),
        ('closed', 'Closed'),
        ('refined', 'Refined'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ideas')
    is_pinned = models.BooleanField(default=False)

    def __str__(self):
        return self.title
    
    @property
    def like_count(self):
        return self.likes.count()
    
    def is_liked_by(self, user):
        if user.is_anonymous:
            return False
        return self.likes.filter(user=user).exists()


class IdeaLike(models.Model):
    idea = models.ForeignKey(Idea, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='idea_likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['idea', 'user']
        
    def __str__(self):
        return f"{self.user.email} likes {self.idea.title}"
