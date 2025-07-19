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
    
    def list(self, request, *args, **kwargs):
        """
        Переопределяем метод list для возврата данных в формате, ожидаемом фронтендом.
        
        Фронтенд ожидает поле chat_participants, содержащее список участников чата в формате:
        {
            id: number,
            username: string,
            avatar?: string | null,
            role: 'creator' | 'client',
            chat_id: string // формат: "{id_креатора}-{id_клиента}"
        }
        """
        user = request.user
        queryset = self.filter_queryset(self.get_queryset())
        
        # Преобразуем чаты в формат участников, ожидаемый фронтендом
        chat_participants = []
        
        for chat in queryset:
            # Определяем другого участника чата (не текущего пользователя)
            other_participant = None
            role = None
            
            if user == chat.client:
                other_participant = chat.creator
                role = 'creator'
            else:
                other_participant = chat.client
                role = 'client'
            
            # Формируем ID чата в формате "{id_креатора}-{id_клиента}"
            chat_id = f"{chat.creator.id}-{chat.client.id}"
            
            # Получаем URL аватара, если он есть
            avatar_url = None
            if hasattr(other_participant, 'avatar') and other_participant.avatar:
                try:
                    avatar_url = other_participant.avatar.url
                except ValueError:
                    # Если возникла ошибка, значит у аватара нет файла
                    avatar_url = None
                    
            # Добавляем участника в список
            chat_participants.append({
                'id': other_participant.id,
                'username': other_participant.username,
                'avatar': avatar_url,
                'role': role,
                'chat_id': chat_id
            })
        
        # Возвращаем chat_participants на верхнем уровне ответа
        return Response({
            'count': len(chat_participants),
            'next': None,
            'previous': None,
            'chat_participants': chat_participants
        })
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='client-orders')
    def client_orders(self, request):
        """
        Возвращает заказы клиента в чатах с информацией о доступных действиях.
        
        Этот эндпоинт предназначен для отображения заказов в левой панели чата
        с кнопками управления статусом для клиента.
        """
        user = request.user
        
        # Получаем чаты, где пользователь является клиентом и есть заказ
        chats = Chat.objects.filter(
            client=user,
            order__isnull=False
        ).select_related('order', 'creator').prefetch_related('order__target_creator')
        
        orders_data = []
        for chat in chats:
            order = chat.order
            
            # Определяем доступные действия для клиента в зависимости от статуса заказа
            allowed_actions = {
            'draft': ['cancel'],
            'published': ['cancel', 'complete'],
            'awaiting_response': ['cancel'],
            'in_progress': ['cancel', 'complete'],
            'on_review': ['cancel', 'complete', 'request_revision'],
            'completed': [],  # Финальный статус
            'canceled': []  # Финальный статус
            }
            
            # Получаем статус заказа на русском языке
            status_labels = {
                'draft': 'Черновик',
                'published': 'Опубликован',
                'awaiting_response': 'Ожидает отклика',
                'in_progress': 'В работе',
                'on_review': 'На проверке',
                'completed': 'Завершен',
                'canceled': 'Отменен'
            }
            
            # Получаем названия действий на русском языке
            action_labels = {
                'cancel': 'Отменить',
                'complete': 'Принять работу',
                'request_revision': 'Вернуть на доработку'
            }
            
            order_data = {
                'id': order.id,
                'title': order.title,
                'status': order.status,
                'status_label': status_labels.get(order.status, order.status),
                'budget': order.budget,
                'deadline': order.deadline,
                'creator': {
                'id': chat.creator.id,
                'username': chat.creator.username,
                'avatar': chat.creator.avatar.url if chat.creator.avatar and hasattr(chat.creator.avatar, 'url') else None
                } if chat.creator else None,
                'target_creator': {
                'id': order.target_creator.id,
                'username': order.target_creator.username,
                'avatar': order.target_creator.avatar.url if order.target_creator.avatar and hasattr(order.target_creator.avatar, 'url') else None
                } if order.target_creator else None,
                'chat_id': chat.id,
                'allowed_actions': allowed_actions.get(order.status, []),
                'action_labels': {action: action_labels.get(action, action) for action in allowed_actions.get(order.status, [])},
                'created_at': order.created_at,
                'updated_at': order.updated_at
            }
            
            orders_data.append(order_data)
        
        # Сортируем заказы по дате обновления (новые сверху)
        orders_data.sort(key=lambda x: x['updated_at'], reverse=True)
        
        return Response({
            'orders': orders_data,
            'count': len(orders_data)
        })
    
    def get_permissions(self):
        """
        Устанавливает разрешения в зависимости от действия.
        """
        if self.action in ['retrieve', 'update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsClientOrCreator()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'], url_path='(?P<chat_id>[^/.]+)')
    def get_by_chat_id(self, request, chat_id=None):
        """
        Получает чат по составному идентификатору (creator_id-client_id).
        """
        try:
            # Парсим идентификаторы пользователей
            creator_id, client_id = chat_id.split('-')
            creator_id = int(creator_id)
            client_id = int(client_id)
            
            # Получаем чат по креатору и клиенту
            chat = Chat.objects.get(creator_id=creator_id, client_id=client_id)
            serializer = self.get_serializer(chat)
            return Response(serializer.data)
        except (ValueError, Chat.DoesNotExist):
            return Response({"detail": "Чат не найден."}, status=status.HTTP_404_NOT_FOUND)
    
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
    Представление для получения и отправки сообщений в чат по ID участников.
    
    URL формат: /api/chats/<creator_id>-<client_id>/messages/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, participant_ids):
        """
        Получение списка сообщений для чата по ID участников.
        
        Args:
            request: Объект запроса.
            participant_ids: Строка вида "creator_id-client_id".
        
        Returns:
            Response: Ответ со списком сообщений или ошибкой.
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
                return Response(
                    {'error': 'Чат не найден'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Получаем сообщения по чату в порядке от старых к новым
            messages = chat.messages.all().order_by('created_at')
            
            # Сериализуем сообщения
            serializer = MessageSerializer(messages, many=True, context={'request': request})
            
            # Возвращаем список сообщений
            return Response({'results': serializer.data}, status=status.HTTP_200_OK)
            
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