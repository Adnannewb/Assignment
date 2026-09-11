from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Patient
class PatientSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    class Meta:
        model  = Patient
        fields = ['id', 'user', 'user_detail', 'age', 'gender',
                  'blood_group', 'address', 'phone']