from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Appointment
from .serializers import AppointmentSerializer
from users.permissions import IsAdminOrDoctor
class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related('patient', 'doctor').all()
    serializer_class = AppointmentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['doctor', 'patient', 'status', 'appointment_date']
    def get_permissions(self):
        # Only the assigned doctor (get_queryset scopes them to their own
        # appointments) or an admin may approve an appointment — a patient
        # should not be able to approve their own booking.
        if self.action == 'approve':
            return [IsAdminOrDoctor()]
        return [permissions.IsAuthenticated()]
    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Appointment.objects.filter(patient__user=user)
        if user.role == 'doctor':
            return Appointment.objects.filter(doctor__user=user)
        return Appointment.objects.all()  
    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel(self, request, pk=None):
        appt = self.get_object()
        appt.status = 'cancelled'
        appt.save()
        return Response({'status': 'Appointment cancelled.'})
    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        appt = self.get_object()
        appt.status = 'approved'
        appt.save()
        return Response({'status': 'Appointment approved.'})