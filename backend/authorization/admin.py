from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Favorite, SearchQuery, User


class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'date_joined')
    
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    
    search_fields = ('username', 'email')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('email',)}),
        ('Права доступа', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Важные даты', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'announcement', 'created_at')
    list_filter = ('user', 'announcement')
    search_fields = ('user__username', 'announcement__title')
    
@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ('user', 'params')