from rest_framework import serializers
from .models import Idea, IdeaLike

class IdeaListSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    like_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'status', 'created_at', 'updated_at', 'user_email', 'is_pinned', 'like_count', 'is_liked'
        ]
    
    def get_is_liked(self, obj):
        user = self.context['request'].user
        return obj.is_liked_by(user)

class IdeaDetailSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    like_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'description', 'status', 'created_at', 'updated_at', 'user_email', 'is_pinned', 'like_count', 'is_liked'
        ]
    
    def get_is_liked(self, obj):
        user = self.context['request'].user
        return obj.is_liked_by(user)

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
