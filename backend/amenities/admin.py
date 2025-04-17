from django.contrib import admin
from .models import Amenities


@admin.register(Amenities)
class AmenitiesAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'address')
    change_list_template = "admin/amenities/change_list.html"

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_run_parser_button'] = True  # Добавляем переменную для шаблона
        return super().changelist_view(request, extra_context=extra_context)