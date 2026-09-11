from rest_framework import viewsets, permissions
from .models import Prescription
from .serializers import PrescriptionSerializer
from users.permissions import IsAdminOrDoctor
class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.prefetch_related('prescription_medicines__medicine').all()
    serializer_class = PrescriptionSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrDoctor()]
        return [permissions.IsAuthenticated()]
    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Prescription.objects.filter(appointment__patient__user=user)
        if user.role == 'doctor':
            return Prescription.objects.filter(appointment__doctor__user=user)
        return Prescription.objects.all()