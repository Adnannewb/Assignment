from django.contrib import admin
from .models import Doctor
# Register your models here.
@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['user', 'specialization', 'department', 'is_available']
    list_filter  = ['is_available', 'department']