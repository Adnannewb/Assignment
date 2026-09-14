from rest_framework import serializers
from .models import Bill
class BillSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    class Meta:
        model  = Bill
        fields = ['id', 'patient', 'patient_name', 'amount', 'paid', 'created_at']
        read_only_fields = ['created_at']