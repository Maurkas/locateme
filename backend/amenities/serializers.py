from rest_framework import serializers
from .models import Amenities

class AmenitySerializer(serializers.ModelSerializer):
    distance = serializers.SerializerMethodField()

    class Meta:
        model = Amenities
        fields = ['type', 'title', 'coordinates', 'distance']

    def get_distance(self, obj):
        return getattr(obj, 'distance', None)