from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Bill
from .serializers import BillSerializer
from users.permissions import IsAdmin, IsAdminOrReceptionist
class BillViewSet(viewsets.ModelViewSet):
    queryset = Bill.objects.select_related('patient__user').all()
    serializer_class = BillSerializer
    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdmin()]
        if self.action == 'create':
            return [IsAdminOrReceptionist()]
        return [permissions.IsAuthenticated()]
    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Bill.objects.filter(patient__user=user)
        return Bill.objects.all()
    @action(detail=True, methods=['patch'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        """PATCH /api/billing/{id}/mark-paid/"""
        bill = self.get_object()
        bill.paid = True
        bill.save()
        return Response({'status': 'Bill marked as paid.'})