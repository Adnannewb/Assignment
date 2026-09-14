from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MeView, RegisterView, UserViewSet
router = DefaultRouter()
router.register('', UserViewSet, basename='user')
urlpatterns = [
    path('register/',RegisterView.as_view(), name='register'),
    # 'me/' has to be declared before the router include: the router's
    # detail route would otherwise swallow it as a lookup value.
    path('me/',MeView.as_view(), name='me'),
    path('',include(router.urls)),
]
