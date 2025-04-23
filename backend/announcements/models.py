from django.db import models
from buildings.models import Buildings
from .utils import calculate_walk_score as calculate_walk_score_util, calculate_personalized_score_db
from amenities.models import Amenities

class Announcements(models.Model):
    announcement_id = models.BigIntegerField(unique=True)
    name = models.CharField(('Название'), max_length=255, default="")
    url = models.URLField(('Ссылка'), max_length=500, default=None)
    published_at = models.DateTimeField(
        'Дата публикации',
        null=True,
        blank=True,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    price = models.IntegerField(('Цена'), default=None)
    pricePerMeter = models.IntegerField(('Цена за кв.м.'), null=True, default=None)
    photo = models.URLField(('Фото'), max_length=1000, default=None)
    coordinates = models.CharField(('Координаты'), max_length=100, blank=True, null=True, default=None)
    number_of_rooms = models.IntegerField(('Кол-во комнат'), blank=True, null=True, default=None)
    ceiling_height = models.DecimalField(('Высота потолков'), max_digits=10, decimal_places=1, null=True, default=None)
    total_area = models.DecimalField(('Общая площадь'), max_digits=10, decimal_places=1 ,default=None)
    kitchen_area = models.DecimalField(('Площадь кухни'), max_digits=10, null=True, decimal_places=1, default=None)
    floor = models.IntegerField(('Этаж'), default=None)
    balcony_or_loggia = models.CharField(('Балкон или лоджия'), max_length=50, blank=True, null=True, default=None)
    bathroom = models.CharField(('Санузел'), max_length=50, blank=True, null=True, default=None)
    windows = models.CharField(('Окна'), max_length=50, blank=True, null=True, default=None)
    repair = models.CharField(('Ремонт'), max_length=50, blank=True, null=True, default=None)
    walk_score = models.IntegerField(('Walk Score'), null=True, blank=True, help_text="Оценка пешей доступности (0-100)")
    building = models.ForeignKey(
        Buildings,
        on_delete=models.CASCADE,
        related_name="announcements",
        null=True,
        blank=True
    )
    
    def calculate_walk_score(self, save=False):
        if not self.building:
            return 0  # Если нет здания, вернем 0

        try:
            score = calculate_walk_score_util(self)
            if not save:
                self.walk_score = score
                self.save(update_fields=['walk_score'])
            
            return score

        except Exception as e:
            print(f"Error calculating walk score: {e}")
            return 0

    @property
    def walk_score_value(self):
        if self._state.adding:  # Если объект еще не сохранен в БД
            return self.calculate_walk_score()
        return self.walk_score or 0
    
    def save(self, *args, **kwargs):
        needs_recalculation = (
            not self.pk or 
            not self.walk_score or
            (self.pk and (
                self.coordinates != Announcements.objects.get(pk=self.pk).coordinates or
                self.building_id != Announcements.objects.get(pk=self.pk).building_id
            ))
        )
        if needs_recalculation:
            self.walk_score = self.calculate_walk_score(save=True)
            print(f"Calculated walk_score: {self.walk_score}")
        
        super().save(*args, **kwargs)
    
    def calculate_personal_score(self, user_filters=None, verbose=False):
        """
        Быстрый расчёт персонализированной оценки по данным в БД.
        """
        if not user_filters:
            print("user_filters is empty or None")
            return None

        if not self.building:
            return None  # у объявления нет связанного здания

        return calculate_personalized_score_db(
            building=self.building,
            user_filters=user_filters,
            verbose=verbose
        )

    @property
    def personal_score(self):
        return None

    def __str__(self):
        return self.name if self.name else "Без названия"

    def get_data_location_id(self):
        return self.building.data_location_id if self.building else None

    def get_building_address(self):
        return self.building.address_text if self.building else None

    class Meta:
        verbose_name = "Объявление"
        verbose_name_plural = "Объявления"
        managed = True
