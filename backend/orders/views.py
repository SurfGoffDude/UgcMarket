"""
Представления для приложения orders.

Содержит представления для работы с заказами и связанными с ними объектами.
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F, Q
from django.utils import timezone

# Импортируем модели Chat и Message для создания чата при отклике
from chats.models import Chat, Message

from .models import (
    Category, Tag, Order, OrderAttachment, 
    OrderResponse, Delivery, Review
)
from .serializers import (
    CategorySerializer, TagSerializer,
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer,
    OrderAttachmentSerializer, OrderResponseSerializer,
    DeliverySerializer, ReviewSerializer, CustomOrderCreateSerializer
)
from .permissions import (
    IsClientOrReadOnly, IsOrderClient, IsOrderCreator,
    IsOrderParticipant, IsReviewAuthor
)
from .filters import OrderFilter

# Получаем модель пользователя динамически, чтобы не допустить циклических импортов
from django.contrib.auth import get_user_model
User = get_user_model()

import logging
logger = logging.getLogger(__name__)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Представление для просмотра категорий.
    
    Позволяет получить список категорий и детали конкретной категории.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Представление для просмотра тегов.
    
    Позволяет получить список тегов и детали конкретного тега.
    По умолчанию возвращает только теги с типом 'creator'.
    """
    # Сохраняем базовый queryset для регистрации в роутере
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_fields = ['type', 'category']
    
    def get_queryset(self):
        """
        Возвращает только теги с типом 'creator' или фильтрует по типу, если он указан в запросе.
        """
        # Начинаем с базового queryset
        queryset = super().get_queryset()
        
        # Проверяем, указан ли тип в запросе
        tag_type = self.request.query_params.get('type')
        
        # Если тип не указан, возвращаем только теги с типом 'creator'
        if not tag_type:
            queryset = queryset.filter(type='creator')
        else:
            # Если тип указан, фильтруем по нему
            queryset = queryset.filter(type=tag_type)
            
        return queryset


class OrderViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с заказами.
    
    Поддерживает создание, просмотр, обновление и удаление заказов.
    Поддерживает создание заказа на основе услуги с возможностью внесения правок.
    """

    queryset = Order.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsClientOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OrderFilter
    search_fields = ['title', 'description', 'category__name', 'tags__name']
    ordering_fields = ['created_at', 'deadline', 'budget']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Фильтрует заказы в зависимости от запрашиваемого действия и прав пользователя.
        """
        queryset = super().get_queryset()
        
        # Фильтр по статусу опубликованный для неавторизованных пользователей
        if not self.request.user.is_authenticated:
            return queryset.filter(status='published', is_private=False)
        
        # Для конкретных действий
        if self.action == 'my_orders':
            # Возвращаем только заказы текущего пользователя-клиента
            return queryset.filter(client=self.request.user)
        
        if self.action == 'my_created_orders':
            # Возвращаем только заказы, где пользователь является исполнителем
            return queryset.filter(target_creator=self.request.user)
        
        # Для списка показываем только доступные заказы
        if self.action == 'list':
            user = self.request.user
            
            # Для стаффа показываем все заказы
            if user.is_staff:
                return queryset
                
            # Для обычных пользователей показываем публичные и их заказы
            return queryset.filter(
                Q(is_private=False) | 
                Q(client=user) | 
                Q(is_private=True, target_creator=user)
            )
        
        # Для детального просмотра проверка прав осуществляется в retrieve
        return queryset
    
    def get_serializer_class(self):
        """
        Возвращает соответствующий сериализатор в зависимости от действия.
        """
        if self.action in ['list', 'my_orders', 'my_created_orders']:
            return OrderListSerializer
        elif self.action == 'create':
            return OrderCreateSerializer
        return OrderDetailSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """
        Переопределяем метод для увеличения счетчика просмотров и проверки прав доступа к приватному заказу.
        """
        # Получаем объект заказа
        order = self.get_object()
        
        # Проверяем права на просмотр приватного заказа
        user = request.user
        if not order.can_be_viewed_by(user):
            return Response(
                {'error': 'У вас нет прав на просмотр этого заказа'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Увеличиваем счетчик просмотров, если пользователь не является клиентом или исполнителем
        if user.is_authenticated and user != order.client and user != order.target_creator:
            Order.objects.filter(id=order.id).update(views_count=F('views_count') + 1)
        
        # Возвращаем ответ с деталями заказа
        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """
        Переопределяем метод для установки статуса заказа.
        """
        # Если заказ создается на основе услуги, то устанавливаем статус "в работе"
        if 'service' in serializer.validated_data and serializer.validated_data['service']:
            # Услуга указана, исполнитель известен, сразу ставим статус "в работе"
            service = serializer.validated_data['service']
            serializer.save(status='in_progress', target_creator=service.creator_profile.user)
        else:
            # Обычный заказ, устанавливаем статус "опубликован"
            serializer.save(status='published')
    
    @action(detail=False, methods=['get'], url_path='my-orders')
    def my_orders(self, request):
        """
        Возвращает список заказов текущего пользователя в роли клиента.
        Доступно по URL: /api/orders/my-orders/
        """
        queryset = Order.objects.filter(client=request.user)
        
        # Применяем фильтрацию
        queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(queryset)
        serializer = OrderListSerializer(page, many=True, context={'request': request})
        return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_created_orders(self, request):
        """
        Возвращает список заказов текущего пользователя в роли исполнителя.
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['post'], url_path='custom')
    def create_custom(self, request):
        """
        Создает произвольный заказ с указанными полями.
        
        В отличие от обычного создания заказа, этот метод использует CustomOrderCreateSerializer
        для создания заказа со свободными полями, включая платформу.
        """
        try:
            serializer = CustomOrderCreateSerializer(
                data=request.data,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            instance = serializer.save()
            return Response(
                OrderDetailSerializer(instance, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrderClient])
    def select_creator(self, request, pk=None):
        """
        Выбирает креатора для заказа и меняет его статус на "в работе".
        """
        order = self.get_object()
        creator_id = request.data.get('creator_id')
        response_id = request.data.get('response_id')
        
        if not creator_id:
            return Response(
                {'error': 'Не указан ID креатора'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Проверяем отклик, если указан
            if response_id:
                response = OrderResponse.objects.get(id=response_id, order=order)
                if response.target_creator.id != int(creator_id):
                    return Response(
                        {'error': 'ID креатора не соответствует ID креатора в отклике'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Принимаем отклик
                response.status = 'accepted'
                response.save()
            
            # Обновляем заказ
            creator = User.objects.get(id=creator_id)
            
            # Логирование перед установкой значений
            logger.info(f"ОТЛАДКА: перед обновлением заказа {order.id}: creator_id={creator_id}, creator={creator}, order.target_creator={getattr(order, 'target_creator', None)}")
            
            order.creator = creator
            order.target_creator = creator
            order.status = 'in_progress'
            
            # Логирование перед сохранением
            logger.info(f"ОТЛАДКА: перед сохранением заказа {order.id}: order.creator={order.creator}, order.target_creator={order.target_creator}")
            
            try:
                # Сохраняем заказ и перехватываем возможные исключения
                # Используем прямой SQL запрос для гарантированного обновления
                from django.db import connection
                with connection.cursor() as cursor:
                    # Обновляем значения напрямую в БД
                    cursor.execute(
                        "UPDATE orders_order SET creator_id = %s, target_creator_id = %s, status = %s WHERE id = %s",
                        [creator.id, creator.id, 'in_progress', order.id]
                    )
                    # Убеждаемся, что обновлено ровно одну запись
                    rows_updated = cursor.rowcount
                    logger.info(f"ОТЛАДКА: Обновлено записей: {rows_updated}, заказ {order.id}, креатор: {creator.id}")
                
                # После прямого SQL запроса обновляем объект в памяти
                order.creator = creator
                order.target_creator = creator
                order.status = 'in_progress'
                
                logger.info(f"ОТЛАДКА: заказ {order.id} успешно обновлен в БД напрямую")
            except Exception as e:
                # Логируем ошибку, если она возникла при сохранении
                logger.error(f"КРИТИЧЕСКАЯ ОШИБКА при сохранении заказа {order.id}: {str(e)}")
                return Response(
                    {'error': f'Ошибка при сохранении заказа: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Проверяем, что target_creator был действительно установлен после сохранения
            order.refresh_from_db()  # Перезагружаем объект из БД
            logger.info(f"ОТЛАДКА: после сохранения заказа {order.id}: order.creator_id={order.creator_id}, order.target_creator_id={order.target_creator_id}, target_creator установлен: {order.target_creator_id is not None}")
            
            # Отклоняем остальные отклики
            OrderResponse.objects.filter(order=order).exclude(id=response_id).update(status='rejected')
  
            
            # Если чат только что создан или произошло изменение статуса, добавляем системное сообщение
            try:
                template = SystemMessageTemplate.objects.get(
                    event_type=SystemMessageTemplate.EVENT_ORDER_CREATOR_ASSIGNED,
                    is_active=True
                )
                message_text = template.template.format(
                    order_title=order.title,
                    client_name=order.client.username,
                    creator_name=creator.username
                )
            except (SystemMessageTemplate.DoesNotExist, KeyError):
                # Используем стандартное сообщение
                message_text = f"Креатор {creator.username} назначен исполнителем заказа '{order.title}'."                

            
            return Response(
                {'message': 'Исполнитель выбран, заказ перешел в статус "В работе"'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrderCreator])
    def submit_for_review(self, request, pk=None):
        """
        Отправляет заказ на проверку клиенту.
        """
        order = self.get_object()
        
        if order.status != 'in_progress':
            return Response(
                {'error': 'Заказ должен быть в статусе "В работе"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, что есть хотя бы одна финальная сдача
        if not order.deliveries.filter(is_final=True).exists():
            return Response(
                {'error': 'Необходимо добавить финальную сдачу работы'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Меняем статус заказа
        order.status = 'on_review'
        order.save()
        
        
        return Response(
            {'message': 'Заказ отправлен на проверку клиенту'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrderClient])
    def complete_order(self, request, pk=None):
        """
        Завершает заказ (принимает работу).
        
        Клиент может завершить заказ из статуса "На проверке" или "В работе"
        """
        order = self.get_object()
        
        if order.status not in ['on_review', 'in_progress']:
            return Response(
                {'error': 'Заказ должен быть в статусе "На проверке" или "В работе"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Меняем статус заказа
        order.status = 'completed'
        order.save()
        
        # Увеличиваем счетчик выполненных заказов у креатора
        
        if order.target_creator and hasattr(order.target_creator, 'creator_profile'):
            creator_profile = order.target_creator.creator_profile
            creator_profile.completed_orders = F('completed_orders') + 1
            creator_profile.save(update_fields=['completed_orders'])
        
        return Response(
            {'message': 'Заказ успешно завершен'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def start_order(self, request, pk=None):
        """
        Креатор может начать работу над заказом, изменяя его статус с "опубликованный" на "в процессе".
        
        Доступно только для креаторов, которые могут откликнуться на заказ.
        """
        order = self.get_object()
        user = request.user
        
        # Проверяем, что заказ в нужном статусе
        if order.status != 'published':
            return Response(
                {'error': 'Заказ должен быть в статусе "Опубликован"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, что пользователь может откликнуться на заказ
        if not order.can_respond(user):
            return Response(
                {'error': 'У вас нет прав для начала работы над этим заказом'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Меняем статус заказа и назначаем креатора
        order.status = 'in_progress'
        order.target_creator = user
        order.save()
        
        # Создаем чат между клиентом и креатором, если его еще нет
        try:
            logger.info(f"Attempting to create chat for order {order.id} between client {order.client.id} and creator {user.id}")
            chat, created = Chat.objects.get_or_create(
                client=order.client,
                creator=user,
                order=order
            )
            logger.info(f"Chat creation result: chat_id={chat.id}, created={created}")
            
            # Если был создан новый чат, добавляем первое системное сообщение
            if created:
                message = Message.objects.create(
                    chat=chat,
                    content=f'Креатор {user.username} принял заказ "{order.title}" в работу.',
                    is_system_message=True
                )
                logger.info(f"System message created with id={message.id}")
            else:
                logger.info(f"Chat already exists with id={chat.id}")
        except Exception as e:
            logger.error(f"Error creating chat: {str(e)}")
            # Не вызываем исключение, чтобы процесс отклика на заказ всё равно завершился успешно
        
        # Добавляем системное сообщение
        try:
            template = SystemMessageTemplate.objects.get(
                event_type=SystemMessageTemplate.EVENT_ORDER_STATUS_CHANGE,
                is_active=True
            )
            message_text = template.template.format(
                order_title=order.title,
                old_status=dict(Order.STATUS_CHOICES).get('published', 'Опубликован'),
                new_status=dict(Order.STATUS_CHOICES).get('in_progress', 'В работе')
            )
        except (SystemMessageTemplate.DoesNotExist, KeyError):
            # Используем стандартное сообщение
            message_text = f"Статус заказа '{order.title}' изменён с 'Опубликован' на 'В работе'. Креатор {user.username} приступил к работе."

        
        return Response(
            {'message': 'Вы начали работу над заказом'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrderClient])
    def cancel_order(self, request, pk=None):
        """
        Отменяет заказ.
        """
        order = self.get_object()
        
        if order.status in ['completed', 'canceled']:
            return Response(
                {'error': 'Нельзя отменить завершенный или уже отмененный заказ'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Меняем статус заказа
        order.status = 'canceled'
        order.save()
        
        return Response(
            {'message': 'Заказ отменен'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrderClient], url_path='client-change-status')
    def client_change_status(self, request, pk=None):
        """
        Изменяет статус заказа клиентом.
        
        Доступные действия для клиента:
        - cancel: отменить заказ (из любого статуса кроме completed/canceled)
        - complete: принять работу (из статуса on_review)
        - request_revision: вернуть на доработку (из статуса on_review)
        
        Параметры:
        - action (str): действие (cancel, complete, request_revision)
        - comment (str, optional): комментарий к изменению статуса
        """
        logger.info(f"client_change_status вызван для заказа {pk} пользователем {request.user.id if request.user.is_authenticated else 'анонимный'}")
        logger.info(f"Данные запроса: {request.data}")
        
        try:
            order = self.get_object()
            logger.info(f"Заказ найден: ID={order.id}, статус={order.status}, клиент={order.client.id if order.client else 'None'}")
        except Exception as e:
            logger.error(f"Ошибка при получении заказа {pk}: {str(e)}")
            return Response(
                {'error': f'Заказ не найден: {str(e)}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        action = request.data.get('action')
        comment = request.data.get('comment', '')
        
        logger.info(f"Действие: {action}, комментарий: {comment}")
        
        if not action:
            logger.warning("Параметр action не предоставлен")
            return Response(
                {'error': 'Параметр action обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Определяем доступные действия для клиента в зависимости от статуса заказа
        logger.info(f"Проверяем доступные действия для статуса {order.status}")
        allowed_actions = {
            'draft': ['cancel'],
            'published': ['cancel', 'complete'],  # Клиент может принять опубликованный заказ
            'awaiting_response': ['cancel'],
            'in_progress': ['cancel', 'complete'],  # Клиент может принять работу в процессе
            'on_review': ['cancel', 'complete', 'request_revision'],
            'completed': [],  # Финальный статус
            'canceled': []  # Финальный статус
        }
        
        current_status = order.status
        if action not in allowed_actions.get(current_status, []):
            return Response(
                {
                    'error': f'Действие "{action}" недоступно для заказа в статусе "{current_status}"',
                    'allowed_actions': allowed_actions.get(current_status, [])
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Выполняем действие
        try:
            if action == 'cancel':
                if not order.change_status('canceled'):
                    return Response(
                        {'error': 'Не удалось отменить заказ'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                message = 'Заказ отменен'
                system_message = f"Заказ отменен клиентом"
                
            elif action == 'complete':
                if not order.change_status('completed'):
                    return Response(
                        {'error': 'Не удалось завершить заказ'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                message = 'Заказ завершен'
                system_message = f"Заказ принят клиентом"
                
            elif action == 'request_revision':
                if not order.change_status('in_progress'):
                    return Response(
                        {'error': 'Не удалось вернуть заказ на доработку'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                message = 'Заказ возвращен на доработку'
                system_message = f"Заказ возвращен на доработку клиентом"
            
            # Сохраняем изменения
            order.save()
            
            # Добавляем комментарий к системному сообщению, если он есть
            if comment:
                system_message += f". Комментарий: {comment}"
            
            # Отправляем системное сообщение в чат, если он существует
            try:
                chat = Chat.objects.get(order=order)
                Message.objects.create(
                    chat=chat,
                    content=system_message,
                    is_system_message=True
                )
            except Chat.DoesNotExist:
                # Чат может не существовать для некоторых заказов
                pass
            
            return Response(
                {
                    'message': message,
                    'new_status': order.status,
                    'comment': comment
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Ошибка при изменении статуса заказа {order.id}: {str(e)}")
            return Response(
                {'error': 'Произошла ошибка при изменении статуса заказа'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OrderAttachmentViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с приложенными файлами заказа.
    """
    queryset = OrderAttachment.objects.all()
    serializer_class = OrderAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrderParticipant]
    
    def get_queryset(self):
        """
        Фильтрует вложения по заказу, если указан параметр order_id.
        """
        queryset = super().get_queryset()
        order_id = self.request.query_params.get('order_id')
        
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Устанавливает текущего пользователя как загрузившего вложение.
        """
        serializer.save(uploaded_by=self.request.user)


class OrderResponseViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с откликами на заказы.
    """
    queryset = OrderResponse.objects.all()
    serializer_class = OrderResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Фильтрует отклики по заказу и/или креатору.
        """
        queryset = super().get_queryset()
        order_id = self.request.query_params.get('order_id')
        
        # Если пользователь не является суперпользователем,
        # показываем только его отклики или отклики на его заказы
        if not self.request.user.is_superuser:
            queryset = queryset.filter(
                models.Q(target_creator=self.request.user) | 
                models.Q(order__client=self.request.user)
            )
        
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Устанавливает текущего пользователя как создателя отклика и создает чат между клиентом и креатором.
        Использует бизнес-логику модели Order для проверки возможности отклика и изменения статуса.
        
        Особенности работы с чатом:
        - Если чат между клиентом и креатором не существует, он будет создан.
        - Если чат уже существует, но связан с другим заказом, создается связь с новым заказом.
        """
        # Получаем заказ
        order_id = serializer.validated_data.get('order').id
        order = Order.objects.get(id=order_id)
        user = self.request.user
        
        # Проверяем, может ли пользователь откликнуться на заказ
        if not order.can_respond(user):
            raise serializers.ValidationError('Вы не можете откликнуться на этот заказ')
        
        # Проверяем, существует ли уже отклик от этого пользователя на этот заказ
        if OrderResponse.objects.filter(order_id=order_id, target_creator=user).exists():
            raise serializers.ValidationError('Вы уже откликнулись на этот заказ')
        
        # Сохраняем отклик
        response = serializer.save(target_creator=user, status='pending')
        
        # Получаем связанный заказ и клиента
        client = order.client
        creator = user
        
        # Проверяем, существует ли уже чат между клиентом и креатором
        try:
            # Ищем чат с этой парой клиент-креатор
            chat = Chat.objects.get(client=client, creator=creator)
            
            # Если чат найден, но не связан с текущим заказом, добавляем связь с заказом
            if chat.order != order:
                # Создаем системное сообщение о новом заказе
                Message.objects.create(
                    chat=chat,
                    content=f'Креатор {creator.username} откликнулся на заказ "{order.title}".',
                    is_system_message=True
                )
        except Chat.DoesNotExist:
            # Если чата не существует, создаем новый
            chat = Chat.objects.create(
                client=client,
                creator=creator,
                order=order,
                is_active=True
            )
            
            # Создаем приветственное системное сообщение
            Message.objects.create(
                chat=chat,
                content=f'Создан чат между клиентом {client.username} и креатором {creator.username} по заказу "{order.title}".',
                is_system_message=True
            )
        
        # Если это первый отклик на заказ и заказ в статусе 'published', меняем статус
        if order.responses.count() == 1 and order.status == 'published':
            order.change_status('awaiting_response')
            order.save()
        
        # Для приватных заказов, автоматически назначаем креатора и меняем статус заказа
        if order.is_private and order.target_creator == creator and not order.creator:
            # Устанавливаем креатора и меняем статус заказа на 'in_progress'
            order.target_creator = creator
            order.change_status('in_progress')
            order.save()
            
            # Отправляем сообщение о назначении креатора
            message_text = f"Креатор {creator.username} назначен исполнителем заказа '{order.title}'."
            
            # Добавляем системное сообщение в чат
            Message.objects.create(
                chat=chat,
                content=message_text,
                is_system_message=True
            )


    @action(detail=False, methods=['get'], url_path='creator-client-orders')
    def creator_client_orders(self, request):
        """
        Возвращает все заказы между клиентом и креатором со статусами 'in_progress', 'on_review' или 'completed'.
        
        Для фильтрации требуются параметры client и target_creator.
        Если параметр client пустой, то возвращаются все заказы для указанного креатора.
        
        Примеры запросов:
        /api/orders/order-responses/creator-client-orders/?client=1&target_creator=2  - заказы между конкретным клиентом и креатором
        /api/orders/order-responses/creator-client-orders/?client=&target_creator=2   - все заказы для креатора с ID=2
        """
        client_id = request.query_params.get('client')
        target_creator_id = request.query_params.get('target_creator')
        
        if not target_creator_id:
            return Response(
                {'error': 'Необходимо указать параметр target_creator'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Базовый фильтр - все заказы для указанного креатора
        filters = {
            'target_creator_id': target_creator_id,
            'status__in': ['in_progress', 'on_review', 'completed']
        }
        
        # Если указан клиент, добавляем фильтрацию по клиенту
        if client_id and client_id.strip():
            filters['client_id'] = client_id
        
        # Получаем заказы согласно фильтрам
        queryset = Order.objects.filter(**filters).distinct()
        
        serializer = OrderListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class DeliveryViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с результатами работы.
    """
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [permissions.IsAuthenticated, IsOrderParticipant]
    
    def get_queryset(self):
        """
        Фильтрует результаты работы по заказу.
        """
        queryset = super().get_queryset()
        order_id = self.request.query_params.get('order_id')
        
        # Если пользователь не является суперпользователем,
        # показываем только его результаты или результаты его заказов
        if not self.request.user.is_superuser:
            queryset = queryset.filter(
                models.Q(target_creator=self.request.user) | 
                models.Q(order__client=self.request.user)
            )
        
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Устанавливает текущего пользователя как создателя результата работы.
        """
        order_id = serializer.validated_data.get('order').id
        order = Order.objects.get(id=order_id)
        
        # Проверяем, что текущий пользователь является исполнителем заказа
        if order.target_creator != self.request.user:
            raise serializers.ValidationError('Только исполнитель может добавлять результаты работы')
        
        # Проверяем, что заказ в статусе "в работе" или "на проверке"
        if order.status not in ['in_progress', 'on_review']:
            raise serializers.ValidationError('Добавлять результаты можно только для заказов в статусе "В работе" или "На проверке"')
        
        serializer.save(target_creator=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrderClient])
    def approve(self, request, pk=None):
        """
        Одобряет результат работы.
        """
        delivery = self.get_object()
        
        # Проверяем, что текущий пользователь является клиентом заказа
        if request.user != delivery.order.client:
            return Response(
                {'error': 'Только клиент может одобрить результат работы'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        delivery.client_approved = True
        delivery.save()
        
        return Response(
            {'message': 'Результат работы одобрен'},
            status=status.HTTP_200_OK
        )


class ReviewViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с отзывами.
    """
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsReviewAuthor]
    
    def get_queryset(self):
        """
        Фильтрует отзывы по заказу и/или автору.
        """
        queryset = super().get_queryset()
        order_id = self.request.query_params.get('order_id')
        creator_id = self.request.query_params.get('creator_id')
        
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        if creator_id:
            queryset = queryset.filter(recipient_id=creator_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Устанавливает текущего пользователя как автора отзыва.
        """
        order_id = serializer.validated_data.get('order').id
        order = Order.objects.get(id=order_id)
        
        # Проверяем, что текущий пользователь является клиентом заказа
        if order.client != self.request.user:
            raise serializers.ValidationError('Только клиент может оставить отзыв')
        
        # Проверяем, что заказ в статусе "выполнен"
        if order.status != 'completed':
            raise serializers.ValidationError('Отзыв можно оставить только для завершенного заказа')
        
        # Проверяем, что у заказа есть исполнитель
        if not order.target_creator:
            raise serializers.ValidationError('У заказа должен быть исполнитель')
        
        # Проверяем, что отзыв для этого заказа еще не оставлен
        if Review.objects.filter(order=order, author=self.request.user).exists():
            raise serializers.ValidationError('Вы уже оставили отзыв для этого заказа')
        
        serializer.save(
            author=self.request.user,
            recipient=order.target_creator
        )