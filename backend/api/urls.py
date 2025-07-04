"""
Конфигурация URL маршрутов для API проекта.

Данный модуль содержит маршруты для всех API эндпоинтов,
а также настройку Swagger UI и ReDoc для автоматической документации API.
"""

from django.urls import path, include, re_path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from users.views import UserRegistrationView, EmailVerificationView, CurrentUserView
from .views import TagsView

from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Настройка Swagger/ReDoc
schema_view = get_schema_view(
   openapi.Info(
      title="UGC Market API",
      default_version="v1",
      description="API для платформы пользовательского контента",
      terms_of_service="https://www.ugcmarket.com/terms/",
      contact=openapi.Contact(email="artemshloida@gmail.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

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

# Добавляем маршруты для Swagger UI и ReDoc
swagger_urlpatterns = [
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

urlpatterns = [
    # Добавляем версионирование API v1
    path('', include(nonversion_urlpatterns)),
    
    # Добавляем маршруты без версионирования для обратной совместимости
    *nonversion_urlpatterns,
    
    # Добавляем маршруты для Swagger UI и ReDoc
    *swagger_urlpatterns
]