from django.urls import path
from .views import run_parser_view
from .views import AnnouncementListView, AnnouncementDetailView, calculate_scores

urlpatterns = [
    path('run-announcements-parser/', run_parser_view, name='run_announcements_parser'),
    path('', AnnouncementListView.as_view(), name='announcement-list'),
    path("score/", calculate_scores),
    path('<str:announcement_id>/', AnnouncementDetailView.as_view(), name='announcement-detail'),
]
