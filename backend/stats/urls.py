from django.urls import path
from .views import FilterStatsAPIView, export_filters_to_excel

urlpatterns = [
    path('save-filter-stats/', FilterStatsAPIView.as_view(), name='save_filter_stats'),
    path('admin/export-filters-xlsx/', export_filters_to_excel, name='export_filters_to_excel'),
]