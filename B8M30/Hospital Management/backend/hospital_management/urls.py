from django.contrib import admin
from django.urls   import path, include
from users.views import MyTokenObtainPairView, MyTokenRefreshView
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/',MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/',MyTokenRefreshView.as_view(),   name='token_refresh'),
    path('api/users/',include('users.urls')),
    path('api/departments/',include('departments.urls')),
    path('api/doctors/',include('doctors.urls')),
    path('api/patients/',include('patients.urls')),
    path('api/appointments/',include('appointments.urls')),
    path('api/prescriptions/',include('prescriptions.urls')),
    path('api/medicines/',include('medicines.urls')),
    path('api/billing/',include('billings.urls')),
]