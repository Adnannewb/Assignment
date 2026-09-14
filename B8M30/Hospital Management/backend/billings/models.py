from django.db import models
from patients.models import Patient
# Create your models here.
class Bill(models.Model):
    patient    = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='bills')
    amount     = models.DecimalField(max_digits=10, decimal_places=2)
    paid       = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Bill #{self.id} — {'PAID' if self.paid else 'UNPAID'}" 