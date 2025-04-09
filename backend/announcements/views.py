from django.contrib import messages
from django.urls import reverse
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib.admin.views.decorators import staff_member_required
import subprocess
from .serializers import AnnouncementSerializer
from rest_framework import generics
from .models import Announcements
from django.views import View
from django.shortcuts import get_object_or_404
from amenities.models import Amenities
from .utils import haversine
import logging

logger = logging.getLogger(__name__)

@staff_member_required
def run_parser_view(request):
    try:
        subprocess.Popen(['python', 'announcements/parser_avito/AvitoParser.py'])
        messages.success(request, "Парсер успешно запущен!")
    except Exception as e:
        messages.error(request, f"Ошибка при запуске парсера: {str(e)}")

    return HttpResponseRedirect(reverse('admin:announcements_announcements_changelist'))

class AnnouncementListView(generics.ListAPIView):
    serializer_class = AnnouncementSerializer
    
    def get_queryset(self):
        return Announcements.objects.select_related('building').all()

class AnnouncementDetailView(View):
    def get(self, request, announcement_id):
        try:
            announcement = get_object_or_404(Announcements, announcement_id=announcement_id)
            
            # Получаем координаты объявления
            ann_lat, ann_lon = map(float, announcement.coordinates.split(","))

            # Фильтруем ближайшие объекты инфраструктуры
            radius = 0.5
            nearby_amenities = []
            for obj in Amenities.objects.all():
                obj_lat, obj_lon = map(float, obj.coordinates.split(","))
                distance = haversine(ann_lat, ann_lon, obj_lat, obj_lon)

                if distance <= radius:
                    nearby_amenities.append({
                        "type": obj.type,
                        "title": obj.title,
                        "coordinates": obj.coordinates,
                        "distance": round(distance, 2),
                    })
                    
            user_filters = {
                key.split('amenities_')[1]: value
                for key, value in request.GET.items()
                if key.startswith('amenities_') and 
                   value in ["any", "nearby", "far", "close"]
            }

            data = {
                'id': announcement.id,
                'announcement_id': announcement.announcement_id,
                'name': announcement.name,
                'url': announcement.url,
                'price': announcement.price,
                'pricePerMeter': announcement.pricePerMeter,
                'photo': announcement.photo,
                'coordinates': announcement.coordinates,
                'number_of_rooms': announcement.number_of_rooms,
                'total_area': announcement.total_area,
                'kitchen_area': announcement.kitchen_area,
                'floor': announcement.floor,
                'balcony_or_loggia': announcement.balcony_or_loggia,
                'bathroom': announcement.bathroom,
                'windows': announcement.windows,
                'repair': announcement.repair,
                'building': {
                    'address_text': announcement.building.address_text if announcement.building else None,
                    'district': announcement.building.district if announcement.building else None,
                    'coordinates': announcement.building.coordinates if announcement.building else None,
                    'house_type': announcement.building.house_type if announcement.building else None,
                    'year_of_construction': announcement.building.year_of_construction if announcement.building else None,
                    'number_of_floors': announcement.building.number_of_floors if announcement.building else None,
                    'ceiling_height': announcement.building.ceiling_height if announcement.building else None,
                    'passenger_elevator': announcement.building.passenger_elevator if announcement.building else None,
                    'service_elevator': announcement.building.service_elevator if announcement.building else None,
                    'courtyard': announcement.building.courtyard if announcement.building else None,
                    'parking': announcement.building.parking if announcement.building else None,
                } if announcement.building else None,
                'walk_score': announcement.walk_score,
                'personal_score': announcement.calculate_personal_score(user_filters),
                'nearby_amenities': nearby_amenities,  # Добавляем ближайшие удобства
            }
            
            return JsonResponse(data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
        