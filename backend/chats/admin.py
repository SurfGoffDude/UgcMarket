"""
Административный интерфейс для приложения chats.

В данном модуле описаны настройки административного интерфейса Django
для моделей чатов и сообщений.
"""

from django.contrib import admin
from .models import Chat, Message


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    """
    Административный интерфейс для модели Chat.
    """
    list_display = ('id', 'client', 'creator', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('client__username', 'creator__username')
    raw_id_fields = ('client', 'creator')
    date_hierarchy = 'created_at'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """
    Административный интерфейс для модели Message.
    """
    list_display = ('id', 'chat', 'sender', 'content_preview', 'is_system_message', 
                   'read_by_client', 'read_by_creator', 'created_at')
    list_filter = ('is_system_message', 'read_by_client', 'read_by_creator', 'created_at')
    search_fields = ('content', 'sender__username', 'chat__id')
    raw_id_fields = ('chat', 'sender')
    date_hierarchy = 'created_at'
    
    def content_preview(self, obj):
        """
        Возвращает сокращенную версию содержимого сообщения для отображения в списке.
        
        Args:
            obj (Message): Объект сообщения.
            
        Returns:
            str: Сокращенная версия содержимого сообщения.
        """
        max_length = 50
        if len(obj.content) > max_length:
            return f"{obj.content[:max_length]}..."
        return obj.content
    
    content_preview.short_description = 'Содержимое'