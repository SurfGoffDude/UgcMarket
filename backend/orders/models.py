"""
Модели для приложения orders.

В данном модуле описаны модели для работы с заказами, 
категориями, тегами и взаимодействием между заказами и пользователями.
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from users.models import Service


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


class Tag(models.Model):
    """
    Модель тега заказа.
    
    Используется для гибкой маркировки заказов по различным параметрам.
    
    Attributes:
        name (CharField): Название тега.
        slug (SlugField): Уникальный слаг для URL.
    """
    name = models.CharField(_('название'), max_length=50)
    slug = models.SlugField(_('слаг'), max_length=50, unique=True)
    
    class Meta:
        verbose_name = _('тег')
        verbose_name_plural = _('теги')
        ordering = ['name']
    
    def __str__(self):
        """Возвращает строковое представление тега."""
        return self.name


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
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='orders',
        verbose_name=_('категория')
    )
    tags = models.ManyToManyField(
        Tag,
        related_name='orders',
        blank=True,
        verbose_name=_('теги')
    )
    budget = models.DecimalField(_('бюджет'), max_digits=10, decimal_places=2)
    deadline = models.DateField(_('срок выполнения'))
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='creator_orders',
        null=True,
        blank=True,
        verbose_name=_('исполнитель')
    )
    status = models.CharField(
        _('статус'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    is_private = models.BooleanField(_('приватный'), default=False)
    views_count = models.PositiveIntegerField(_('количество просмотров'), default=0)
    created_at = models.DateTimeField(_('дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('дата обновления'), auto_now=True)
    
    # Связь с услугой
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        related_name='orders',
        null=True,
        blank=True,
        verbose_name=_('услуга')
    )
    
    # Поля для заказа с правками
    with_modifications = models.BooleanField(
        default=False,
        verbose_name=_('с правками')
    )
    modifications_description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('описание правок')
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


class OrderAttachment(models.Model):
    """
    Модель для приложенных файлов к заказу.
    
    Используется для хранения референсов, примеров, документации и других файлов,
    связанных с заказом.
    
    Attributes:
        order (ForeignKey): Связанный заказ.
        file (FileField): Приложенный файл.
        file_name (CharField): Оригинальное имя файла.
        file_type (CharField): MIME-тип файла.
        description (TextField): Описание файла.
        uploaded_by (ForeignKey): Пользователь, загрузивший файл.
        created_at (DateTimeField): Дата загрузки файла.
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
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='uploaded_attachments',
        null=True,
        verbose_name=_('загружено')
    )
    created_at = models.DateTimeField(_('дата загрузки'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('приложение к заказу')
        verbose_name_plural = _('приложения к заказу')
    
    def __str__(self):
        """Возвращает строковое представление приложения."""
        return f"{self.file_name} ({self.order.title})"


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
        super().save(*args, **kwargs)
        
        # Обновляем рейтинг креатора
        recipient = self.recipient
        if hasattr(recipient, 'creator_profile'):
            creator_profile = recipient.creator_profile
            reviews = Review.objects.filter(recipient=recipient)
            avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg'] or 0
            creator_profile.rating = avg_rating
            creator_profile.save(update_fields=['rating'])