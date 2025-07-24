from django.db import models
from amenities.models import Amenities


class Buildings(models.Model):
    building_id = models.AutoField(primary_key=True)
    address_text = models.TextField(blank=True, null=True)
    district = models.CharField(('Район'), max_length=255, blank=True, null=True, default=None)
    coordinates = models.TextField(('Координаты'), blank=True, null=True)
    house_type = models.CharField(('Тип дома'), max_length=50, blank=True, null=True)
    year_of_construction = models.CharField(('Год постройки'), max_length=10, blank=True, null=True)
    number_of_floors = models.IntegerField(('Этажей в доме'), default=None)
    passenger_elevator = models.CharField(('Пассажирский лифт'), max_length=50, blank=True, null=True)
    service_elevator = models.CharField(('Грузовой лифт'), max_length=50, blank=True, null=True)
    courtyard = models.CharField(('Двор'), max_length=1000, blank=True, null=True)
    parking = models.CharField(('Парковка'), max_length=1000, blank=True, null=True)


    def __str__(self):
        return str(self.building_id)
    
    class Meta:
        verbose_name_plural = "Здания"
        verbose_name = "Buildings"
        db_table = 'buildings'
        
        
class BuildingAmenities(models.Model):
    building = models.ForeignKey(Buildings, on_delete=models.CASCADE)
    amenity = models.ForeignKey(Amenities, on_delete=models.CASCADE)
    distance = models.FloatField(help_text="Дистанция в метрах")

    def __str__(self):
        return f"{self.building_id} ↔ {self.amenity_id}: {self.distance} м"

    class Meta:
        verbose_name = "building_amenities"
        verbose_name_plural = "Связь здания и удобства"
        db_table = "building_amenities"


