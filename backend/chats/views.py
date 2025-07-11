"""
Представления для приложения chats.

Модуль содержит представления для работы с чатами и сообщениями.
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Max, F
from django.utils import timezone

from .models import Chat, Message, SystemMessageTemplate
from .serializers import (
    ChatListSerializer, ChatDetailSerializer, 
    MessageSerializer, SystemMessageTemplateSerializer
)
from .permissions import IsChatParticipant, IsMessageSender
from .serializers import ChatDetailSerializer  # Добавляем импорт ChatDetailSerializer в начале файла

class ChatViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с чатами.
    
    Поддерживает создание, просмотр, обновление и удаление чатов,
    а также получение списка своих чатов и чатов для конкретного заказа.
    """
    serializer_class = ChatListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['client__username', 'creator__username', 'order__title']
    
    def get_queryset(self):
        """
        Возвращает чаты, в которых пользователь является участником.
        """
        user = self.request.user
        return Chat.objects.filter(
            Q(client=user) | Q(creator=user)
        ).annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-last_message_time', '-updated_at')
    
    def get_serializer_class(self):
        """
        Возвращает соответствующий сериализатор в зависимости от действия.
        """
        if self.action == 'retrieve':
            return ChatDetailSerializer
        return ChatListSerializer
    
    def get_permissions(self):
        """
        Возвращает соответствующие права доступа в зависимости от действия.
        """
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsChatParticipant()]
        return [permissions.IsAuthenticated()]
    
    def retrieve(self, request, *args, **kwargs):
        """
        Получает чат по ID и помечает сообщения как прочитанные.
        """
        instance = self.get_object()
        user = request.user
        
        # Помечаем сообщения как прочитанные
        if user == instance.client:
            # Если пользователь - клиент, помечаем сообщения от креатора как прочитанные
            instance.messages.filter(sender=instance.creator, is_read=False).update(is_read=True)
        elif user == instance.creator:
            # Если пользователь - креатор, помечаем сообщения от клиента как прочитанные
            instance.messages.filter(sender=instance.client, is_read=False).update(is_read=True)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_chats(self, request):
        """
        Возвращает список чатов текущего пользователя.
        """
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def order_chats(self, request):
        """
        Возвращает чаты, связанные с конкретным заказом.
        """
        order_id = request.query_params.get('order_id')
        if not order_id:
            return Response(
                {'error': 'Не указан параметр order_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        queryset = Chat.objects.filter(
            order_id=order_id
        ).filter(
            Q(client=user) | Q(creator=user)
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'], url_path='by-order/(?P<order_id>\d+)')
    def get_chat_by_order(self, request, order_id=None):
        """
        Возвращает один чат, связанный с конкретным заказом.
        Если чатов несколько, возвращает первый найденный.
        """
        if not order_id:
            return Response(
                {'error': 'Не указан ID заказа'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        chat = Chat.objects.filter(
            order_id=order_id
        ).filter(
            Q(client=user) | Q(creator=user)
        ).first()
        
        if not chat:
            return Response(
                {'error': 'Чат не найден или у вас нет к нему доступа'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ChatDetailSerializer(chat, context={'request': request})
        return Response(serializer.data)
        
    @action(detail=False, methods=['post'], url_path='create-for-order/(?P<order_id>\d+)')
    def create_chat_for_order(self, request, order_id=None):
        """
        Создает чат для заказа, если он еще не существует.
        Чат может быть создан только креатором (исполнителем) как отклик на заказ.
        Клиент не может создавать чат, он должен ждать отклика креатора.
        """
        if not order_id:
            return Response(
                {'error': 'Не указан ID заказа'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Импортируем модель заказа
        from orders.models import Order
        
        try:
            # Получаем заказ по ID
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Заказ не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user = request.user
        
        # Проверяем доступ к заказу
        # Если пользователь - владелец заказа, всегда предоставляем доступ
        if user == order.client:
            # Клиент не может создать чат, только исполнитель
            return Response(
                {'error': 'Чат может быть начат только исполнителем. Пожалуйста, дождитесь отклика на ваш заказ.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Если это приватный заказ, проверяем, что пользователь - целевой креатор
        if order.is_private and order.target_creator != user:
            return Response(
                {'error': 'Заказ является приватным и назначен другому исполнителю'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Если это публичный заказ, проверяем, что пользователь - креатор
        if not order.is_private:
            # Проверяем, является ли пользователь креатором
            # В модели User есть метод has_creator_profile
            if not user.has_creator_profile:
                return Response(
                    {'error': 'Только исполнители могут создавать чаты для заказов'},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Если мы дошли до этой строки, значит все проверки пройдены успешно
            # Не нужно возвращать здесь ошибку - продолжаем выполнение метода
            
        # Проверяем, существует ли уже чат для этого заказа
        existing_chat = Chat.objects.filter(order=order).first()
        if existing_chat:
            # Если чат уже существует, возвращаем его
            serializer = ChatDetailSerializer(existing_chat, context={'request': request})
            return Response(serializer.data)
        
        # Проверяем роль пользователя - только креатор может создать чат
        if user == order.client:
            return Response(
                {'error': 'Чат может быть начат только исполнителем. Пожалуйста, дождитесь отклика на ваш заказ.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Определяем, кто клиент, а кто исполнитель
        client = order.client
        
        # Для публичных заказов target_creator может быть None
        # Тогда используем текущего пользователя как креатора
        if order.target_creator is None:
            creator = user  # Текущий пользователь становится креатором для публичного заказа
        else:
            creator = order.target_creator
            
        try:
            # Создаем новый чат
            new_chat = Chat.objects.create(
                order=order,
                client=client,
                creator=creator
            )
        except Exception as e:
            # Если возникла ошибка при создании чата
            return Response(
                {'error': f'Ошибка при создании чата: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Добавляем системное сообщение о том, что креатор откликнулся на заказ
        from chats.models import Message
        Message.objects.create(
            chat=new_chat,
            content='Исполнитель откликнулся на заказ и начал чат.',
            is_system_message=True
        )
        
        # Используем ChatDetailSerializer для возврата детальной информации
        serializer = ChatDetailSerializer(new_chat, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с сообщениями чатов.
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Возвращает сообщения чатов, в которых пользователь является участником.
        """
        user = self.request.user
        return Message.objects.filter(
            Q(chat__client=user) | Q(chat__creator=user)
        ).select_related('sender', 'chat').order_by('created_at')
    
    def get_permissions(self):
        """
        Возвращает соответствующие права доступа в зависимости от действия.
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsMessageSender()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def chat_messages(self, request):
        """
        Возвращает сообщения для конкретного чата.
        """
        chat_id = request.query_params.get('chat_id')
        if not chat_id:
            return Response(
                {'error': 'Не указан параметр chat_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        chat = Chat.objects.filter(id=chat_id).filter(
            Q(client=user) | Q(creator=user)
        ).first()
        
        if not chat:
            return Response(
                {'error': 'Чат не найден или у вас нет доступа'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Получаем сообщения
        messages = Message.objects.filter(chat=chat).order_by('created_at')
        
        # Помечаем сообщения как прочитанные
        if user == chat.client:
            messages.filter(sender=chat.creator, is_read=False).update(is_read=True)
        elif user == chat.creator:
            messages.filter(sender=chat.client, is_read=False).update(is_read=True)
        
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """
        Создает сообщение и проверяет права доступа.
        """
        chat = serializer.validated_data['chat']
        user = self.request.user
        
        # Проверяем, является ли пользователь участником чата
        if user != chat.client and user != chat.creator:
            raise serializers.ValidationError("Вы не являетесь участником этого чата")
        
        # Запрещаем создание системных сообщений
        if serializer.validated_data.get('is_system_message', False):
            raise serializers.ValidationError("Нельзя создавать системные сообщения вручную")
        
        # Создаем сообщение
        serializer.save(sender=user)
        
        # Обновляем дату последнего обновления чата
        chat.updated_at = timezone.now()
        chat.save(update_fields=['updated_at'])