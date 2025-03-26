from django.contrib import admin
from .models import Announcements

class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('name', 'building')
    change_list_template = "admin/announcements/change_list.html"  # Указываем кастомный шаблон

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_run_parser_button'] = True  # Добавляем переменную для шаблона
        return super().changelist_view(request, extra_context=extra_context)
    
admin.site.register(Announcements, AnnouncementAdmin)
