from rest_framework import viewsets, permissions
from .models import Department
from .serializers import DepartmentSerializer
from users.permissions import IsAdmin
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset= Department.objects.all()
    serializer_class = DepartmentSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]