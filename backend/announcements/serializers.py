from rest_framework import serializers
from .models import Announcements
from buildings.models import Buildings

class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Buildings
        fields = [
            'building_id',
            'address_text',
            'district',
            'coordinates',
            'house_type',
            'year_of_construction',
            'number_of_floors',
            'passenger_elevator',
            'service_elevator',
            'courtyard',
            'parking'
        ]

class AnnouncementSerializer(serializers.ModelSerializer):
    building = BuildingSerializer(read_only=True)
    walk_score = serializers.SerializerMethodField()
    personal_score = serializers.SerializerMethodField()

    class Meta:
        model = Announcements
        fields = "__all__"
        depth = 1
        
    def get_walk_score(self, obj):
        # Если walk_score не установлен, попробуем вычислить его
        if obj.walk_score is None and obj.coordinates:
            return obj.calculate_walk_score()
        return obj.walk_score or 0  # Возвращаем 0 вместо None
    
    def get_personal_score(self, obj):
        request = self.context.get('request')
        if not request:
            return None
            
        all_params = request.GET.dict()
        
        # Определяем допустимые amenity-фильтры
        allowed_filters = [
            "stops", "school", "kindergarten", "pickup_point",
            "polyclinic", "center", "gym", "mall", "college_and_university",
            "beauty_salon", "pharmacy", "grocery_store",
            "religious", "restaurant", "bank"
        ]
        
        # Фильтруем только нужные параметры для amenities
        amenities_filters = {
            key: value
            for key, value in all_params.items()
            if key in allowed_filters and 
            value in ["any", "far", "close"]
        }
        
        # Обрабатываем custom_address отдельно
        custom_address_filters = {}
        if "custom_address[coords][lat]" in all_params and "custom_address[coords][lon]" in all_params:
            custom_address_filters = {
                "custom_address[coords][lat]": all_params["custom_address[coords][lat]"],
                "custom_address[coords][lon]": all_params["custom_address[coords][lon]"],
                "custom_address[distance]": all_params.get("custom_address[distance]", "nearby")
            }
        
        # Объединяем все фильтры
        combined_filters = {**amenities_filters, **custom_address_filters}
        
        if not combined_filters:
            print("No valid filters found")
            return None
        
        #print("Processed filters:", combined_filters)  # Для отладки
        
        # Преобразуем "close" в "nearby" для amenities
        translated_filters = {}
        for k, v in combined_filters.items():
            if k in allowed_filters:
                translated_filters[k] = "nearby" if v == "close" else v
            else:
                translated_filters[k] = v
        
        return obj.calculate_personal_score(translated_filters, verbose=True)