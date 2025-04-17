from django.db import models
from django.contrib.auth.models import User
from announcements.models import Announcements

class Favorite(models.Model):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='favorites',
        verbose_name='Пользователь'
    )
    announcement = models.ForeignKey(
        Announcements,
        on_delete=models.CASCADE,
        to_field='announcement_id',
        related_name='favorited_by',
        verbose_name='Объявление'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата добавления'
    )

    class Meta:
        verbose_name = 'Избранное'
        verbose_name_plural = 'Избранные'
        unique_together = ('user', 'announcement')
    
    def __str__(self):
        return f"{self.user.username} - {self.announcement.name}"
    
class SearchQuery(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, blank=True)
    params = models.JSONField()  # Параметры поиска
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Поисковый запрос'
        verbose_name_plural = 'Поисковые запросы'

    def __str__(self):
        return f"{self.user.username} - {self.name or 'Без названия'}"