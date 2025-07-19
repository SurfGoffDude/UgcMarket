"""
Сериализаторы для приложения chats.

В данном модуле описаны сериализаторы для моделей чатов и сообщений,
используемые для REST API.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Chat, Message
from orders.models import Order
from users.serializers import UserBriefSerializer

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели сообщений.
    
    Используется для преобразования объектов Message в JSON и обратно.
    Включает вложенный сериализатор для отправителя.
    """
    sender_details = UserBriefSerializer(source='sender', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'chat', 'sender', 'sender_details', 'content', 'attachment',
            'is_system_message', 'read_by_client', 'read_by_creator', 'created_at'
        ]
        read_only_fields = [
            'id', 'sender_details', 'is_system_message', 'read_by_client',
            'read_by_creator', 'created_at'
        ]
    
    def create(self, validated_data):
        """
        Переопределяем метод create для установки отправителя и
        статусов прочтения.
        """
        request = self.context.get('request')
        chat = validated_data.get('chat')
        
        # Устанавливаем текущего пользователя как отправителя, если не указано иначе
        if not validated_data.get('sender') and request and hasattr(request, 'user'):
            validated_data['sender'] = request.user
        
        # Устанавливаем флаги прочтения в зависимости от отправителя
        if validated_data.get('sender') == chat.client:
            validated_data['read_by_client'] = True
        elif validated_data.get('sender') == chat.creator:
            validated_data['read_by_creator'] = True
        
        return super().create(validated_data)


class ChatOrderSerializer(serializers.ModelSerializer):
    """
    Сериализатор для заказа в контексте чата.
    
    Представляет минимальную информацию о заказе, связанном с чатом.
    """
    class Meta:
        model = Order
        fields = ['id', 'title', 'status', 'budget']


class LastMessageSerializer(serializers.ModelSerializer):
    """
    Сериализатор для последнего сообщения в чате.
    
    Используется для отображения превью последнего сообщения в списке чатов.
    """
    sender_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender_name', 'is_system_message', 'created_at']
    
    def get_sender_name(self, obj):
        """
        Возвращает имя отправителя сообщения.
        
        Для системных сообщений возвращает "Система".
        
        Args:
            obj (Message): Объект сообщения.
            
        Returns:
            str: Имя отправителя или "Система".
        """
        if obj.is_system_message:
            return "Система"
        elif obj.sender:
            return obj.sender.username
        return None


class ChatListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка чатов.
    
    Используется для отображения чатов в списке с минимальной информацией.
    """
    client = UserBriefSerializer(read_only=True)
    creator = UserBriefSerializer(read_only=True)
    order = ChatOrderSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat
        fields = [
            'id', 'client', 'creator', 'order', 'last_message', 
            'unread_count', 'created_at', 'updated_at'
        ]
    
    def get_last_message(self, obj):
        """
        Возвращает последнее сообщение в чате.
        
        Args:
            obj (Chat): Объект чата.
            
        Returns:
            dict: Сериализованное последнее сообщение или None, если сообщений нет.
        """
        last_message = obj.get_last_message()
        if last_message:
            return LastMessageSerializer(last_message).data
        return None
    
    def get_unread_count(self, obj):
        """
        Возвращает количество непрочитанных сообщений для текущего пользователя.
        
        Args:
            obj (Chat): Объект чата.
            
        Returns:
            int: Количество непрочитанных сообщений.
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.get_unread_count_for_user(request.user)
        return 0


class ChatDetailSerializer(serializers.ModelSerializer):
    """
    Сериализатор для детальной информации о чате.
    
    Включает полную информацию о чате, включая сообщения.
    """
    client = UserBriefSerializer(read_only=True)
    creator = UserBriefSerializer(read_only=True)
    order = ChatOrderSerializer(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Chat
        fields = [
            'id', 'client', 'creator', 'order', 'messages', 
            'created_at', 'updated_at'
        ]


class ChatCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания чата.
    
    Используется для создания нового чата.
    """
    class Meta:
        model = Chat
        fields = ['client', 'creator', 'order']
    
    def validate(self, data):
        """
        Проверяет, что пользователь не создает чат с самим собой и
        что такой чат еще не существует.
        """
        client = data.get('client')
        creator = data.get('creator')
        
        # Проверяем, что клиент и креатор - разные пользователи
        if client == creator:
            raise serializers.ValidationError("Клиент и креатор должны быть разными пользователями")
        
        # Проверяем, что такой чат еще не существует
        if Chat.objects.filter(client=client, creator=creator).exists():
            raise serializers.ValidationError("Чат между этими пользователями уже существует")
        
        return data
    
    def create(self, validated_data):
        """
        Создаем новый чат и добавляем системное сообщение о создании чата.
        """
        chat = super().create(validated_data)
        
        # Создаем системное сообщение о создании чата
        Message.objects.create(
            chat=chat,
            content="Чат создан",
            is_system_message=True,
            read_by_client=False,
            read_by_creator=False
        )
        
        return chat