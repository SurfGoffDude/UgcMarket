"""
Представления для приложения orders.

Содержит представления для работы с заказами и связанными с ними объектами.
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from django.utils import timezone

from .models import (
    Category, Tag, Order, OrderAttachment, 
    OrderResponse, Delivery, Review
)
from .serializers import (
    CategorySerializer, TagSerializer,
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer,
    OrderAttachmentSerializer, OrderResponseSerializer,
    DeliverySerializer, ReviewSerializer
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
            return queryset.filter(creator=self.request.user)
        
        # Для списка скрываем приватные заказы, кроме случаев, когда пользователь 
        # является клиентом или исполнителем заказа
        if self.action == 'list':
            return queryset.filter(
                status='published',
                is_private=False
            ) | queryset.filter(
                client=self.request.user
            ) | queryset.filter(
                creator=self.request.user
            )
        
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
        Переопределяем метод для увеличения счетчика просмотров.
        """
        instance = self.get_object()
        
        # Увеличиваем счетчик просмотров только если пользователь не является клиентом
        if request.user != instance.client:
            instance.views_count = F('views_count') + 1
            instance.save(update_fields=['views_count'])
            instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """
        Переопределяем метод для установки статуса заказа.
        """
        # Устанавливаем статус заказа "опубликован"
        serializer.save(status='published')
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """
        Возвращает список заказов текущего пользователя в роли клиента.
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
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
                if response.creator.id != int(creator_id):
                    return Response(
                        {'error': 'ID креатора не соответствует ID креатора в отклике'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Принимаем отклик
                response.status = 'accepted'
                response.save()
            
            # Обновляем заказ
            order.creator_id = creator_id
            order.status = 'in_progress'
            order.save()
            
            # Отклоняем остальные отклики
            OrderResponse.objects.filter(order=order).exclude(id=response_id).update(status='rejected')
            
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
        """
        order = self.get_object()
        
        if order.status != 'on_review':
            return Response(
                {'error': 'Заказ должен быть в статусе "На проверке"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Меняем статус заказа
        order.status = 'completed'
        order.save()
        
        # Увеличиваем счетчик выполненных заказов у креатора
        if order.creator and hasattr(order.creator, 'creator_profile'):
            creator_profile = order.creator.creator_profile
            creator_profile.completed_orders = F('completed_orders') + 1
            creator_profile.save(update_fields=['completed_orders'])
        
        return Response(
            {'message': 'Заказ успешно завершен'},
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
                models.Q(creator=self.request.user) | 
                models.Q(order__client=self.request.user)
            )
        
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Устанавливает текущего пользователя как создателя отклика.
        """
        # Проверяем, существует ли уже отклик от этого пользователя на этот заказ
        order_id = serializer.validated_data.get('order').id
        if OrderResponse.objects.filter(order_id=order_id, creator=self.request.user).exists():
            raise serializers.ValidationError('Вы уже откликнулись на этот заказ')
        
        # Проверяем, что заказ в статусе "опубликован"
        order = Order.objects.get(id=order_id)
        if order.status != 'published':
            raise serializers.ValidationError('Можно откликаться только на опубликованные заказы')
        
        serializer.save(creator=self.request.user, status='pending')


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
                models.Q(creator=self.request.user) | 
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
        if order.creator != self.request.user:
            raise serializers.ValidationError('Только исполнитель может добавлять результаты работы')
        
        # Проверяем, что заказ в статусе "в работе" или "на проверке"
        if order.status not in ['in_progress', 'on_review']:
            raise serializers.ValidationError('Добавлять результаты можно только для заказов в статусе "В работе" или "На проверке"')
        
        serializer.save(creator=self.request.user)
    
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
        if not order.creator:
            raise serializers.ValidationError('У заказа должен быть исполнитель')
        
        # Проверяем, что отзыв для этого заказа еще не оставлен
        if Review.objects.filter(order=order, author=self.request.user).exists():
            raise serializers.ValidationError('Вы уже оставили отзыв для этого заказа')
        
        serializer.save(
            author=self.request.user,
            recipient=order.creator
        )