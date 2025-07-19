"""
Модели для приложения чатов.

Этот модуль содержит определения моделей для функционала чатов:
- Chat: Модель чата между клиентом и креатором
- Message: Модель сообщения в чате
- SystemMessageTemplate: Шаблоны системных сообщений
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Chat(models.Model):
    """
    Модель чата между клиентом и креатором.
    
    Чат содержит сообщения и связан с клиентом и креатором.
    Опционально может быть связан с заказом.
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
        'orders.Order',
        on_delete=models.SET_NULL,
        related_name='chats',
        null=True,
        blank=True,
        verbose_name=_('заказ')
    )
    created_at = models.DateTimeField(
        _('дата создания'),
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        _('дата обновления'),
        auto_now=True
    )
    is_active = models.BooleanField(
        _('активен'),
        default=True,
        help_text=_('Указывает, активен ли чат')
    )

    class Meta:
        verbose_name = _('чат')
        verbose_name_plural = _('чаты')
        ordering = ['-updated_at']

    def __str__(self):
        """
        Возвращает строковое представление чата.
        
        Returns:
            str: Строковое представление чата.
        """
        order_info = f" ({self.order.title})" if self.order else ""
        return f"Чат между {self.client.username} и {self.creator.username}{order_info}"

    def get_last_message(self):
        """
        Возвращает последнее сообщение в чате.
        
        Returns:
            Message: Последнее сообщение в чате или None, если сообщений нет.
        """
        return self.messages.order_by('-created_at').first()
        
    def get_unread_count_for_user(self, user):
        """
        Возвращает количество непрочитанных сообщений для указанного пользователя.
        
        Args:
            user (User): Пользователь, для которого подсчитываются непрочитанные сообщения.
            
        Returns:
            int: Количество непрочитанных сообщений.
        """
        if user == self.client:
            # Для клиента считаем сообщения, которые он не прочитал
            return self.messages.filter(read_by_client=False).exclude(sender=user).count()
        elif user == self.creator:
            # Для креатора считаем сообщения, которые он не прочитал
            return self.messages.filter(read_by_creator=False).exclude(sender=user).count()
        else:
            # Для других пользователей (например, администраторов) возвращаем 0
            return 0


class Message(models.Model):
    """
    Модель сообщения в чате.
    
    Сообщение содержит текст и может иметь вложение.
    Может быть системным сообщением или отправлено пользователем.
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
    content = models.TextField(_('содержимое'))
    attachment = models.FileField(
        _('вложение'),
        upload_to='chat_attachments/',
        null=True,
        blank=True
    )
    is_system_message = models.BooleanField(
        _('системное сообщение'),
        default=False
    )
    read_by_client = models.BooleanField(
        _('прочитано клиентом'),
        default=False
    )
    read_by_creator = models.BooleanField(
        _('прочитано креатором'),
        default=False
    )
    created_at = models.DateTimeField(
        _('дата создания'),
        auto_now_add=True
    )

    class Meta:
        verbose_name = _('сообщение')
        verbose_name_plural = _('сообщения')
        ordering = ['created_at']

    def __str__(self):
        """
        Возвращает строковое представление сообщения.
        
        Returns:
            str: Строковое представление сообщения.
        """
        sender = self.sender.username if self.sender else 'Система'
        return f"Сообщение от {sender} в чате {self.chat_id}"

    def mark_as_read_by(self, user):
        """
        Отмечает сообщение как прочитанное пользователем.
        
        Args:
            user (User): Пользователь, прочитавший сообщение.
        """
        # Определяем, является ли пользователь клиентом или креатором чата
        if user == self.chat.client:
            self.read_by_client = True
            self.save(update_fields=['read_by_client'])
        elif user == self.chat.creator:
            self.read_by_creator = True
            self.save(update_fields=['read_by_creator'])


class SystemMessageTemplate(models.Model):
    """
    Модель шаблона системного сообщения.
    
    Используется для генерации системных сообщений в различных событиях.
    """
    EVENT_CHOICES = (
        ('order_accepted', _('Заказ принят')),
        ('order_completed', _('Заказ завершен')),
        ('order_cancelled', _('Заказ отменен')),
        ('delivery_created', _('Создана поставка')),
        ('delivery_accepted', _('Поставка принята')),
        ('delivery_rejected', _('Поставка отклонена')),
    )
    
    event = models.CharField(
        _('событие'),
        max_length=50,
        choices=EVENT_CHOICES,
        unique=True
    )
    template = models.TextField(
        _('шаблон сообщения'),
        help_text=_('Используйте переменные в формате {variable_name}')
    )
    
    class Meta:
        verbose_name = _('шаблон системного сообщения')
        verbose_name_plural = _('шаблоны системных сообщений')
        
    def __str__(self):
        """
        Возвращает строковое представление шаблона.
        
        Returns:
            str: Строковое представление шаблона.
        """
        return f"Шаблон для события {self.get_event_display()}"