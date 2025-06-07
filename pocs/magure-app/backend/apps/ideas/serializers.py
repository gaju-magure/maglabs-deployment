from rest_framework import serializers
from .models import Idea

class IdeaListSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'status', 'created_at', 'updated_at', 'user_email',
            'clarity_score', 'creativity_score', 'feasibility_score', 'relevance_score'
        ]

class IdeaDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'description', 'status', 'created_at', 'updated_at', 'user_email',
            'clarity_score', 'creativity_score', 'feasibility_score', 'relevance_score'
        ]

class IdeaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idea
        fields = ['title', 'description', 'status']

    def create(self, validated_data):
        user = self.context['request'].user
        return Idea.objects.create(user=user, **validated_data)

class IdeaUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idea
        fields = ['title', 'description', 'status']
