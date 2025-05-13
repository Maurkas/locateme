from django.db import models
from django.utils import timezone

class FilterRequest(models.Model):
    filters = models.JSONField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.filters} - {self.created_at}"