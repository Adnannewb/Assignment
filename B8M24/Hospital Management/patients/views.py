from rest_framework import viewsets, permissions
from .models import Patient
from .serializers import PatientSerializer
from users.permissions import IsAdmin, IsDoctor, IsPatient
class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.select_related('user').all()
    serializer_class = PatientSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # get_queryset() already scopes 'patient' role users to their own
            # record, so it's safe to let them through here too.
            return [(IsAdmin | IsDoctor | IsPatient)()]
        if self.action == 'destroy':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]
    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Patient.objects.filter(user=user)
        return Patient.objects.all()