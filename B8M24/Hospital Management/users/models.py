from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin','Admin'),
        ('doctor','Doctor'),
        ('patient','Patient'),
        ('receptionist','Receptionist'),
    ]
    role= models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    date_joined= models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.username} ({self.role})"
    