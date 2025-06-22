"""
Сериализаторы для приложения orders.

Этот модуль содержит классы сериализаторов для преобразования данных заказов
между JSON и объектами Django.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.serializers import UserSerializer, ServiceSerializer
from .models import (
    Category, Tag, Order, OrderAttachment, 
    OrderResponse, Delivery, DeliveryFile, Review
)
from users.models import Service

User = get_user_model()


class TagSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Tag.
    """
    class Meta:
        model = Tag
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
    tags = TagSerializer(read_only=True, many=True)
    service = ServiceSerializer(read_only=True)
    service_name = serializers.SerializerMethodField(read_only=True)
    responses_count = serializers.SerializerMethodField()
    days_left = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'title', 'client', 'category', 'tags',
            'service', 'service_name', 'budget', 'deadline', 'status', 'days_left',
            'responses_count', 'views_count', 'created_at', 'with_modifications'
        ]
    
    def get_responses_count(self, obj):
        """Возвращает количество откликов на заказ."""
        return obj.responses.count()
    
    def get_service_name(self, obj):
        """Возвращает название услуги, если заказ основан на услуге."""
        if obj.service:
            return obj.service.title
        return None


class OrderDetailSerializer(serializers.ModelSerializer):
    """
    Сериализатор для детальной информации о заказе.
    """
    client = UserSerializer(read_only=True)
    creator = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    service = ServiceSerializer(read_only=True)
    attachments = OrderAttachmentSerializer(many=True, read_only=True)
    responses = serializers.SerializerMethodField()
    days_left = serializers.IntegerField(read_only=True)
    deliveries = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'title', 'description', 'client', 'creator',
            'category', 'tags', 'service', 'budget', 'deadline', 'status',
            'is_private', 'days_left', 'attachments', 'responses',
            'deliveries', 'reviews', 'views_count', 'created_at',
            'updated_at', 'with_modifications', 'modifications_description'
        ]
        read_only_fields = [
            'client', 'creator', 'days_left', 'views_count',
            'created_at', 'updated_at'
        ]
    
    def get_responses(self, obj):
        """Возвращает отклики на заказ."""
        # Проверка прав доступа: клиент заказа или исполнитель должны видеть отклики
        user = self.context['request'].user
        if user == obj.client or user == obj.creator:
            return OrderResponseSerializer(obj.responses.all(), many=True).data
        
        # Для других пользователей возвращаем только количество откликов
        return {'count': obj.responses.count()}
    
    def get_deliveries(self, obj):
        """Возвращает сдачи работы по заказу."""
        # Проверка прав доступа: клиент заказа или исполнитель должны видеть сдачи
        user = self.context['request'].user
        if user == obj.client or user == obj.creator:
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
        if user == obj.client or user == obj.creator:
            return ReviewSerializer(obj.reviews.all(), many=True).data
        
        return None


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания заказа.
    """
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category'
    )
    tags_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
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
    
    class Meta:
        model = Order
        fields = [
            'title', 'description', 'category_id', 'tags_ids', 
            'budget', 'deadline', 'is_private', 'attachments',
            'service_id', 'with_modifications', 'modifications_description'
        ]
    
    def create(self, validated_data):
        """
        Создает заказ с приложенными файлами.
        """
        attachments = validated_data.pop('attachments', [])
        tags_data = validated_data.pop('tags', [])
        
        # Получаем текущего пользователя из контекста запроса
        client = self.context['request'].user
        
        # Если заказ основан на услуге, получаем информацию о креаторе и бюджете
        service = validated_data.get('service')
        if service:
            # Устанавливаем креатора заказа на основе услуги
            validated_data['creator'] = service.creator_profile.user
            
            # Если заказ с правками, используем цену с правками
            if validated_data.get('with_modifications') and service.modifications_price:
                validated_data['budget'] = service.modifications_price
            else:
                # Иначе используем стандартную цену
                validated_data['budget'] = service.price
                # Сбрасываем признак правок, если заказ без правок
                validated_data['with_modifications'] = False
                validated_data['modifications_description'] = None
            
            # Устанавливаем статус заказа как 'в работе'
            validated_data['status'] = 'in_progress'
        
        # Создаем заказ
        order = Order.objects.create(client=client, **validated_data)
        
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