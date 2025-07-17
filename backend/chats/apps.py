"""
Конфигурация приложения chats.
"""

from django.apps import AppConfig


class ChatsConfig(AppConfig):
    """
    Конфигурация приложения чатов.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chats'
    verbose_name = 'Чаты'