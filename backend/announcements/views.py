from django.contrib import messages
from django.urls import reverse
from django.db.models import Q, F
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
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

logger = logging.getLogger(__name__)

@staff_member_required
def run_parser_view(request):
    try:
        subprocess.Popen(['python', 'announcements/parser_avito/AvitoParser.py'])
        messages.success(request, "Парсер успешно запущен!")
    except Exception as e:
        messages.error(request, f"Ошибка при запуске парсера: {str(e)}")

    return HttpResponseRedirect(reverse('admin:announcements_announcements_changelist'))

class CustomPagination(PageNumberPagination):
    page_size = 21
    page_size_query_param = 'limit'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'total_items': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'results': data
        })

class AnnouncementListView(generics.ListAPIView):
    serializer_class = AnnouncementSerializer
    pagination_class = CustomPagination
    
    def get_queryset(self):
        queryset = Announcements.objects.select_related('building').all()
        params = self.request.GET

        # Фильтры по цене
        price_min = params.get('priceMin')
        price_max = params.get('priceMax')
        if price_min:
            queryset = queryset.filter(price__gte=price_min)
        if price_max:
            queryset = queryset.filter(price__lte=price_max)

        # Фильтры по районам
        districts = params.getlist('districts')
        if districts:
            queryset = queryset.filter(building__district__in=districts)

        # Количество комнат
        rooms = params.getlist('rooms')
        if rooms:
            queryset = queryset.filter(number_of_rooms__in=rooms)

        # Этаж, этажность, не первый/последний
        floor_min = params.get('floorMin')
        floor_max = params.get('floorMax')
        if floor_min:
            queryset = queryset.filter(floor__gte=floor_min)
        if floor_max:
            queryset = queryset.filter(floor__lte=floor_max)

        if params.get('notFirstFloor') == 'true':
            queryset = queryset.exclude(floor=1)
        if params.get('notLastFloor') == 'true':
            queryset = queryset.exclude(floor=F('building__number_of_floors'))

        # Ремонт
        repairs = params.getlist('repairType')
        if repairs:
            queryset = queryset.filter(repair__in=repairs)

        # Санузел
        bathrooms = params.getlist('bathroomType')
        if bathrooms:
            queryset = queryset.filter(bathroom__in=bathrooms)

        # Тип дома
        house_type = params.getlist('houseType')
        if house_type:
            queryset = queryset.filter(building__house_type__in=house_type)

        # Лифт
        elevators = params.getlist('elevator')
        for lift in elevators:
            queryset = queryset.filter(Q(building__passenger_elevator__icontains=lift) | Q(building__service_elevator__icontains=lift))

        # Парковка
        parkings = params.getlist('parking')
        if parkings:
            for p in parkings:
                queryset = queryset.filter(building__parking__icontains=p)

        # Площадь, кухня, потолки и т.д.
        area_min = params.get('totalAreaMin')
        area_max = params.get('totalAreaMax')
        if area_min:
            queryset = queryset.filter(total_area__gte=area_min)
        if area_max:
            queryset = queryset.filter(total_area__lte=area_max)

        kitchen_min = params.get('kitchenAreaMin')
        kitchen_max = params.get('kitchenAreaMax')
        if kitchen_min:
            queryset = queryset.filter(kitchen_area__gte=kitchen_min)
        if kitchen_max:
            queryset = queryset.filter(kitchen_area__lte=kitchen_max)

        ceiling_min = params.get('ceilingHeightMin')
        ceiling_max = params.get('ceilingHeightMax')
        if ceiling_min:
            queryset = queryset.filter(building__ceiling_height__gte=ceiling_min)
        if ceiling_max:
            queryset = queryset.filter(building__ceiling_height__lte=ceiling_max)

        # Год постройки
        year_min = params.get('yearOfConstructionMin')
        year_max = params.get('yearOfConstructionMax')
        if year_min:
            queryset = queryset.filter(building__year_of_construction__gte=year_min)
        if year_max:
            queryset = queryset.filter(building__year_of_construction__lte=year_max)

        # Сортировка
        sort = params.get('sort', 'default')
        if sort == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort == 'score':
            queryset = queryset.order_by('-walk_score')
        elif sort == 'date':
            queryset = queryset.order_by('-published_at')
        else:
            queryset = queryset.order_by('-created_at')

        return queryset

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
                'published_at': announcement.published_at,
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
                'nearby_amenities': nearby_amenities,
            }
            return JsonResponse(data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
        