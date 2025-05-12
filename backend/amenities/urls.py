from django.urls import path
from .views import run_parser_view, yandex_suggest, yandex_geocode


urlpatterns = [
    path('run-amenities-parser/', run_parser_view, name='run_amenities_parser'),
    path("yandex-suggest/", yandex_suggest, name="yandex_suggest"),
    path("yandex-geocode/", yandex_geocode, name="yandex_geocode"),
]
