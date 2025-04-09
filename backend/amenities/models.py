from django.db import models

class Amenities(models.Model):
    amenity_id = models.AutoField(primary_key=True)
    title = models.CharField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    type = models.CharField(blank=True, null=True)
    coordinates = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.title

    class Meta:
        verbose_name_plural = "Удобства"
        verbose_name = "Amenities"
        db_table = 'amenities'
        unique_together = (('title', 'address'),)
