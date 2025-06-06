from django.contrib import admin
from .models import Favorite, SearchQuery

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'announcement', 'created_at')
    list_filter = ('user', 'announcement')
    search_fields = ('user__username', 'announcement__title')
    
@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ('user', 'params')