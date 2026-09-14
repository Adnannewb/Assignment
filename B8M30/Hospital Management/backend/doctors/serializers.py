from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Doctor
class DoctorSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    class Meta:
        model  = Doctor
        fields = ['id', 'user', 'user_detail', 'department',
                  'specialization', 'phone', 'experience', 'is_available']
    