from django.urls import path
from .views import run_distance_calculator_view


urlpatterns = [
    path('run-distance-calculator/', run_distance_calculator_view, name='run_distance_calculator'),
]
