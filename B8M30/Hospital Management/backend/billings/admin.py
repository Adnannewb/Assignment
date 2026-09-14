from django.contrib import admin
from .models import Bill
# Register your models here.
@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ['patient', 'amount', 'paid', 'created_at']
    list_filter  = ['paid']