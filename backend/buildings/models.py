from django.db import models


class Buildings(models.Model):
    building_id = models.AutoField(primary_key=True)
    address_text = models.TextField(blank=True, null=True)
    district = models.CharField(('Район'), max_length=255, blank=True, null=True, default=None)
    address_url = models.TextField(blank=True, null=True)
    coordinates = models.TextField(('Координаты'), blank=True, null=True)
    house_type = models.CharField(('Тип дома'), max_length=50, blank=True, null=True)
    year_of_construction = models.CharField(('Год постройки'), max_length=10, blank=True, null=True)
    number_of_floors = models.IntegerField(('Этажей в доме'), default=None)
    ceiling_height = models.CharField(('Высота потолков'), max_length=10, blank=True, null=True)
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
        
