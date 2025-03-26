from django.urls import path
from .views import run_parser_view


urlpatterns = [
    path('run-amenities-parser/', run_parser_view, name='run_amenities_parser'),
]
