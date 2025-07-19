"""
Модели для приложения orders.

В данном модуле описаны модели для работы с заказами, 
категориями, тегами и взаимодействием между заказами и пользователями.
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.validators import MinValueValidator
from users.models import Service
from core.models import Tag  # Импортируем единую модель Tag

import logging
logger = logging.getLogger(__name__)


class Category(models.Model):
    """
    Модель категории заказов.
    
    Используется для классификации заказов по типу контента или услуги.
    
    Attributes:
        name (CharField): Название категории.
        slug (SlugField): Уникальный слаг для URL.
        description (TextField): Описание категории.
        image (ImageField): Иконка или изображение категории.
        parent (ForeignKey): Родительская категория (для иерархической структуры).
    """
    name = models.CharField(_('название'), max_length=100)
    slug = models.SlugField(_('слаг'), max_length=100, unique=True)
    description = models.TextField(_('описание'), blank=True, null=True)
    image = models.ImageField(_('изображение'), upload_to='categories/', blank=True, null=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        related_name='children',
        null=True,
        blank=True,
        verbose_name=_('родительская категория')
    )
    
    class Meta:
        verbose_name = _('категория')
        verbose_name_plural = _('категории')
        ordering = ['name']
    
    def __str__(self):
        """Возвращает строковое представление категории."""
        return self.name
    
    @property
    def has_children(self):
        """Проверяет наличие дочерних категорий."""
        return self.children.exists()


# Модель Tag теперь находится в core.models.Tag


class Order(models.Model):
    """
    Модель заказа на контент.
    
    Основная модель для хранения заказов на контент от клиентов.
    
    Attributes:
        title (CharField): Заголовок заказа.
        description (TextField): Подробное описание заказа.
        client (ForeignKey): Клиент, создавший заказ.
        category (ForeignKey): Категория заказа.
        tags (ManyToManyField): Теги заказа.
        budget (DecimalField): Бюджет заказа.
        deadline (DateField): Срок выполнения заказа.
        creator (ForeignKey): Исполнитель заказа (опционально).
        status (CharField): Статус заказа.
        is_private (BooleanField): Флаг приватности заказа.
        target_creator (ForeignKey): Целевой креатор для приватного заказа.
        views_count (PositiveIntegerField): Счетчик просмотров заказа.
        created_at (DateTimeField): Дата создания заказа.
        updated_at (DateTimeField): Дата обновления заказа.
    """
    STATUS_CHOICES = [
        ('draft', _('Черновик')),
        ('published', _('Опубликован')),
        ('awaiting_response', _('Ожидает отклика')),
        ('in_progress', _('В работе')),
        ('on_review', _('На проверке')),
        ('completed', _('Выполнен')),
        ('canceled', _('Отменен')),
    ]
    
    title = models.CharField(_('заголовок'), max_length=255)
    description = models.TextField(_('описание'))
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_orders',
        verbose_name=_('клиент')
    )
    tags = models.ManyToManyField(
        'core.Tag',  # Ссылаемся на модель Tag из приложения core
        related_name='orders',
        blank=True,
        verbose_name=_('теги')
    )
    budget = models.DecimalField(
        _('бюджет'), 
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    deadline = models.DateField(_('срок выполнения'))
    status = models.CharField(
        _('статус'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    # Исполнитель заказа (назначается после выбора креатора)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='assigned_orders',
        null=True,
        blank=True,
        verbose_name=_('исполнитель')
    )
    is_private = models.BooleanField(_('приватный'), default=False)
    target_creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='targeted_orders',
        null=True,
        blank=True,
        verbose_name=_('целевой креатор')
    )
    views_count = models.PositiveIntegerField(_('количество просмотров'), default=0)
    created_at = models.DateTimeField(_('дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('дата обновления'), auto_now=True)
    
    # Ссылки на примеры работ и референсы
    references = models.JSONField(
        _('ссылки на примеры'),
        default=list,
        blank=True,
        null=True,
        help_text=_('Ссылки на примеры работ, которые нравятся клиенту')
    )
    
    class Meta:
        verbose_name = _('заказ')
        verbose_name_plural = _('заказы')
        ordering = ['-created_at']
    
    def __str__(self):
        """Возвращает строковое представление заказа."""
        return self.title
    
    @property
    def is_overdue(self):
        """Проверяет, просрочен ли заказ."""
        return self.deadline < timezone.now().date() and self.status not in ['completed', 'canceled']

    @property
    def days_left(self):
        """Возвращает количество дней до дедлайна."""
        if self.deadline:
            delta = self.deadline - timezone.now().date()
            return delta.days
        return None
        
    def can_be_viewed_by(self, user):
        """Проверяет, может ли пользователь просматривать заказ.
        
        Если заказ приватный, только клиент, целевой креатор и администраторы могут его видеть.
        """
        if not self.is_private:
            return True
            
        if not user or not user.is_authenticated:
            return False
            
        # Клиент заказа всегда может видеть свой заказ
        if self.client_id == user.id:
            return True
            
        # Целевой креатор может видеть предназначенный для него заказ
        if self.target_creator_id and self.target_creator_id == user.id:
            return True
            
        # Администраторы могут видеть все заказы
        return user.is_staff
        
    def can_respond(self, user):
        """Проверяет, может ли пользователь откликнуться на заказ."""
        if not user or not user.is_authenticated:
            return False
            
        # Клиент не может откликаться на свой же заказ
        if self.client_id == user.id:
            return False
            
        # Нельзя откликаться на заказы в статусах, где это не имеет смысла
        if self.status not in ['published', 'awaiting_response']:
            return False
            
        # Если заказ приватный, только целевой креатор может откликнуться
        if self.is_private:
            return self.target_creator_id == user.id
            
        return True
        
    def change_status(self, new_status):
        """Изменяет статус заказа с выполнением необходимых проверок.
        
        Returns:
            bool: True если статус был успешно изменен, False в противном случае.
        """
        valid_transitions = {
        'draft': ['published', 'canceled'],
        'published': ['awaiting_response', 'in_progress', 'completed', 'canceled'],  # Клиент может завершить опубликованный заказ
        'awaiting_response': ['in_progress', 'canceled'],
        'in_progress': ['on_review', 'completed', 'canceled'],  # Клиент может завершить заказ в процессе
        'on_review': ['in_progress', 'completed', 'canceled'],
        'completed': [],  # Финальный статус
        'canceled': ['draft']  # Можно восстановить только в черновик
        }
        
        if new_status in valid_transitions.get(self.status, []):
            self.status = new_status
            return True
            
        return False


class OrderAttachment(models.Model):
    """
    Модель для приложенных файлов к заказу.
    
    Attributes:
        order (ForeignKey): Заказ, к которому прилагается файл.
        file (FileField): Прикрепленный файл.
        file_name (CharField): Оригинальное имя файла.
        file_type (CharField): Тип файла (MIME-тип).
        uploaded_by (ForeignKey): Пользователь, загрузивший файл.
        created_at (DateTimeField): Дата загрузки файла.
        description (TextField): Описание файла.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_('заказ')
    )
    file = models.FileField(_('файл'), upload_to='orders/attachments/')
    file_name = models.CharField(_('имя файла'), max_length=255)
    file_type = models.CharField(_('тип файла'), max_length=100)
    description = models.TextField(_('описание'), blank=True, null=True)
    size = models.PositiveIntegerField(_('размер файла в байтах'), default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_attachments',
        verbose_name=_('загружено')
    )
    created_at = models.DateTimeField(_('дата загрузки'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('приложение к заказу')
        verbose_name_plural = _('приложения к заказу')
        ordering = ['-created_at']
    
    def __str__(self):
        """Возвращает строковое представление приложения."""
        return f"{self.file_name} ({self.order.title})"
    
    def save(self, *args, **kwargs):
        """Рассчитываем размер файла при сохранении."""
        if self.file and not self.size and hasattr(self.file, 'size'):
            self.size = self.file.size
        super().save(*args, **kwargs)


class OrderResponse(models.Model):
    """
    Модель отклика креатора на заказ.
    
    Используется для хранения информации о предложениях креаторов
    по выполнению заказа.
    
    Attributes:
        order (ForeignKey): Заказ, на который откликается креатор.
        creator (ForeignKey): Креатор, предлагающий услуги.
        message (TextField): Сообщение-отклик креатора.
        price (DecimalField): Предлагаемая креатором цена.
        timeframe (PositiveIntegerField): Предлагаемый срок выполнения (в днях).
        status (CharField): Статус отклика.
        created_at (DateTimeField): Дата создания отклика.
        updated_at (DateTimeField): Дата обновления отклика.
    """
    STATUS_CHOICES = [
        ('pending', _('На рассмотрении')),
        ('accepted', _('Принят')),
        ('rejected', _('Отклонен')),
    ]
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='responses',
        verbose_name=_('заказ')
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='order_responses',
        verbose_name=_('креатор')
    )
    message = models.TextField(_('сообщение'))
    price = models.DecimalField(_('предложенная цена'), max_digits=10, decimal_places=2)
    timeframe = models.PositiveIntegerField(_('срок выполнения (дни)'))
    status = models.CharField(
        _('статус'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(_('дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('дата обновления'), auto_now=True)
    
    class Meta:
        verbose_name = _('отклик на заказ')
        verbose_name_plural = _('отклики на заказ')
        ordering = ['-created_at']
        unique_together = ['order', 'creator']
    
    def __str__(self):
        """Возвращает строковое представление отклика."""
        return f"Отклик {self.creator.username} на {self.order.title}"
        
    def accept_response(self):
        logger.info("[ACCEPT_RESPONSE] вызван для отклика %s (order %s)", self.id, self.order_id)
        """Принять отклик креатора и назначить его исполнителем заказа."""
        self.status = 'accepted'
        # Назначаем исполнителем
        self.order.creator = self.creator
        # ОБЯЗАТЕЛЬНО устанавливаем target_creator, чтобы заказ был связан с выбранным креатором
        self.order.target_creator = self.creator
    
    # Если заказ в статусе published/awaiting_response, переводим в in_progress
        if self.order.status in ['published', 'awaiting_response']:
            self.order.status = 'in_progress'
        
        self.order.save()
        self.save()
        
        # Отклоняем все остальные отклики
        OrderResponse.objects.filter(order=self.order).exclude(id=self.id).update(status='rejected')
        
        return True
        
    def reject_response(self):
        """Отклонить отклик креатора."""
        self.status = 'rejected'
        self.save()
        return True
        
    @property
    def is_pending(self):
        """Проверяет, находится ли отклик в ожидании решения."""
        return self.status == 'pending'
        
    @property
    def is_accepted(self):
        """Проверяет, принят ли отклик."""
        return self.status == 'accepted'
        
    @property
    def is_rejected(self):
        """Проверяет, отклонен ли отклик."""
        return self.status == 'rejected'
    
    
class Delivery(models.Model):
    """
    Модель для сдачи результатов работы по заказу.
    
    Attributes:
        order (ForeignKey): Заказ, к которому относится сдача.
        creator (ForeignKey): Креатор, сдающий работу.
        comment (TextField): Комментарий к сдаче.
        is_final (BooleanField): Является ли сдача финальной.
        client_approved (BooleanField): Одобрил ли клиент сдачу.
        created_at (DateTimeField): Дата создания сдачи.
        updated_at (DateTimeField): Дата обновления сдачи.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='deliveries',
        verbose_name=_('заказ')
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='deliveries',
        verbose_name=_('креатор')
    )
    comment = models.TextField(_('комментарий'), blank=True, null=True)
    is_final = models.BooleanField(_('финальная версия'), default=False)
    client_approved = models.BooleanField(_('одобрено клиентом'), default=False)
    created_at = models.DateTimeField(_('дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('дата обновления'), auto_now=True)
    
    class Meta:
        verbose_name = _('сдача работы')
        verbose_name_plural = _('сдачи работ')
        ordering = ['-created_at']
    
    def __str__(self):
        """Возвращает строковое представление сдачи."""
        return f"Сдача по заказу {self.order.title} от {self.creator.username}"
        
    def accept_delivery(self):
        """Принять сдачу работы и завершить заказ."""
        self.status = 'accepted'
        self.order.status = 'completed'
        self.order.save()
        self.save()
        return True
        
    def request_revision(self, comment=None):
        """Запросить доработку сдачи."""
        if comment:
            self.revision_comment = comment
        self.status = 'revision_requested'
        self.order.status = 'in_progress'
        self.order.save()
        self.save()
        return True
        
    def reject_delivery(self, comment=None):
        """Отклонить сдачу."""
        if comment:
            self.revision_comment = comment
        self.status = 'rejected'
        
        # Заказ возвращается в статус "in_progress"
        self.order.status = 'in_progress'
        self.order.save()
        self.save()
        return True
        
    def get_files_count(self):
        """Возвращает количество файлов в сдаче."""
        return self.files.count()
        
    @property
    def is_pending(self):
        """Проверяет, находится ли сдача в ожидании проверки."""
        return self.status == 'pending'
        
    @property
    def is_accepted(self):
        """Проверяет, принята ли сдача."""
        return self.status == 'accepted'
        
    @property
    def needs_revision(self):
        """Проверяет, требуется ли доработка."""
        return self.status == 'revision_requested'


class DeliveryFile(models.Model):
    """
    Модель для файлов, приложенных к сдаче работы.
    
    Attributes:
        delivery (ForeignKey): Связанная сдача работы.
        file (FileField): Приложенный файл.
        file_name (CharField): Оригинальное имя файла.
        file_type (CharField): MIME-тип файла.
        created_at (DateTimeField): Дата загрузки файла.
    """
    delivery = models.ForeignKey(
        Delivery,
        on_delete=models.CASCADE,
        related_name='files',
        verbose_name=_('сдача работы')
    )
    file = models.FileField(_('файл'), upload_to='orders/deliveries/')
    file_name = models.CharField(_('имя файла'), max_length=255)
    file_type = models.CharField(_('тип файла'), max_length=100)
    created_at = models.DateTimeField(_('дата загрузки'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('файл сдачи')
        verbose_name_plural = _('файлы сдачи')
    
    def __str__(self):
        """Возвращает строковое представление файла сдачи."""
        return self.file_name


class Review(models.Model):
    """
    Модель отзыва о выполненном заказе.
    
    Attributes:
        order (ForeignKey): Заказ, по которому оставлен отзыв.
        author (ForeignKey): Автор отзыва (клиент).
        recipient (ForeignKey): Получатель отзыва (креатор).
        rating (PositiveSmallIntegerField): Рейтинг от 1 до 5.
        comment (TextField): Текст отзыва.
        created_at (DateTimeField): Дата создания отзыва.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name=_('заказ')
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='authored_reviews',
        verbose_name=_('автор')
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_reviews',
        verbose_name=_('получатель')
    )
    rating = models.PositiveSmallIntegerField(
        _('рейтинг'),
        choices=[(i, str(i)) for i in range(1, 6)]
    )
    comment = models.TextField(_('комментарий'))
    created_at = models.DateTimeField(_('дата создания'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('отзыв')
        verbose_name_plural = _('отзывы')
        ordering = ['-created_at']
        unique_together = ['order', 'author']
    
    def __str__(self):
        """Возвращает строковое представление отзыва."""
        return f"Отзыв от {self.author.username} по заказу {self.order.title}"
    
    def save(self, *args, **kwargs):
        """
        Переопределяем метод save для обновления рейтинга креатора
        при добавлении отзыва.
        """
        # Проверяем, что заказ завершен перед созданием отзыва
        if not self.pk and self.order.status != 'completed':
            raise ValueError("Отзыв можно оставить только к завершенному заказу")
        
        super().save(*args, **kwargs)
        
        # Обновляем рейтинг креатора
        self.update_creator_rating()
    
    def update_creator_rating(self):
        """Обновляет рейтинг креатора на основании всех отзывов."""
        recipient = self.recipient
        if hasattr(recipient, 'creator_profile'):
            creator_profile = recipient.creator_profile
            reviews = Review.objects.filter(recipient=recipient)
            avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg'] or 0
            creator_profile.rating = avg_rating
            creator_profile.save(update_fields=['rating'])
            return avg_rating
        return None
    
    @property
    def is_positive(self):
        """Проверяет, является ли отзыв положительным (выше 3 звезд)."""
        return self.rating > 3
        
    @property
    def is_negative(self):
        """Проверяет, является ли отзыв отрицательным (ниже 3 звезд)."""
        return self.rating < 3
    
    @classmethod
    def get_average_rating_for_creator(cls, creator):
        """Возвращает средний рейтинг для креатора."""
        return cls.objects.filter(
            recipient=creator
        ).aggregate(models.Avg('rating'))['rating__avg'] or 0