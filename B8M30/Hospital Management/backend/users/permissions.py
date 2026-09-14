from rest_framework.permissions import BasePermission
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user.is_authenticated
            and (user.role == 'admin' or user.is_staff or user.is_superuser)
        )
class IsDoctor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'doctor'
class IsPatient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'patient'
class IsReceptionist(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'receptionist'
class IsAdminOrDoctor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin','doctor')
class IsAdminOrReceptionist(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin','receptionist')