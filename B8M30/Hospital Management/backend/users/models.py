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
    # Doctors who sign themselves up start unapproved and cannot sign in
    # until an administrator vets them — a self-declared doctor would
    # otherwise immediately gain access to every patient record. Accounts
    # created by an admin, and patients, are approved on creation.
    is_approved= models.BooleanField(
        default=True,
        help_text='Unapproved users cannot sign in. Self-registered doctors '
                  'await administrator approval.',
    )
    def __str__(self):
        return f"{self.username} ({self.role})"
    