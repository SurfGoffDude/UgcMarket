"""
Пользовательские разрешения для приложения orders.

Содержит классы разрешений для контроля доступа к API заказов.
"""

from rest_framework import permissions


class IsClientOrReadOnly(permissions.BasePermission):
    """
    Разрешение, которое позволяет полный доступ только клиенту заказа,
    а остальным только чтение.
    """
    def has_object_permission(self, request, view, obj):
        # Разрешаем GET, HEAD, OPTIONS всем
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Запись разрешена только владельцу заказа (клиенту)
        return obj.client == request.user


class IsOrderClient(permissions.BasePermission):
    """
    Разрешение, которое позволяет доступ только клиенту заказа.
    """
    def has_object_permission(self, request, view, obj):
        return obj.client == request.user


class IsOrderCreator(permissions.BasePermission):
    """
    Разрешение, которое позволяет доступ только исполнителю заказа.
    """
    def has_object_permission(self, request, view, obj):
        return obj.creator == request.user


class IsOrderParticipant(permissions.BasePermission):
    """
    Разрешение, которое позволяет доступ клиенту или исполнителю заказа.
    """
    def has_object_permission(self, request, view, obj):
        # Получаем заказ в зависимости от типа объекта
        if hasattr(obj, 'order'):
            order = obj.order
        else:
            order = obj
        
        # Проверяем, является ли пользователь клиентом или исполнителем
        return (order.client == request.user or 
                (order.creator and order.creator == request.user))


class IsReviewAuthor(permissions.BasePermission):
    """
    Разрешение, которое позволяет доступ только автору отзыва.
    """
    def has_object_permission(self, request, view, obj):
        # Разрешаем GET, HEAD, OPTIONS всем
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Запись разрешена только автору отзыва
        return obj.author == request.user