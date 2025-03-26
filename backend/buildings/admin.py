from django.contrib import admin
from .models import Buildings

class BuildingsAdmin(admin.ModelAdmin):
    list_display = ('address_text', 'coordinates')

    # Добавляем кастомное действие
    actions = ['delete_null_address']

    def delete_null_address(self, request, queryset):
        # Игнорируем queryset и удаляем все записи с address_text = NULL
        deleted_count = Buildings.objects.filter(address_text__isnull=True).delete()[0]
        if deleted_count:
            self.message_user(request, f"Удалено {deleted_count} зданий с пустым адресом.")
        else:
            self.message_user(request, "Здания с пустым адресом не найдены.")

    delete_null_address.short_description = "Удалить все здания с пустым адресом"

admin.site.register(Buildings, BuildingsAdmin)
