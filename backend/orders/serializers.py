"""
Сериализаторы для приложения orders.

Этот модуль содержит классы сериализаторов для преобразования данных заказов
между JSON и объектами Django.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.serializers import UserSerializer, ServiceSerializer
from core import models as core_models  # Импортируем модели из приложения core
from .models import (
    Category, Order, OrderAttachment,  # Удален Tag, так как теперь он в core.models
    OrderResponse, Delivery, DeliveryFile, Review
)
from users.models import Service

User = get_user_model()


class TagSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели core.Tag.
    """
    class Meta:
        model = core_models.Tag  # Используем модель из приложения core
        fields = ['id', 'name', 'slug']


class CategorySerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Category.
    """
    parent_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'parent', 'parent_name', 'has_children']
    
    def get_parent_name(self, obj):
        """Возвращает название родительской категории."""
        if obj.parent:
            return obj.parent.name
        return None


class OrderAttachmentSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели OrderAttachment.
    """
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = OrderAttachment
        fields = [
            'id', 'file', 'file_name', 'file_type',
            'description', 'uploaded_by', 'created_at'
        ]
        read_only_fields = ['file_name', 'file_type', 'uploaded_by', 'created_at']


class OrderResponseSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели OrderResponse.
    """
    creator = UserSerializer(read_only=True)
    creator_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='creator',
        write_only=True
    )
    
    class Meta:
        model = OrderResponse
        fields = [
            'id', 'order', 'creator', 'creator_id', 'message',
            'price', 'timeframe', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']


class DeliveryFileSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели DeliveryFile.
    """
    class Meta:
        model = DeliveryFile
        fields = ['id', 'file', 'file_name', 'file_type', 'created_at']
        read_only_fields = ['file_name', 'file_type', 'created_at']


class DeliverySerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Delivery.
    """
    creator = UserSerializer(read_only=True)
    files = DeliveryFileSerializer(many=True, read_only=True)
    uploaded_files = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Delivery
        fields = [
            'id', 'order', 'creator', 'comment', 'is_final',
            'client_approved', 'files', 'uploaded_files',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['creator', 'client_approved', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """
        Создает новый объект доставки с прикрепленными файлами.
        """
        uploaded_files = validated_data.pop('uploaded_files', [])
        delivery = super().create(validated_data)
        
        # Обрабатываем загруженные файлы
        for uploaded_file in uploaded_files:
            DeliveryFile.objects.create(
                delivery=delivery,
                file=uploaded_file,
                file_name=uploaded_file.name,
                file_type=uploaded_file.content_type
            )
        
        return delivery


class ReviewSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Review.
    """
    author = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'order', 'author', 'recipient',
            'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['author', 'recipient', 'created_at']
    
    def validate(self, data):
        """
        Проверяет, что отзыв создается для завершенного заказа.
        """
        order = data['order']
        if order.status != 'completed':
            raise serializers.ValidationError(
                "Отзыв можно оставить только для завершенного заказа"
            )
        return data


class OrderListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка заказов (с ограниченной информацией).
    """
    client = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    responses_count = serializers.SerializerMethodField()
    days_left = serializers.IntegerField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    target_creator = UserSerializer(read_only=True)
    creator = UserSerializer(read_only=True)
    can_view = serializers.SerializerMethodField()
    can_respond = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'title', 'description', 'client', 'category', 'tags',
            'budget', 'deadline', 'status', 'days_left', 'is_overdue',
            'responses_count', 'views_count', 'created_at', 'updated_at', 
            'is_private', 'target_creator', 'creator', 'references',
            'can_view', 'can_respond'
        ]
    
    def get_responses_count(self, obj):
        """Возвращает количество откликов на заказ."""
        return obj.responses.count()
    
    def get_can_view(self, obj):
        """Проверяет, может ли текущий пользователь просматривать заказ."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.can_be_viewed_by(request.user)
        return obj.is_private is False
    
    def get_can_respond(self, obj):
        """Проверяет, может ли текущий пользователь откликнуться на заказ."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.can_respond(request.user)
        return False


class OrderDetailSerializer(serializers.ModelSerializer):
    """
    Сериализатор для деталей заказа.
    """
    client = UserSerializer(read_only=True)
    target_creator = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    service = ServiceSerializer(read_only=True)
    attachments = serializers.SerializerMethodField()
    responses = serializers.SerializerMethodField()
    deliveries = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    days_left = serializers.IntegerField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    references = serializers.JSONField(read_only=True)
    can_view = serializers.SerializerMethodField()
    can_respond = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'title', 'description', 'client', 'target_creator', 'tags', 'service', 'budget', 'deadline', 
            'status', 'days_left', 'is_overdue', 'views_count', 'created_at', 'updated_at',
            'attachments', 'responses', 'deliveries', 'reviews', 'is_private', 'references', 'can_view', 'can_respond', 'chat'
        ]
        
    def get_can_view(self, obj):
        """Проверяет, может ли текущий пользователь просматривать заказ."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.can_be_viewed_by(request.user)
        return obj.is_private is False
        
    def get_can_respond(self, obj):
        """Проверяет, может ли текущий пользователь откликнуться на заказ."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.can_respond(request.user)
        return False
    
    def get_attachments(self, obj):
        """Возвращает вложения к заказу."""
        attachments = obj.attachments.all()
        return OrderAttachmentSerializer(attachments, many=True).data
    
    def get_responses(self, obj):
        """Возвращает отклики на заказ."""
        user = self.context['request'].user
        
        # Проверяем, может ли пользователь просматривать этот заказ
        if not obj.can_be_viewed_by(user):
            return []
        
        # Если пользователь является клиентом заказа - показываем все отклики
        if user == obj.client or user.is_staff:
            return OrderResponseSerializer(obj.responses.all(), many=True).data
        
        # Если приватный заказ и пользователь является целевым креатором
        if obj.is_private and obj.target_creator and obj.target_creator == user:
            # Показываем только отклики этого пользователя
            return OrderResponseSerializer(obj.responses.filter(creator=user), many=True).data
        
        # Если пользователь оставил отклик, показываем только его отклик
        user_response = obj.responses.filter(creator=user).first()
        if user_response:
            return OrderResponseSerializer([user_response], many=True).data
        
        return []
    
    def get_deliveries(self, obj):
        """Возвращает сдачи работы по заказу."""
        # Проверка прав доступа: клиент заказа или исполнитель должны видеть сдачи
        user = self.context['request'].user
        if user == obj.client or user == obj.target_creator:
            return DeliverySerializer(obj.deliveries.all(), many=True).data
        
        # Для других пользователей не показываем сдачи
        return None
    
    def get_reviews(self, obj):
        """Возвращает отзывы по заказу."""
        # Всем показываем отзывы для завершенных заказов
        if obj.status == 'completed':
            return ReviewSerializer(obj.reviews.all(), many=True).data
        
        # Для незавершенных заказов отзывы видны только клиенту и исполнителю
        user = self.context['request'].user
        if user == obj.client or user == obj.target_creator:
            return ReviewSerializer(obj.reviews.all(), many=True).data
        
        return None


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания заказа.
    """
    # Поле category_id удалено для соответствия новому дизайну без выбора категории
    tags_ids = serializers.PrimaryKeyRelatedField(
        queryset=core_models.Tag.objects.all(),
        source='tags',
        many=True,
        required=False
    )
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source='service',
        required=False,
        allow_null=True
    )
    attachments = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False),
        required=False
    )


class CustomOrderCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания произвольного заказа с обязательными полями.
    Отличается от OrderCreateSerializer тем, что требует заполнения всех полей,
    необходимых для создания заказа, а не использует данные из услуги.
    Поддерживает создание приватных заказов с целевым креатором.
    """
    # Поле category_id удалено для соответствия новому дизайну без выбора категории
    tags_ids = serializers.PrimaryKeyRelatedField(
        queryset=core_models.Tag.objects.all(),
        source='tags',
        many=True,
        required=False
    )
    target_creator_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='target_creator',
        required=False,
        allow_null=True,
        write_only=True
    )
    references = serializers.JSONField(required=False)
    attachments = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False),
        required=False
    )
    
    class Meta:
        model = Order
        fields = [
            'title', 'description', 'tags_ids', 
            'budget', 'deadline', 'is_private', 'attachments',
            'target_creator_id', 'references'
        ]

    
    def validate(self, data):
        """
        Проверяем, что для приватного заказа указан целевой креатор.
        """
        is_private = data.get('is_private', False)
        target_creator = data.get('target_creator', None)
        
        if is_private and not target_creator:
            raise serializers.ValidationError("Для приватного заказа необходимо указать целевого креатора")
        
        # Если указан целевой креатор, но заказ не приватный, устанавливаем флаг приватности
        if target_creator and not is_private:
            data['is_private'] = True
            
        return data
    
    def create(self, validated_data):
        """
        Создает произвольный заказ с прикрепленными файлами.
        """
        attachments = validated_data.pop('attachments', [])
        tags_data = validated_data.pop('tags', [])
        
        # Получаем текущего пользователя из контекста запроса
        client = self.context['request'].user
        
        # Определяем начальный статус заказа (приватные заказы начинаются в статусе 'awaiting_response')
        initial_status = 'awaiting_response' if validated_data.get('is_private', False) else 'published'
        
        # Создаем заказ
        order = Order.objects.create(client=client, status=initial_status, **validated_data)
        
        # Добавляем теги
        if tags_data:
            order.tags.set(tags_data)
        
        # Добавляем вложения
        for attachment in attachments:
            OrderAttachment.objects.create(
                order=order,
                file=attachment,
                file_name=attachment.name,
                file_type=attachment.content_type,
                uploaded_by=client
            )
        
        return order