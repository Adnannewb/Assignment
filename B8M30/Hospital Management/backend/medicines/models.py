from django.db import models

# Create your models here.
class Medicine(models.Model):
    name=models.CharField(max_length=100)
    description=models.TextField(blank=True)
    unit=models.CharField(max_length=50)
    def __str__(self):
        return f"{self.name} {self.unit}"