from django.db import models
from appointments.models import Appointment 
from medicines.models import Medicine
# Create your models here.

class Prescription(models.Model):
    appointment=models.OneToOneField(Appointment,on_delete=models.CASCADE,related_name='prescription')
    diagnosis=models.TextField()
    notes=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Rx for {self.appointment}"
    

class PrescriptionMedicine(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE,related_name='prescription_medicines')
    medicine= models.ForeignKey(Medicine,on_delete=models.CASCADE,related_name='prescription_medicines')
    dosage= models.CharField(max_length=100) 
    duration= models.CharField(max_length=100)
    def __str__(self):
        return f"{self.medicine.name} for Rx#{self.prescription.id}" 