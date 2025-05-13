from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import reverse
from .models import FilterRequest
from .views import export_filters_to_excel

@admin.register(FilterRequest)
class FilterRequestAdmin(admin.ModelAdmin):
    change_list_template = 'admin/filter_request_change_list.html'
    list_display = ('created_at', 'filters_preview')
    list_filter = ('created_at',)
    date_hierarchy = 'created_at'

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('export-excel/', self.admin_site.admin_view(export_filters_to_excel), name='export_filters_to_excel'),
        ]
        return custom_urls + urls

    def filters_preview(self, obj):
        return str(obj.filters)[:100] + '...' if len(str(obj.filters)) > 100 else str(obj.filters)
    filters_preview.short_description = 'Фильтры (предпросмотр)'