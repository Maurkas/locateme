from django.contrib import admin
from buildings.models import Buildings, BuildingAmenities


class BuildingsAdmin(admin.ModelAdmin):
    list_display = ('address_text', 'coordinates')

class BuildingsAmenitiesAdmin(admin.ModelAdmin):
    list_display = ('building', 'amenity', 'distance')
    change_list_template = "admin/buildings/change_list.html"
    
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_run_service_button'] = True
        return super().changelist_view(request, extra_context=extra_context)
    
admin.site.register(Buildings, BuildingsAdmin)
admin.site.register(BuildingAmenities, BuildingsAmenitiesAdmin)
