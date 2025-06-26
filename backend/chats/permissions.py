"""
Разрешения для приложения chats.

Модуль содержит классы разрешений для контроля доступа к чатам и сообщениям.
"""

from rest_framework import permissions


class IsChatParticipant(permissions.BasePermission):
    """
    Разрешение, позволяющее доступ только участникам чата.
    
    Участниками чата могут быть клиент или креатор.
    """
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, является ли пользователь участником чата.
        
        Args:
            request: Запрос.
            view: Представление.
            obj: Объект Chat.
            
        Returns:
            bool: True, если пользователь является клиентом или креатором чата.
        """
        # Проверяем, является ли пользователь клиентом или креатором чата
        return request.user == obj.client or request.user == obj.creator


class IsMessageSender(permissions.BasePermission):
    """
    Разрешение, позволяющее изменять или удалять сообщение только его отправителю.
    """
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, является ли пользователь отправителем сообщения.
        
        Args:
            request: Запрос.
            view: Представление.
            obj: Объект Message.
            
        Returns:
            bool: True, если пользователь является отправителем сообщения.
        """
        # Системные сообщения нельзя изменять или удалять
        if obj.is_system_message:
            return False
        
        # Позволяет изменение только отправителю сообщения
        return not obj.is_system_message and obj.sender == request.user