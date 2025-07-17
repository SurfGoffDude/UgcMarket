# Изменения в chats/urls.py
"""
Конфигурация URL маршрутов для приложения chats.

В данном модуле описаны маршруты для API эндпоинтов чатов и сообщений,
включая специальные URL для доступа по ID участников.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ChatViewSet, MessageViewSet, 
    ChatByParticipantsView, ChatMessagesByParticipantsView
)
# Добавляем импорт CreateOrderResponseByOrderView
from .order_response_views import CreateOrderResponseByChatView, CreateOrderResponseByOrderView

# Настраиваем маршруты для стандартных ViewSet'ов
router = DefaultRouter()
router.register(r'', ChatViewSet, basename='chat')  # Убираем префикс 'chats/'

# URL-шаблоны для приложения chats
urlpatterns = [
    # Маршруты для стандартных ViewSet'ов
    path('', include(router.urls)),
    
    # Маршруты для доступа к чату по ID участников
    path('<str:participant_ids>/', ChatByParticipantsView.as_view(), name='chat-by-participants'),  # Убираем префикс 'chats/'
    path('<str:participant_ids>/messages/', ChatMessagesByParticipantsView.as_view(), name='chat-messages-by-participants'),  # Убираем префикс 'chats/'
    
    # Маршруты для сообщений в чатах (вложенный ресурс)
    path('<int:chat_pk>/messages/', MessageViewSet.as_view({'get': 'list', 'post': 'create'}), name='chat-messages'),  # Убираем префикс 'chats/'
    path('<int:chat_pk>/messages/<int:pk>/', MessageViewSet.as_view({'get': 'retrieve'}), name='chat-message-detail'),  # Убираем префикс 'chats/'
    
    # Маршрут для создания отклика на заказ через чат
    path('create-for-order/<int:chat_id>/', CreateOrderResponseByChatView.as_view(), name='create-order-response-by-chat'),  # Убираем префикс 'chats/'
    
    # Добавляем маршрут для создания отклика по ID заказа
    path('create-for-order-by-id/<int:order_id>/', CreateOrderResponseByOrderView.as_view(), name='create-order-response-by-order'),
]