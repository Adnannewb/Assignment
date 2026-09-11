
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Doctor
from .serializers import DoctorSerializer
from users.permissions import IsAdmin
class DoctorViewSet(viewsets.ModelViewSet):
    queryset=Doctor.objects.select_related('user', 'department').all()
    serializer_class=DoctorSerializer
    filter_backends=[DjangoFilterBackend, filters.SearchFilter]
    filterset_fields=['department', 'is_available', 'specialization']
    search_fields=['user__first_name', 'user__last_name', 'specialization']
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]