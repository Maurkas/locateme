from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Favorite, SearchQuery
from announcements.serializers import AnnouncementSerializer

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    

class FavoriteSerializer(serializers.ModelSerializer):
    announcement = AnnouncementSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'announcement', 'created_at']
        read_only_fields = ['user']
        
class SearchQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchQuery
        fields = ['id', 'name', 'params', 'created_at']
        read_only_fields = ['created_at']