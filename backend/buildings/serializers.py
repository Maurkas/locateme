from rest_framework import serializers
from .models import BuildingAmenities

class BuildingAmenitiesSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='amenity.title', read_only=True)
    coordinates = serializers.CharField(source='amenity.coordinates', read_only=True)
    category = serializers.CharField(source='amenity.type', read_only=True)

    class Meta:
        model = BuildingAmenities
        fields = ['id', 'building_id', 'amenity_id', 'distance', 'title', 'coordinates', 'category']
