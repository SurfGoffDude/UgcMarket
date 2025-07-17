"""
Представления для приложения chats.

В данном модуле описаны представления для работы с чатами и сообщениями,
включая ViewSets и специальные обработчики для API.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import Chat, Message
from .serializers import (
    ChatListSerializer, ChatDetailSerializer, ChatCreateSerializer,
    MessageSerializer
)
from .permissions import IsClientOrCreator, IsParticipantInChat
from orders.models import Order, OrderResponse

User = get_user_model()

import logging
logger = logging.getLogger(__name__)


class ChatViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с чатами.
    
    Предоставляет стандартные операции CRUD для чатов.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Возвращает чаты, в которых текущий пользователь является клиентом или креатором.
        """
        user = self.request.user
        return Chat.objects.filter(
            Q(client=user) | Q(creator=user)
        ).select_related('client', 'creator', 'order')
    
    def get_serializer_class(self):
        """
        Возвращает соответствующий сериализатор в зависимости от действия.
        """
        if self.action == 'list':
            return ChatListSerializer
        elif self.action == 'create':
            return ChatCreateSerializer
        return ChatDetailSerializer
    
    def get_permissions(self):
        """
        Устанавливает разрешения в зависимости от действия.
        """
        if self.action in ['retrieve', 'update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsClientOrCreator()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Отмечает все сообщения в чате как прочитанные для текущего пользователя.
        """
        chat = self.get_object()
        user = request.user
        
        # Определяем, является ли пользователь клиентом или креатором
        is_client = user == chat.client
        is_creator = user == chat.creator
        
        if not (is_client or is_creator):
            return Response(
                {'error': 'Вы не являетесь участником этого чата'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Отмечаем сообщения как прочитанные
        if is_client:
            unread_messages = chat.messages.filter(read_by_client=False)
            unread_messages.update(read_by_client=True)
        elif is_creator:
            unread_messages = chat.messages.filter(read_by_creator=False)
            unread_messages.update(read_by_creator=True)
        
        return Response({'status': 'Сообщения отмечены как прочитанные'})


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с сообщениями.
    
    Предоставляет операции создания и получения сообщений.
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsParticipantInChat]
    
    def get_queryset(self):
        """
        Возвращает сообщения для указанного чата.
        """
        chat_id = self.kwargs.get('chat_pk')
        return Message.objects.filter(chat_id=chat_id)
    
    def perform_create(self, serializer):
        """
        Устанавливает отправителя сообщения как текущего пользователя.
        """
        chat_id = self.kwargs.get('chat_pk')
        chat = get_object_or_404(Chat, pk=chat_id)
        
        # Проверяем, является ли пользователь участником чата
        user = self.request.user
        if user != chat.client and user != chat.creator:
            raise serializers.ValidationError(
                'Вы не являетесь участником этого чата'
            )
        
        serializer.save(chat=chat, sender=user)


class ChatByParticipantsView(APIView):
    """
    Представление для получения или создания чата по ID участников.
    
    URL формат: /api/chats/<creator_id>-<client_id>/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, participant_ids):
        """
        Получение чата и его сообщений по ID участников.
        
        Args:
            request: Объект запроса.
            participant_ids: Строка вида "creator_id-client_id".
            
        Returns:
            Response: Ответ с данными чата или ошибкой.
        """
        try:
            # Разбираем ID участников
            creator_id, client_id = map(int, participant_ids.split('-'))
            
            # Проверяем, что текущий пользователь является одним из участников
            user = request.user
            if user.id != creator_id and user.id != client_id:
                return Response(
                    {'error': 'Вы не являетесь участником этого чата'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Ищем чат по участникам (в любом порядке)
            chat = Chat.objects.filter(
                (Q(creator_id=creator_id) & Q(client_id=client_id)) |
                (Q(creator_id=client_id) & Q(client_id=creator_id))
            ).first()
            
            if not chat:
                # Если чат не существует, создаем новый
                creator = get_object_or_404(User, id=creator_id)
                client = get_object_or_404(User, id=client_id)
                
                # Проверяем, что оба участника существуют
                if not creator or not client:
                    return Response(
                        {'error': 'Один из участников не найден'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Создаем новый чат
                chat = Chat.objects.create(creator=creator, client=client)
                
                # Добавляем системное сообщение
                Message.objects.create(
                    chat=chat,
                    content="Чат создан",
                    is_system_message=True
                )
            
            # Отмечаем сообщения как прочитанные для текущего пользователя
            if user.id == chat.client.id:
                unread_messages = chat.messages.filter(read_by_client=False)
                unread_messages.update(read_by_client=True)
            elif user.id == chat.creator.id:
                unread_messages = chat.messages.filter(read_by_creator=False)
                unread_messages.update(read_by_creator=True)
            
            # Сериализуем чат и возвращаем
            serializer = ChatDetailSerializer(chat, context={'request': request})
            return Response(serializer.data)
            
        except ValueError:
            return Response(
                {'error': 'Неверный формат идентификаторов участников. Ожидается формат "creator_id-client_id"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Один или оба участника не найдены'},
                status=status.HTTP_404_NOT_FOUND
            )


class ChatMessagesByParticipantsView(APIView):
    """
    Представление для отправки сообщений в чат по ID участников.
    
    URL формат: /api/chats/<creator_id>-<client_id>/messages/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, participant_ids):
        """
        Отправка сообщения в чат по ID участников.
        
        Args:
            request: Объект запроса.
            participant_ids: Строка вида "creator_id-client_id".
            
        Returns:
            Response: Ответ с данными созданного сообщения или ошибкой.
        """
        try:
            # Разбираем ID участников
            creator_id, client_id = map(int, participant_ids.split('-'))
            
            # Проверяем, что текущий пользователь является одним из участников
            user = request.user
            if user.id != creator_id and user.id != client_id:
                return Response(
                    {'error': 'Вы не являетесь участником этого чата'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Ищем чат по участникам (в любом порядке)
            chat = Chat.objects.filter(
                (Q(creator_id=creator_id) & Q(client_id=client_id)) |
                (Q(creator_id=client_id) & Q(client_id=creator_id))
            ).first()
            
            if not chat:
                # Если чат не существует, создаем новый
                creator = get_object_or_404(User, id=creator_id)
                client = get_object_or_404(User, id=client_id)
                
                # Проверяем, что оба участника существуют
                if not creator or not client:
                    return Response(
                        {'error': 'Один из участников не найден'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Создаем новый чат
                chat = Chat.objects.create(creator=creator, client=client)
                
                # Добавляем системное сообщение
                Message.objects.create(
                    chat=chat,
                    content="Чат создан",
                    is_system_message=True
                )
            
            # Создаем новое сообщение
            content = request.data.get('content', '').strip()
            if not content:
                return Response(
                    {'error': 'Содержимое сообщения не может быть пустым'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Обрабатываем вложение, если оно есть
            attachment = request.FILES.get('attachment')
            
            # Создаем сообщение
            message = Message.objects.create(
                chat=chat,
                sender=user,
                content=content,
                attachment=attachment,
                read_by_client=user.id == chat.client.id,
                read_by_creator=user.id == chat.creator.id
            )
            
            # Сериализуем сообщение и возвращаем
            serializer = MessageSerializer(message, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ValueError:
            return Response(
                {'error': 'Неверный формат идентификаторов участников. Ожидается формат "creator_id-client_id"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Один или оба участника не найдены'},
                status=status.HTTP_404_NOT_FOUND
            )