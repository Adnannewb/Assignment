from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm Password')
    # Public self-registration may only create the two self-service roles.
    # 'admin' and 'receptionist' carry elevated, role-based permissions
    # (see users.permissions) and must be granted by an existing admin
    # instead (e.g. via /api/users/{id}/ or Django admin) — otherwise
    # anyone could self-promote by simply POSTing role: "admin".
    role = serializers.ChoiceField(choices=[('doctor', 'Doctor'), ('patient', 'Patient')],
                                    default='patient')
    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'password', 'password2']
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)   
        user.save()
        return user
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'date_joined']
        read_only_fields = ['date_joined']