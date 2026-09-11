from django.db import models
from patients.models import Patient
from doctors.models import Doctor
# Create your models here.
class Appointment(models.Model):
    STATUS_CHOICES=[
        ('pending','PENDING'),
        ('approved','APPROVED'),
        ('completed','COMPLETED'),
        ('cancelled','CANCELLED'),
    ]
    patient=models.ForeignKey(Patient,on_delete=models.CASCADE,related_name='appointments')
    doctor=models.ForeignKey(Doctor,on_delete=models.CASCADE,related_name='appointments')
    appointment_date=models.DateTimeField()
    status=models.CharField(max_length=20,choices=STATUS_CHOICES,default='pending')
    created_at=models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-appointment_date']
    def __str__(self):
        return f"{self.patient} => {self.doctor} on {self.appointment_date:%Y-%m-%d}" 