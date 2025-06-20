"""
Конфигурация URL маршрутов для приложения orders.

Данный модуль содержит маршруты для API заказов и связанных с ними ресурсов.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, TagViewSet, OrderViewSet,
    OrderAttachmentViewSet, OrderResponseViewSet,
    DeliveryViewSet, ReviewViewSet
)

# Создаем роутер для API
router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('tags', TagViewSet)
router.register('orders', OrderViewSet)
router.register('order-attachments', OrderAttachmentViewSet)
router.register('order-responses', OrderResponseViewSet)
router.register('deliveries', DeliveryViewSet)
router.register('reviews', ReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
]