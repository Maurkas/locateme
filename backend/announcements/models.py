from django.db import models
from buildings.models import Buildings
from .utils import calculate_walk_score
from amenities.models import Amenities

class Announcements(models.Model):
    announcement_id = models.BigIntegerField(unique=True)
    name = models.CharField(('Название'), max_length=255, default="")
    url = models.URLField(('Ссылка'), max_length=500, default=None)
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
    building = models.ForeignKey(
        Buildings,
        on_delete=models.CASCADE,
        related_name="announcements",
        null=True,
        blank=True
    )
    
    def calculate_walk_score(self):
        """
        Рассчитывает Walk Score для текущего объявления.
        """
        # Преобразуем строку coordinates в кортеж (latitude, longitude)
        try:
            lat, lon = map(float, self.coordinates.split(","))
        except (ValueError, AttributeError):
            return 0  # Если координаты недоступны, возвращаем 0

        # Получаем все объекты инфраструктуры
        infrastructure_data = [
            {"type": obj.type, "coordinates": obj.coordinates}
            for obj in Amenities.objects.all()
        ]

        # Рассчитываем Walk Score
        return calculate_walk_score((lat, lon), infrastructure_data)

    @property
    def walk_score(self):
        return self.calculate_walk_score()

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
