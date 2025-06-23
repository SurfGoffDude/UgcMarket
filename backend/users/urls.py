"""
Конфигурация URL маршрутов для приложения users.

Данный модуль содержит маршруты для всех эндпоинтов пользовательской части API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ClientProfileViewSet, CreatorProfileViewSet,
    UserRegistrationView, EmailVerificationView,
    PortfolioItemViewSet, PortfolioImageViewSet,
    CurrentCreatorProfileView, CurrentClientProfileView, ServiceViewSet
)

# Создаем роутер для API
router = DefaultRouter()
router.register('users', UserViewSet)
router.register('client-profiles', ClientProfileViewSet)
router.register('creator-profiles', CreatorProfileViewSet)
router.register('portfolio', PortfolioItemViewSet)
router.register('portfolio-images', PortfolioImageViewSet)
router.register('services', ServiceViewSet)

urlpatterns = [
    # Маршруты ViewSet для пользователей и профилей
    path('', include(router.urls)),
    
    # Маршрут для верификации email
    path('verify-email/<uidb64>/<token>/', EmailVerificationView.as_view(), name='verify-email'),
    
    # Прямые маршруты для профилей текущего пользователя
    path('creator-profile/', CurrentCreatorProfileView.as_view(), name='current-creator-profile'),
    path('client-profile/', CurrentClientProfileView.as_view(), name='current-client-profile'),
]