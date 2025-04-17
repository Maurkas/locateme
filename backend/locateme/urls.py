from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/announcements/', include('announcements.urls')),
    path('api/amenities/', include('amenities.urls')),
    path('api/auth/', include('authorization.urls')),
    path('api/buildings/', include('buildings.urls')),
]
