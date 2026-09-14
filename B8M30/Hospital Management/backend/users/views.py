from django.shortcuts import render

# Create your views here.
from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .models import User
from .serializers import (
    PENDING_APPROVAL_MESSAGE,
    AdminUserCreateSerializer,
    CurrentUserSerializer,
    MyTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .permissions import IsAdmin, IsReceptionist
class RegisterView(generics.CreateAPIView):
    queryset= User.objects.all()
    serializer_class= RegisterSerializer
    permission_classes= [permissions.AllowAny]
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
class MyTokenRefreshView(TokenRefreshView):
    """Refusing unapproved users at login is not enough on its own: an
    account revoked after signing in would keep renewing its token until
    the refresh token expired. Re-check before issuing a new one."""
    def post(self, request, *args, **kwargs):
        # This endpoint is unauthenticated — the user id lives in the
        # refresh token itself, so read it from there.
        try:
            token = RefreshToken(request.data.get('refresh'))
        except TokenError:
            # Malformed or expired; let the parent produce the usual 401.
            return super().post(request, *args, **kwargs)

        user_id = token.payload.get(api_settings.USER_ID_CLAIM)
        if not User.objects.filter(pk=user_id, is_approved=True).exists():
            return Response(
                {'detail': PENDING_APPROVAL_MESSAGE},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().post(request, *args, **kwargs)
class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/users/me/ — the signed-in user's own account."""
    serializer_class   = CurrentUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user
class UserViewSet(viewsets.ModelViewSet):
    queryset= User.objects.all()
    serializer_class= UserSerializer
    filter_backends= [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields= ['role', 'is_approved']
    search_fields= ['username', 'first_name', 'last_name', 'email']
    def get_serializer_class(self):
        # Creating an account needs a password; editing one must not be
        # able to change it by accident.
        if self.action == 'create':
            return AdminUserCreateSerializer
        return UserSerializer
    def get_permissions(self):
        # Receptionists register patients, which means picking the user
        # account a patient profile attaches to — so they need to read the
        # user list. Everything that mutates accounts stays admin-only.
        if self.action in ['list', 'retrieve']:
            return [(IsAdmin | IsReceptionist)()]
        return [IsAdmin()]
    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        """PATCH /api/users/{id}/approve/ — let a pending account sign in."""
        user = self.get_object()
        user.is_approved = True
        user.save(update_fields=['is_approved'])
        return Response(UserSerializer(user).data)
    @action(detail=True, methods=['patch'], url_path='revoke')
    def revoke(self, request, pk=None):
        """PATCH /api/users/{id}/revoke/ — withdraw access."""
        user = self.get_object()
        if user == request.user:
            return Response(
                {'detail': 'You cannot revoke your own access.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_approved = False
        user.save(update_fields=['is_approved'])
        return Response(UserSerializer(user).data)
