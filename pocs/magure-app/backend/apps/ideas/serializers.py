from rest_framework import serializers
from .models import Idea

class IdeaListSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'status', 'created_at', 'updated_at', 'user_email'
        ]

class IdeaDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'description', 'status', 'created_at', 'updated_at', 'user_email'
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
