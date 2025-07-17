"""
Классы разрешений для приложения chats.

В данном модуле описаны кастомные классы разрешений,
используемые для контроля доступа к API чатов и сообщений.
"""

from rest_framework import permissions


class IsClientOrCreator(permissions.BasePermission):
    """
    Разрешение для доступа к чату только клиенту или креатору.
    
    Разрешает доступ только если пользователь является клиентом или креатором в чате.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, является ли пользователь клиентом или креатором в чате.
        
        Args:
            request: Объект запроса.
            view: Представление, обрабатывающее запрос.
            obj: Объект чата.
            
        Returns:
            bool: True, если пользователь является клиентом или креатором, иначе False.
        """
        user = request.user
        return user == obj.client or user == obj.creator


class IsParticipantInChat(permissions.BasePermission):
    """
    Разрешение для доступа к сообщениям только участникам чата.
    
    Разрешает доступ только если пользователь является клиентом или креатором в чате,
    к которому относится сообщение.
    """
    
    def has_permission(self, request, view):
        """
        Проверяет, является ли пользователь участником чата для доступа к списку сообщений.
        
        Args:
            request: Объект запроса.
            view: Представление, обрабатывающее запрос.
            
        Returns:
            bool: True, если пользователь является участником чата, иначе False.
        """
        chat_id = view.kwargs.get('chat_pk')
        if not chat_id:
            return False
        
        from .models import Chat
        try:
            chat = Chat.objects.get(pk=chat_id)
            return request.user == chat.client or request.user == chat.creator
        except Chat.DoesNotExist:
            return False
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, является ли пользователь участником чата для доступа к конкретному сообщению.
        
        Args:
            request: Объект запроса.
            view: Представление, обрабатывающее запрос.
            obj: Объект сообщения.
            
        Returns:
            bool: True, если пользователь является участником чата, иначе False.
        """
        chat = obj.chat
        return request.user == chat.client or request.user == chat.creator