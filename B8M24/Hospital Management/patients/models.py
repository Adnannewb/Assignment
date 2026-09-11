from django.db import models
from django.conf import settings
# Create your models here.
class Patient(models.Model):
    BLOOD_GROUP_CHOICES = [
    ('A+','A+'),('A-','A-'),('B+','B+'),('B-','B-'),
    ('O+','O+'),('O-','O-'),('AB+','AB+'),('AB-','AB-'),
]
    GENDER_CHOICES=[
        ('male','MALE'),
        ('female','FEMALE'),
        ('other','OTHER'),
    ]
    user=models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='patient_profile')
    age=models.PositiveIntegerField(default=0)
    gender=models.CharField(max_length=10,choices=GENDER_CHOICES)
    blood_group=models.CharField(max_length=10,choices=BLOOD_GROUP_CHOICES,blank=True)
    address=models.TextField()
    phone=models.CharField(max_length=11,blank=True)
    
    def __str__(self):
        return self.user.get_full_name()