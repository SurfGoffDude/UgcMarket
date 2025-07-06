"""
Модели для приложения users.

В данном модуле описаны модели пользователей системы и их профили.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator


class User(AbstractUser):
    """
    Кастомная модель пользователя.
    
    Расширяет стандартную модель Django User дополнительными полями.
    
    Attributes:
        email (EmailField): Email пользователя (уникальный).
        phone (CharField): Номер телефона пользователя.
        bio (TextField): Краткая биография или описание пользователя.
        avatar (ImageField): Аватар пользователя.
        is_verified (BooleanField): Флаг подтверждения email пользователя.
        gender (CharField): Пол пользователя (с выбором значка мальчик/девочка).
    """
    # Варианты пола для выбора
    GENDER_CHOICES = [
        ('male', _('Мужской')),
        ('female', _('Женский')),
        ('prefer_not_to_say', _('Не указывать')),
    ]
    
    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField(_('phone number'), max_length=20, blank=True, null=True)
    bio = models.TextField(_('biography'), blank=True, null=True)
    location = models.CharField(_('location'), max_length=255, blank=True, null=True)
    avatar = models.ImageField(_('avatar'), upload_to='avatars/', blank=True, null=True)
    is_verified = models.BooleanField(_('verified'), default=False)
    gender = models.CharField(
        _('gender'),
        max_length=20,
        choices=GENDER_CHOICES,
        blank=True,
        null=True,
        help_text=_('Пол пользователя для отображения соответствующего значка')
    )
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
    
    def __str__(self):
        """Возвращает строковое представление пользователя."""
        return self.username
    
    @property
    def full_name(self):
        """Возвращает полное имя пользователя."""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def has_creator_profile(self):
        """Проверяет, есть ли у пользователя профиль креатора."""
        return hasattr(self, 'creator_profile')

    @property
    def has_client_profile(self):
        """Проверяет, есть ли у пользователя профиль клиента."""
        return hasattr(self, 'client_profile')
    
    @property
    def user_type(self):
        """Возвращает тип пользователя (Клиент или Креатор)."""
        if hasattr(self, 'creator_profile'):
            return 'Креатор'
        return 'Клиент'
    
    @property
    def has_creator_profile(self):
        """Проверяет, имеет ли пользователь профиль креатора."""
        return hasattr(self, 'creator_profile')
    
    @property
    def has_client_profile(self):
        """Проверяет, имеет ли пользователь профиль клиента."""
        return hasattr(self, 'client_profile')


class ClientProfile(models.Model):
    """
    Профиль клиента.
    
    Содержит дополнительную информацию о пользователе-клиенте.
    
    Attributes:
        user (ForeignKey): Связь с моделью User.
        company_name (CharField): Название компании клиента.
        position (CharField): Должность клиента в компании.
        website (URLField): Веб-сайт клиента.
        about (TextField): Подробная информация о клиенте.
        notifications_enabled (BooleanField): Общий флаг включения уведомлений.
        email_notifications (BooleanField): Флаг включения email уведомлений.
        push_notifications (BooleanField): Флаг включения push уведомлений.
        created_at (DateTimeField): Дата создания профиля.
        updated_at (DateTimeField): Дата обновления профиля.
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='client_profile',
        verbose_name=_('user')
    )
    company_name = models.CharField(_('company name'), max_length=255, blank=True, null=True)
    position = models.CharField(_('position'), max_length=255, blank=True, null=True)
    website = models.URLField(_('website'), blank=True, null=True)
    about = models.TextField(_('about'), blank=True, null=True)
    notifications_enabled = models.BooleanField(_('notifications enabled'), default=True)
    email_notifications = models.BooleanField(_('email notifications'), default=True)
    push_notifications = models.BooleanField(_('push notifications'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('client profile')
        verbose_name_plural = _('client profiles')
    
    def __str__(self):
        """Возвращает строковое представление профиля клиента."""
        return f"{self.user.username} - Клиент"


class SocialLink(models.Model):
    """
    Модель для хранения ссылок на социальные сети.
    
    Используется в профиле креатора.
    
    Attributes:
        creator_profile (ForeignKey): Связь с CreatorProfile.
        name (CharField): Название социальной сети.
        url (URLField): Ссылка на профиль в социальной сети.
    """
    creator_profile = models.ForeignKey(
        'CreatorProfile', 
        on_delete=models.CASCADE, 
        related_name='social_links',
        verbose_name=_('creator profile')
    )
    name = models.CharField(_('name'), max_length=50)
    url = models.URLField(_('url'))
    
    class Meta:
        verbose_name = _('social link')
        verbose_name_plural = _('social links')
    
    def __str__(self):
        """Возвращает строковое представление социальной ссылки."""
        return f"{self.creator_profile.user.username} - {self.name}"


class CreatorProfile(models.Model):
    """
    Профиль креатора.
    
    Содержит дополнительную информацию о пользователе-креаторе.
    
    Attributes:
        user (ForeignKey): Связь с моделью User.
        nickname (CharField): Псевдоним креатора (опционально).
        specialization (CharField): Специализация креатора.
        experience (CharField): Опыт работы креатора.
        portfolio_link (URLField): Ссылка на портфолио креатора.
        cover_image (ImageField): Обложка профиля креатора.
        is_online (BooleanField): Статус онлайн/оффлайн креатора.
        available_for_hire (BooleanField): Доступность для новых заказов.
        rating (DecimalField): Рейтинг креатора.
        completed_orders (PositiveIntegerField): Количество завершенных заказов.
        average_response_time (DurationField): Среднее время ответа.
        average_work_time (CharField): Среднее время выполнения работы.
        created_at (DateTimeField): Дата создания профиля.
        updated_at (DateTimeField): Дата обновления профиля.
    """
    # Варианты среднего времени работы
    AVERAGE_WORK_TIME_CHOICES = [
        ('up_to_24_hours', _('До 24 часов')),
        ('up_to_3_days', _('До 3 дней')),
        ('up_to_10_days', _('До 10 дней')),
        ('up_to_14_days', _('До 14 дней')),
        ('up_to_30_days', _('До 30 дней')),
        ('up_to_60_days', _('До 60 дней')),
        ('more_than_60_days', _('Более 60 дней')),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='creator_profile',
        verbose_name=_('user')
    )
    nickname = models.CharField(_('nickname'), max_length=50, blank=True, null=True)
    specialization = models.CharField(_('specialization'), max_length=255)
    experience = models.CharField(_('experience'), max_length=255)
    portfolio_link = models.URLField(_('portfolio link'), blank=True, null=True)
    cover_image = models.ImageField(_('cover image'), upload_to='creator_covers/', blank=True, null=True)
    is_online = models.BooleanField(_('online status'), default=False)
    available_for_hire = models.BooleanField(_('available for hire'), default=True)
    rating = models.DecimalField(_('rating'), max_digits=3, decimal_places=2, default=0)
    completed_orders = models.PositiveIntegerField(_('completed orders'), default=0)
    average_response_time = models.DurationField(_('average response time'), null=True, blank=True)
    average_work_time = models.CharField(
        _('average work time'),
        max_length=30,
        choices=AVERAGE_WORK_TIME_CHOICES,
        default='up_to_3_days',
        blank=True,
        null=True,
        help_text=_('Среднее время выполнения работы креатором')
    )
    # Новое поле тегов, заменяющее навыки
    tags = models.ManyToManyField(
        'core.Tag',  # Ссылаемся на модель Tag из приложения core
        related_name='creators',
        verbose_name=_('Tags'),
        blank=True
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('creator profile')
        verbose_name_plural = _('creator profiles')
    
    def __str__(self):
        """Возвращает строковое представление профиля креатора."""
        return f"{self.user.username} - Креатор"
    
    @property
    def social_links_dict(self):
        """Возвращает словарь с социальными ссылками."""
        return {link.name.lower(): link.url for link in self.social_links.all()}


# Класс Tag перемещен в core.models.
# Теперь все ссылки на Tag должны использовать 'core.Tag'


class Skill(models.Model):
    """
    Модель для навыка.
    
    Представляет собой навык, который может быть добавлен к профилю креатора.
    """
    name = models.CharField(
        verbose_name=_('Название'),
        max_length=100,
        unique=True
    )
    slug = models.SlugField(
        verbose_name=_('Slug'),
        max_length=100,
        unique=True
    )
    description = models.TextField(
        verbose_name=_('Описание'),
        blank=True
    )
    
    class Meta:
        verbose_name = _('Навык')
        verbose_name_plural = _('Навыки')
        ordering = ['name']
    
    def __str__(self):
        """Строковое представление объекта."""
        return self.name


class CreatorSkill(models.Model):
    """
    Модель для связи креатора с навыком.
    
    Включает уровень владения навыком (1-5).
    """
    creator_profile = models.ForeignKey(
        CreatorProfile,
        on_delete=models.CASCADE,
        related_name='creator_skills',
        verbose_name=_('Профиль креатора')
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name='creator_skills',
        verbose_name=_('Навык')
    )
    level = models.PositiveSmallIntegerField(
        verbose_name=_('Уровень'),
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ],
        default=1,
        help_text=_('Уровень владения навыком от 1 до 5')
    )
    
    class Meta:
        verbose_name = _('Навык креатора')
        verbose_name_plural = _('Навыки креатора')
        unique_together = ['creator_profile', 'skill']
    
    def __str__(self):
        """Строковое представление объекта."""
        return f"{self.creator_profile.user.username} - {self.skill.name} ({self.level})"


class PortfolioItem(models.Model):
    """
    Модель элемента портфолио креатора.
    
    Представляет собой пример работы креатора с изображениями и описанием.
    """
    creator_profile = models.ForeignKey(
        CreatorProfile,
        on_delete=models.CASCADE,
        related_name='portfolio_items',
        verbose_name=_('Профиль креатора')
    )
    title = models.CharField(
        verbose_name=_('Заголовок'),
        max_length=255
    )
    description = models.TextField(
        verbose_name=_('Описание')
    )
    cover_image = models.ImageField(
        verbose_name=_('Обложка'),
        upload_to='portfolio/covers/'
    )
    external_url = models.URLField(
        verbose_name=_('Внешняя ссылка'),
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(
        verbose_name=_('Создано'),
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        verbose_name=_('Обновлено'),
        auto_now=True
    )
    
    class Meta:
        verbose_name = _('Элемент портфолио')
        verbose_name_plural = _('Элементы портфолио')
        ordering = ['-created_at']
    
    def __str__(self):
        """Строковое представление объекта."""
        return f"{self.creator_profile.user.username} - {self.title}"


class PortfolioImage(models.Model):
    """
    Модель изображения в портфолио.
    
    Представляет собой дополнительное изображение для элемента портфолио.
    """
    portfolio_item = models.ForeignKey(
        PortfolioItem,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('Элемент портфолио')
    )
    image = models.ImageField(
        verbose_name=_('Изображение'),
        upload_to='portfolio/images/'
    )
    caption = models.CharField(
        verbose_name=_('Подпись'),
        max_length=255,
        blank=True
    )
    order = models.PositiveSmallIntegerField(
        verbose_name=_('Порядок'),
        default=0
    )
    
    class Meta:
        verbose_name = _('Изображение портфолио')
        verbose_name_plural = _('Изображения портфолио')
        ordering = ['order']
    
    def __str__(self):
        """Строковое представление объекта."""
        return f"{self.portfolio_item.title} - Изображение {self.order}"


class Service(models.Model):
    """
    Модель услуги, предоставляемой креатором.
    
    Хранит информацию об услугах, которые предлагает креатор: название, описание, стоимость и т.д.
    
    Attributes:
        creator_profile (ForeignKey): Связь с CreatorProfile.
        title (CharField): Название услуги.
        description (TextField): Описание услуги.
        price (DecimalField): Стоимость услуги.
        estimated_time (CharField): Примерное время выполнения услуги.
        allows_modifications (BooleanField): Допустимы ли правки к услуге.
        modifications_price (DecimalField): Стоимость версии с правками (если разрешены).
        is_active (BooleanField): Доступность услуги для заказа.
        created_at (DateTimeField): Дата создания.
        updated_at (DateTimeField): Дата обновления.
    """
    creator_profile = models.ForeignKey(
        CreatorProfile,
        on_delete=models.CASCADE,
        related_name='services',
        verbose_name=_('Профиль креатора')
    )
    title = models.CharField(
        max_length=200, 
        verbose_name=_('Название услуги')
    )
    description = models.TextField(
        verbose_name=_('Описание услуги')
    )
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name=_('Цена')
    )
    TIME_UNIT_CHOICES = [
        ('hour', _('час')),
        ('day', _('день')),
        ('week', _('неделя')),
        ('month', _('месяц')),
        ('year', _('год'))
    ]
    
    estimated_time_value = models.PositiveIntegerField(
        verbose_name=_('Количество единиц времени'),
        help_text=_('Количество единиц времени для выполнения услуги'),
        default=1
    )
    estimated_time_unit = models.CharField(
        max_length=10,
        choices=TIME_UNIT_CHOICES,
        default='day',
        verbose_name=_('Единица измерения времени')
    )
    estimated_time = models.CharField(
        max_length=100,
        verbose_name=_('Примерное время выполнения (устаревшее)'),
        help_text=_('Устаревшее поле, оставлено для совместимости'),
        blank=True,
        null=True
    )
    allows_modifications = models.BooleanField(
        default=True,
        verbose_name=_('Разрешены правки')
    )
    modifications_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_('Цена с правками'),
        help_text=_('Стоимость заказа с возможностью внесения правок'),
        null=True,
        blank=True
    )
    is_active = models.BooleanField(
        default=True, 
        verbose_name=_('Активна')
    )
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name=_('Дата создания')
    )
    updated_at = models.DateTimeField(
        auto_now=True, 
        verbose_name=_('Дата обновления')
    )
    
    class Meta:
        verbose_name = _('Услуга')
        verbose_name_plural = _('Услуги')
        ordering = ['-created_at']
    
    def __str__(self):
        """Строковое представление объекта."""
        return f"{self.title} ({self.creator_profile.user.username})"
    
    def get_formatted_time(self):
        """Возвращает отформатированное время выполнения услуги.
        
        Returns:
            str: Время выполнения в формате '3 дня'.
        """
        time_units = {
            'hour': ['час', 'часа', 'часов'],
            'day': ['день', 'дня', 'дней'],
            'week': ['неделя', 'недели', 'недель'],
            'month': ['месяц', 'месяца', 'месяцев'],
            'year': ['год', 'года', 'лет']
        }
        
        # Функция для выбора правильной формы существительного
        def choose_plural_form(number, forms):
            if number % 10 == 1 and number % 100 != 11:
                return forms[0]
            elif 2 <= number % 10 <= 4 and (number % 100 < 10 or number % 100 >= 20):
                return forms[1]
            else:
                return forms[2]
        
        unit_forms = time_units.get(self.estimated_time_unit, ['', '', ''])
        unit_form = choose_plural_form(self.estimated_time_value, unit_forms)
        
        return f"{self.estimated_time_value} {unit_form}"


class ServiceImage(models.Model):
    """
    Модель для хранения изображений, связанных с услугой.
    """
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('Услуга'), blank=True, null=True
    )
    image = models.ImageField(
        upload_to='services/',
        verbose_name=_('Изображение')
    )
    caption = models.CharField(
        max_length=255,
        blank=True,
        verbose_name=_('Подпись')
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Порядок')
    )

    class Meta:
        verbose_name = _('Изображение услуги')
        verbose_name_plural = _('Изображения услуг')
        ordering = ['order']

    def __str__(self):
        return f"Изображение для {self.service.title}"