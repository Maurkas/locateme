from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/announcements/', include('announcements.urls')),
    path('api/amenities/', include('amenities.urls')),
]
