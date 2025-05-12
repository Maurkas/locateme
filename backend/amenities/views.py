from django.contrib import messages
from django.urls import reverse
import subprocess
from django.http import HttpResponseRedirect
from django.contrib.admin.views.decorators import staff_member_required
import requests
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@require_GET
def yandex_suggest(request):
    query = request.GET.get("q", "")
    if not query:
        return JsonResponse({"error": "Missing query"}, status=400)

    yandex_url = "https://suggest-maps.yandex.ru/v1/suggest"
    params = {
        "apikey": '65de43c0-b8c2-4a9f-ad9b-fa538a13c4fd',
        "text": query,
        "lang": "ru_RU",
        "ll": "48.0408,46.3497",  # долгота, широта центра Астрахани
        "spn": "0.3,0.3" 
    }

    try:
        response = requests.get(yandex_url, params=params, timeout=5)
        print(response.status_code, response.text)
        response.raise_for_status()
        return JsonResponse(response.json())
    except requests.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_GET
def yandex_geocode(request):
    address = request.GET.get("address")
    if address=="":
        return JsonResponse({"error": "Missing address"}, status=400)

    url = "https://geocode-maps.yandex.ru/1.x/"
    params = {
        "apikey": 'f2ffe431-93fd-4382-a5fa-78a288691f2d',
        "geocode": address,
        "format": "json",
        "lang": "ru_RU"
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        # Достаем координаты из ответа
        pos = data["response"]["GeoObjectCollection"]["featureMember"]
        if not pos:
            return JsonResponse({"error": "Address not found"}, status=404)

        coords = pos[0]["GeoObject"]["Point"]["pos"]
        lon, lat = map(float, coords.split())
        return JsonResponse({"lat": lat, "lon": lon})
    except requests.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)


@staff_member_required
def run_parser_view(request):
    try:
        subprocess.Popen(['python', 'amenities/parsers/parsers.py'])
        messages.success(request, "Парсер успешно запущен!")
    except Exception as e:
        messages.error(request, f"Ошибка при запуске парсера: {str(e)}")

    return HttpResponseRedirect(reverse('admin:amenities_amenities_changelist'))
