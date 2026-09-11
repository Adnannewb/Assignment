from django.db import models
from django.conf import settings
from departments.models import Department

# Create your models here.
class Doctor(models.Model):
    user=models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='doctor_profile')
    department=models.ForeignKey(Department,on_delete=models.SET_NULL,null=True,blank=True,related_name='doctors')
    specialization=models.CharField(max_length=100)
    phone=models.CharField(max_length=11,blank=True)
    experience=models.PositiveIntegerField(default=0)
    is_available=models.BooleanField(default=True)
    
    def __str__(self):
        return f"Dr. {self.user.get_full_name()} — {self.specialization}" 