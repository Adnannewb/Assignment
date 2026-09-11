from rest_framework import serializers
from .models import Appointment
class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name',read_only=True)
    doctor_name  = serializers.CharField(source='doctor.user.get_full_name',read_only=True)
    class Meta:
        model  = Appointment
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name',
                  'appointment_date', 'status', 'created_at']
        read_only_fields = ['created_at']
    def validate_appointment_date(self, value):
        from django.utils import timezone
        if value < timezone.now():
            raise serializers.ValidationError('Appointment date cannot be in the past.')
        return value