"""
Конфигурация URL маршрутов для API проекта.

Данный модуль содержит маршруты для всех API эндпоинтов.
"""

from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from users.views import UserRegistrationView, EmailVerificationView, CurrentUserView
from .views import TagsView

# Маршруты для API без версионирования (для обратной совместимости)
nonversion_urlpatterns = [
    # Маршруты для аутентификации
    path('auth/', include([
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
        path('register/', UserRegistrationView.as_view(), name='register'),
        # Добавляем маршрут для верификации email, чтобы соответствовал URL в письме
        path('verify-email/<uidb64>/<token>/', EmailVerificationView.as_view(), name='verify-email'),
        # Добавляем маршрут для получения данных текущего пользователя
        path('user/', CurrentUserView.as_view(), name='current_user'),
    ])),
    
    # Теги
    path('tags/', TagsView.as_view(), name='tags'),

    # Маршруты для пользователей и профилей (включая верификацию email)
    path('', include('users.urls')),
    
    # Маршруты для заказов
    path('', include('orders.urls')),
    
    # Маршруты для чатов
    path('', include('chats.urls')),
]

urlpatterns = [
    # Добавляем версионирование API v1
    path('', include(nonversion_urlpatterns)),
    
    # Добавляем маршруты без версионирования для обратной совместимости
    *nonversion_urlpatterns
]