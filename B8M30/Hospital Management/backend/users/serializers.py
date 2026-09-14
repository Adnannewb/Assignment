from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
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
        # A self-registered doctor is a claim, not a credential — hold the
        # account until an administrator approves it. Patients are let
        # straight in; they can only ever see their own record.
        user.is_approved = user.role != 'doctor'
        user.set_password(password)
        user.save()
        return user
class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Account creation by an administrator, from the User accounts page.

    Unlike public registration this allows every role — it is the only way
    an 'admin' or 'receptionist' account comes into existence — and the
    account is approved immediately, since an admin vouched for it.
    """
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm Password')
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='patient')
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
        user = User(**validated_data, is_approved=True)
        user.set_password(password)
        user.save()
        return user
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role',
                  'is_approved', 'date_joined']
        read_only_fields = ['date_joined']
class CurrentUserSerializer(UserSerializer):
    """The signed-in user plus the id of their doctor/patient profile.

    The frontend needs those ids to book an appointment or write a
    prescription "as me" without first searching the whole list.
    """
    doctor_id  = serializers.SerializerMethodField()
    patient_id = serializers.SerializerMethodField()
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['doctor_id', 'patient_id']
        # This serializer backs PATCH /api/users/me/, so 'role' and
        # 'is_approved' MUST stay read-only — otherwise any user could
        # promote or approve themselves by patching their own account.
        # Both are granted through the admin-only UserViewSet.
        read_only_fields = UserSerializer.Meta.read_only_fields + [
            'role', 'username', 'is_approved',
        ]
    def get_doctor_id(self, obj):
        # A reverse OneToOne raises AttributeError when the profile is
        # missing, so getattr with a default covers "no profile yet".
        profile = getattr(obj, 'doctor_profile', None)
        return profile.id if profile else None
    def get_patient_id(self, obj):
        profile = getattr(obj, 'patient_profile', None)
        return profile.id if profile else None
PENDING_APPROVAL_MESSAGE = (
    'Your account is waiting for administrator approval. You will be able to '
    'sign in once a hospital administrator has approved it.'
)
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds the role to the token claims and returns the user with the
    token pair, so the frontend can pick the right dashboard on login
    without a second round trip. Also refuses unapproved accounts."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role']     = user.role
        token['username'] = user.username
        return token
    def validate(self, attrs):
        data = super().validate(attrs)
        # Checked after the password, so an attacker cannot use this to
        # discover which usernames exist. AuthenticationFailed (401), not
        # ValidationError (400) — the request was well formed, the
        # credentials simply are not usable yet.
        if not self.user.is_approved:
            raise AuthenticationFailed(PENDING_APPROVAL_MESSAGE)
        data['user'] = CurrentUserSerializer(self.user).data
        return data