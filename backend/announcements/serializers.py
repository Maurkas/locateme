from rest_framework import serializers
from .models import Announcements
from buildings.models import Buildings

class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Buildings
        fields = [
            'building_id',
            'address_text',
            'address_url',
            'district',
            'coordinates',
            'house_type',
            'year_of_construction',
            'number_of_floors',
            'ceiling_height',
            'passenger_elevator',
            'service_elevator',
            'courtyard',
            'parking'
        ]

class AnnouncementSerializer(serializers.ModelSerializer):
    building = BuildingSerializer(read_only=True)
    walk_score = serializers.SerializerMethodField()

    class Meta:
        model = Announcements
        fields = "__all__"
        
    def get_walk_score(self, obj):
        return obj.walk_score