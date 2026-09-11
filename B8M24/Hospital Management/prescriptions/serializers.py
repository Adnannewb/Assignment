from rest_framework import serializers
from .models import Prescription, PrescriptionMedicine
class PrescriptionMedicineSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    class Meta:
        model  = PrescriptionMedicine
        fields = ['id', 'medicine', 'medicine_name', 'dosage', 'duration']
class PrescriptionSerializer(serializers.ModelSerializer):
    prescription_medicines = PrescriptionMedicineSerializer(many=True)
    class Meta:
        model  = Prescription
        fields = ['id', 'appointment', 'diagnosis', 'notes','created_at', 'prescription_medicines']
        read_only_fields = ['created_at']
    def create(self, validated_data):
        medicines_data = validated_data.pop('prescription_medicines')
        prescription = Prescription.objects.create(**validated_data)
        for med in medicines_data:
            PrescriptionMedicine.objects.create(prescription=prescription, **med)
        return prescription