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
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


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
            order.creator = creator
            order.status = 'in_progress'
            order.save()
            
            # Отклоняем остальные отклики
            OrderResponse.objects.filter(order=order).exclude(id=response_id).update(status='rejected')
            
            # Создаём чат между клиентом и креатором
            from chats.models import Chat, Message, SystemMessageTemplate
            
            # Проверяем, существует ли уже чат между клиентом и креатором для этого заказа
            chat, chat_created = Chat.objects.get_or_create(
                client=order.client,
                creator=creator,
                order=order
            )
            
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
                
            # Создаём системное сообщение
            Message.objects.create(
                chat=chat,
                content=message_text,
                is_system_message=True
            )
            
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
        
        # Отправляем системное сообщение в чат
        from chats.models import Chat, Message, SystemMessageTemplate
        
        # Получаем чат
        chats = Chat.objects.filter(order=order)
        
        if chats.exists():
            # Формируем сообщение об изменении статуса
            try:
                template = SystemMessageTemplate.objects.get(
                    event_type=SystemMessageTemplate.EVENT_ORDER_STATUS_CHANGE,
                    is_active=True
                )
                message_text = template.template.format(
                    order_title=order.title,
                    old_status=dict(Order.STATUS_CHOICES).get('in_progress', 'В работе'),
                    new_status=dict(Order.STATUS_CHOICES).get('on_review', 'На проверке')
                )
            except (SystemMessageTemplate.DoesNotExist, KeyError):
                # Используем стандартное сообщение
                message_text = f"Статус заказа '{order.title}' изменён с 'В работе' на 'На проверке'."
                
            # Отправляем сообщение во все чаты, связанные с заказом
            for chat in chats:
                Message.objects.create(
                    chat=chat,
                    content=message_text,
                    is_system_message=True
                )
                
            # Отправляем напоминание клиенту
            try:
                template = SystemMessageTemplate.objects.get(
                    event_type=SystemMessageTemplate.EVENT_ORDER_REMINDER,
                    is_active=True
                )
                reminder_text = template.template.format(
                    order_title=order.title,
                    action="проверить работу и подтвердить завершение заказа"
                )
            except (SystemMessageTemplate.DoesNotExist, KeyError):
                # Используем стандартное сообщение
                reminder_text = f"Напоминание: заказ '{order.title}' ожидает проверки. Пожалуйста, проверьте работу и подтвердите завершение заказа."
                
            # Отправляем напоминание во все чаты, связанные с заказом
            for chat in chats:
                Message.objects.create(
                    chat=chat,
                    content=reminder_text,
                    is_system_message=True
                )
        
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
        
        # Отправляем системное сообщение в чат
        from chats.models import Chat, Message, SystemMessageTemplate
        
        # Получаем чаты для этого заказа
        chats = Chat.objects.filter(order=order)
        
        if chats.exists():
            # Формируем сообщение об изменении статуса
            try:
                template = SystemMessageTemplate.objects.get(
                    event_type=SystemMessageTemplate.EVENT_ORDER_STATUS_CHANGE,
                    is_active=True
                )
                message_text = template.template.format(
                    order_title=order.title,
                    old_status=dict(Order.STATUS_CHOICES).get('on_review', 'На проверке'),
                    new_status=dict(Order.STATUS_CHOICES).get('completed', 'Завершён')
                )
            except (SystemMessageTemplate.DoesNotExist, KeyError):
                # Используем стандартное сообщение
                message_text = f"Статус заказа '{order.title}' изменён с 'На проверке' на 'Завершён'."
                
            # Отправляем сообщение во все чаты, связанные с заказом
            for chat in chats:
                Message.objects.create(
                    chat=chat,
                    content=message_text,
                    is_system_message=True
                )
                
            # Формируем завершающее сообщение
            try:
                template = SystemMessageTemplate.objects.get(
                    event_type=SystemMessageTemplate.EVENT_ORDER_COMPLETED,
                    is_active=True
                )
                completion_text = template.template.format(
                    order_title=order.title,
                    client_name=order.client.username,
                    creator_name=order.target_creator.username
                )
            except (SystemMessageTemplate.DoesNotExist, KeyError):
                # Используем стандартное сообщение
                completion_text = f"Заказ '{order.title}' успешно завершён! Клиент {order.client.username} подтвердил выполнение заказа. Приглашаем оставить отзыв о работе креатора {order.target_creator.username}."
                
            # Отправляем завершающее сообщение во все чаты
            for chat in chats:
                Message.objects.create(
                    chat=chat,
                    content=completion_text,
                    is_system_message=True
                )
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
        
        # Создаём чат между клиентом и креатором
        from chats.models import Chat, Message, SystemMessageTemplate
        
        # Проверяем, существует ли уже чат между клиентом и креатором для этого заказа
        chat, chat_created = Chat.objects.get_or_create(
            client=order.client,
            creator=user,
            order=order
        )
        
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
        
        # Создаём системное сообщение
        Message.objects.create(
            chat=chat,
            content=message_text,
            is_system_message=True
        )
        
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
        
        # Если это первый отклик на заказ и заказ в статусе 'published', меняем статус
        if order.responses.count() == 1 and order.status == 'published':
            order.change_status('awaiting_response')
            order.save()
        
        # Создаём чат между клиентом и креатором для обсуждения заказа
        from chats.models import Chat, Message, SystemMessageTemplate
        
        # Проверяем, существует ли уже чат между клиентом и креатором для этого заказа
        chat, chat_created = Chat.objects.get_or_create(
            client=client,
            creator=creator,
            order=order
        )
        
        # Если чат только что создан, добавляем системное сообщение об отклике
        if chat_created:
            # Пытаемся найти шаблон сообщения
            try:
                template = SystemMessageTemplate.objects.get(
                    event_type=SystemMessageTemplate.EVENT_ORDER_CREATOR_RESPONDED,
                    is_active=True
                )
                message_text = template.template.format(
                    order_title=order.title,
                    creator_name=creator.username,
                    message=response.message
                )
            except (SystemMessageTemplate.DoesNotExist, KeyError):
                # Используем стандартное сообщение
                message_text = f"Креатор {creator.username} откликнулся на заказ '{order.title}'."
                if response.message:
                    message_text += f"\n\nСообщение: {response.message}"
                    
            # Создаём системное сообщение
            Message.objects.create(
                chat=chat,
                content=message_text,
                is_system_message=True
            )
        
        # Для приватных заказов, автоматически назначаем креатора и меняем статус заказа
        if order.is_private and order.target_creator == creator and not order.creator:
            # Устанавливаем креатора и меняем статус заказа на 'in_progress'
            order.target_creator = creator
            order.change_status('in_progress')
            order.save()
            
            # Отправляем сообщение о назначении креатора
            try:
                template = SystemMessageTemplate.objects.get(
                    event_type=SystemMessageTemplate.EVENT_ORDER_CREATOR_ASSIGNED,
                    is_active=True
                )
                message_text = template.template.format(
                    order_title=order.title,
                    client_name=client.username,
                    creator_name=creator.username
                )
            except (SystemMessageTemplate.DoesNotExist, KeyError):
                # Используем стандартное сообщение
                message_text = f"Креатор {creator.username} назначен исполнителем заказа '{order.title}'."
            
            # Создаём ещё одно системное сообщение
            Message.objects.create(
                chat=chat,
                content=message_text,
                is_system_message=True
            )


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