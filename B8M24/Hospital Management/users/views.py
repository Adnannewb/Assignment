from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions, viewsets
from .models import User
from .serializers import RegisterSerializer, UserSerializer
from .permissions import IsAdmin
class RegisterView(generics.CreateAPIView):
    queryset= User.objects.all()
    serializer_class= RegisterSerializer
    permission_classes= [permissions.AllowAny]
class UserViewSet(viewsets.ModelViewSet):
    queryset= User.objects.all()
    serializer_class= UserSerializer
    permission_classes= [IsAdmin]