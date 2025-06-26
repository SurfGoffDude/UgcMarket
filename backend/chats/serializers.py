"""
Сериализаторы для приложения chats.

Модуль содержит сериализаторы для преобразования моделей чатов и сообщений
между объектами Python и форматом JSON.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.serializers import UserSerializer
from orders.serializers import OrderListSerializer
from .models import Chat, Message, SystemMessageTemplate

User = get_user_model()


class ChatListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для вывода списка чатов.
    
    Включает основную информацию о чате, включая последнее сообщение и участников.
    """
    client = UserSerializer(read_only=True)
    creator = UserSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat
        fields = [
            'id', 'client', 'creator', 'order', 'created_at', 
            'updated_at', 'is_active', 'last_message', 'unread_count'
        ]
        read_only_fields = ['client', 'creator', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        """Возвращает последнее сообщение в чате."""
        message = obj.messages.order_by('-created_at').first()
        if message:
            return {
                'id': message.id,
                'content': message.content,
                'sender': message.sender.username if message.sender else None,
                'is_system_message': message.is_system_message,
                'created_at': message.created_at
            }
        return None
    
    def get_unread_count(self, obj):
        """Возвращает количество непрочитанных сообщений для текущего пользователя."""
        user = self.context['request'].user
        if user == obj.client:
            # Подсчет непрочитанных сообщений для клиента (от креатора)
            return obj.messages.filter(sender=obj.creator, read_by_client=False).count()
        elif user == obj.creator:
            # Подсчет непрочитанных сообщений для креатора (от клиента)
            return obj.messages.filter(sender=obj.client, read_by_creator=False).count()
        return 0


class ChatDetailSerializer(ChatListSerializer):
    """
    Сериализатор для детального отображения чата вместе с сообщениями.
    """
    order_details = serializers.SerializerMethodField()
    
    class Meta(ChatListSerializer.Meta):
        fields = ChatListSerializer.Meta.fields + ['order_details']
    
    def get_order_details(self, obj):
        """Возвращает детали заказа, если он связан с чатом."""
        if obj.order:
            return {
                'id': obj.order.id,
                'title': obj.order.title,
                'status': obj.order.status,
                'budget': obj.order.budget
            }
        return None


class MessageSerializer(serializers.ModelSerializer):
    """
    Сериализатор для сообщений чата.
    """
    sender_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'chat', 'sender', 'sender_details', 'content', 'attachment',
            'is_system_message', 'created_at', 'read_by_client', 'read_by_creator'
        ]
        read_only_fields = ['sender', 'created_at', 'read_by_client', 'read_by_creator']
    
    def get_sender_details(self, obj):
        """Возвращает детали отправителя, если это не системное сообщение."""
        if obj.sender:
            return {
                'id': obj.sender.id,
                'username': obj.sender.username,
                'avatar': obj.sender.profile.avatar.url if hasattr(obj.sender, 'profile') and obj.sender.profile.avatar else None
            }
        return None
    
    def create(self, validated_data):
        """
        Создает новое сообщение и устанавливает отправителя.
        Проверяет права доступа к чату.
        """
        user = self.context['request'].user
        chat = validated_data['chat']
        
        # Проверяем, является ли пользователь участником чата
        if user != chat.client and user != chat.creator:
            raise serializers.ValidationError("Вы не являетесь участником этого чата")
        
        # Устанавливаем отправителя
        validated_data['sender'] = user
        
        # Для обычных пользовательских сообщений нельзя установить is_system_message=True
        validated_data['is_system_message'] = False
        
        # Создаем сообщение
        message = Message.objects.create(**validated_data)
        
        # Обновляем дату последнего сообщения в чате
        chat.updated_at = message.created_at
        chat.save(update_fields=['updated_at'])
        
        return message


class SystemMessageTemplateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для шаблонов системных сообщений.
    """
    class Meta:
        model = SystemMessageTemplate
        fields = ['id', 'event_type', 'template', 'is_active']