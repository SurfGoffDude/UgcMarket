"""
Модели для приложения chats.

В данном модуле описаны модели для системы чатов между клиентами и креаторами,
а также для автоматических системных уведомлений об изменении статуса заказов.
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.db.models import Q
from orders.models import Order


class Chat(models.Model):
    """
    Модель чата между клиентом и креатором.
    
    Представляет собой чат, связанный с определенным заказом или общий чат
    между клиентом и креатором.
    
    Attributes:
        client (ForeignKey): Клиент, участвующий в чате.
        creator (ForeignKey): Креатор, участвующий в чате.
        order (ForeignKey): Заказ, с которым связан чат (может быть None для общих чатов).
        created_at (DateTimeField): Дата создания чата.
        updated_at (DateTimeField): Дата последнего обновления чата.
        is_active (BooleanField): Признак активности чата.
    """
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_chats',
        verbose_name=_('клиент')
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='creator_chats',
        verbose_name=_('креатор')
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='chats',
        null=True,
        blank=True,
        verbose_name=_('заказ')
    )
    created_at = models.DateTimeField(_('дата создания'), auto_now_add=True)
    updated_at = models.DateTimeField(_('дата обновления'), auto_now=True)
    is_active = models.BooleanField(_('активен'), default=True)
    
    class Meta:
        verbose_name = _('чат')
        verbose_name_plural = _('чаты')
        ordering = ['-updated_at']
        # Гарантируем уникальность чата между клиентом и креатором для конкретного заказа
        # или общего чата между ними (когда order=None)
        constraints = [
            models.UniqueConstraint(
                fields=['client', 'creator', 'order'],
                name='unique_chat_constraint'
            )
        ]
    
    def __str__(self):
        """Возвращает строковое представление чата."""
        if self.order:
            return f"Чат по заказу {self.order.title} между {self.client.username} и {self.creator.username}"
        return f"Общий чат между {self.client.username} и {self.creator.username}"
    
    def clean(self):
        """
        Проверяет, что один из участников является клиентом, а второй - креатором.
        
        Raises:
            ValidationError: Если условие не выполнено.
        """
        # Проверка что клиент и креатор действительно имеют соответствующие профили
        if not hasattr(self.client, 'client_profile'):
            raise ValidationError({'client': _('Пользователь должен иметь профиль клиента')})
        if not hasattr(self.creator, 'creator_profile'):
            raise ValidationError({'creator': _('Пользователь должен иметь профиль креатора')})
        
        # Проверка связи с заказом
        if self.order and self.order.client != self.client:
            raise ValidationError({'client': _('Клиент чата должен быть заказчиком')})
        
        # Если заказ связан с конкретным креатором, проверяем, что это наш креатор
        if self.order and self.order.creator and self.order.creator != self.creator:
            raise ValidationError({'creator': _('Креатор чата должен быть исполнителем заказа')})
    
    def save(self, *args, **kwargs):
        """
        Переопределяем save для выполнения clean() перед сохранением.
        """
        self.clean()
        super().save(*args, **kwargs)


class Message(models.Model):
    """
    Модель сообщения в чате.
    
    Представляет сообщение от одного из участников чата или системное уведомление.
    
    Attributes:
        chat (ForeignKey): Чат, к которому относится сообщение.
        sender (ForeignKey): Отправитель сообщения (None для системных сообщений).
        content (TextField): Содержание сообщения.
        is_system_message (BooleanField): Признак системного сообщения.
        created_at (DateTimeField): Дата и время отправки сообщения.
        is_read (BooleanField): Признак прочтения сообщения получателем.
    """
    chat = models.ForeignKey(
        Chat,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name=_('чат')
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='sent_messages',
        null=True,
        blank=True,
        verbose_name=_('отправитель')
    )
    content = models.TextField(_('содержание'))
    is_system_message = models.BooleanField(_('системное сообщение'), default=False)
    created_at = models.DateTimeField(_('дата отправки'), auto_now_add=True)
    is_read = models.BooleanField(_('прочитано'), default=False)
    
    class Meta:
        verbose_name = _('сообщение')
        verbose_name_plural = _('сообщения')
        ordering = ['created_at']
    
    def __str__(self):
        """Возвращает строковое представление сообщения."""
        if self.is_system_message:
            return f"Системное сообщение в {self.chat} ({self.created_at})"
        return f"Сообщение от {self.sender.username} в {self.chat} ({self.created_at})"
    
    def clean(self):
        """
        Проверяет правильность данных сообщения.
        
        Raises:
            ValidationError: Если условие не выполнено.
        """
        # Для системных сообщений sender должен быть NULL
        if self.is_system_message and self.sender:
            raise ValidationError({'sender': _('Системное сообщение не должно иметь отправителя')})
        
        # Для обычных сообщений sender должен быть задан
        if not self.is_system_message and not self.sender:
            raise ValidationError({'sender': _('Обычное сообщение должно иметь отправителя')})
        
        # Отправитель должен быть участником чата
        if self.sender and self.sender != self.chat.client and self.sender != self.chat.creator:
            raise ValidationError({'sender': _('Отправитель должен быть участником чата')})
    
    def save(self, *args, **kwargs):
        """
        Переопределяем save для выполнения clean() перед сохранением и
        обновления времени последней активности в чате.
        """
        self.clean()
        super().save(*args, **kwargs)
        
        # Обновляем время последней активности в чате
        self.chat.updated_at = self.created_at
        self.chat.save(update_fields=['updated_at'])


class SystemMessageTemplate(models.Model):
    """
    Модель шаблона системного сообщения для различных событий.
    
    Attributes:
        event_type (CharField): Тип события (изменение статуса заказа, назначение креатора и т.д.).
        template (TextField): Шаблон текста сообщения с плейсхолдерами.
        is_active (BooleanField): Признак активности шаблона.
    """
    # Типы событий
    EVENT_ORDER_STATUS_CHANGE = 'order_status_change'
    EVENT_ORDER_CREATOR_ASSIGNED = 'order_creator_assigned'
    EVENT_ORDER_CREATOR_RESPONDED = 'order_creator_responded'
    EVENT_ORDER_REMINDER = 'order_reminder'
    
    EVENT_CHOICES = [
        (EVENT_ORDER_STATUS_CHANGE, _('Изменение статуса заказа')),
        (EVENT_ORDER_CREATOR_ASSIGNED, _('Назначение креатора на заказ')),
        (EVENT_ORDER_CREATOR_RESPONDED, _('Отклик креатора на заказ')),
        (EVENT_ORDER_REMINDER, _('Напоминание о заказе')),
    ]
    
    event_type = models.CharField(
        _('тип события'),
        max_length=50,
        choices=EVENT_CHOICES
    )
    template = models.TextField(
        _('шаблон сообщения'),
        help_text=_('Используйте {placeholder} для вставки динамических значений')
    )
    is_active = models.BooleanField(_('активен'), default=True)
    
    class Meta:
        verbose_name = _('шаблон системного сообщения')
        verbose_name_plural = _('шаблоны системных сообщений')
    
    def __str__(self):
        """Возвращает строковое представление шаблона."""
        return f"Шаблон для {self.get_event_type_display()}"