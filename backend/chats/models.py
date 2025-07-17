"""
Модели для приложения chats.

В данном модуле описаны модели для работы с чатами и сообщениями между
пользователями системы (клиентами и креаторами).
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class Chat(models.Model):
    """
    Модель чата между клиентом и креатором.
    
    Чат создается для общения между клиентом и креатором. Может быть связан с заказом,
    если чат создан в контексте конкретного заказа.
    
    Attributes:
        client (ForeignKey): Клиент, участвующий в чате.
        creator (ForeignKey): Креатор, участвующий в чате.
        order (ForeignKey, опционально): Заказ, связанный с чатом.
        is_active (BooleanField): Флаг активности чата.
        created_at (DateTimeField): Дата и время создания чата.
        updated_at (DateTimeField): Дата и время последнего обновления чата.
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
    is_active = models.BooleanField(
        _('активен'),
        default=True
    )
    created_at = models.DateTimeField(
        _('дата создания'),
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        _('дата обновления'),
        auto_now=True
    )
    
    class Meta:
        verbose_name = _('чат')
        verbose_name_plural = _('чаты')
        # Уникальное ограничение на пару (client, creator)
        unique_together = ('client', 'creator')
        ordering = ['-updated_at']
    
    def __str__(self):
        """
        Возвращает строковое представление чата.
        
        Returns:
            str: Строковое представление чата вида "Чат между <имя клиента> и <имя креатора>".
        """
        return f"Чат между {self.client.username} и {self.creator.username}"
    
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
            user: Пользователь, для которого нужно получить количество непрочитанных сообщений.
            
        Returns:
            int: Количество непрочитанных сообщений.
        """
        if user == self.client:
            return self.messages.filter(read_by_client=False).exclude(sender=user).count()
        elif user == self.creator:
            return self.messages.filter(read_by_creator=False).exclude(sender=user).count()
        return 0


class Message(models.Model):
    """
    Модель сообщения в чате.
    
    Сообщения могут быть отправлены клиентом, креатором или системой.
    
    Attributes:
        chat (ForeignKey): Чат, к которому относится сообщение.
        sender (ForeignKey, опционально): Отправитель сообщения (None для системных сообщений).
        content (TextField): Содержимое сообщения.
        attachment (FileField, опционально): Прикрепленный файл.
        is_system_message (BooleanField): Флаг, указывающий, что сообщение системное.
        read_by_client (BooleanField): Флаг, указывающий, что сообщение прочитано клиентом.
        read_by_creator (BooleanField): Флаг, указывающий, что сообщение прочитано креатором.
        created_at (DateTimeField): Дата и время создания сообщения.
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
        default=timezone.now
    )
    
    class Meta:
        verbose_name = _('сообщение')
        verbose_name_plural = _('сообщения')
        ordering = ['created_at']
    
    def __str__(self):
        """
        Возвращает строковое представление сообщения.
        
        Returns:
            str: Строковое представление сообщения с его содержимым и отправителем.
        """
        sender_name = self.sender.username if self.sender else 'Система'
        return f"Сообщение от {sender_name}: {self.content[:50]}..."
    
    def save(self, *args, **kwargs):
        """
        Переопределяем метод save для установки флагов прочитанных сообщений
        и обновления времени последнего обновления чата.
        """
        # Если сообщение отправлено клиентом, то оно автоматически считается прочитанным клиентом
        if self.sender == self.chat.client:
            self.read_by_client = True
        
        # Если сообщение отправлено креатором, то оно автоматически считается прочитанным креатором
        if self.sender == self.chat.creator:
            self.read_by_creator = True
        
        # Сохраняем сообщение
        super().save(*args, **kwargs)
        
        # Обновляем время последнего обновления чата
        self.chat.updated_at = timezone.now()
        self.chat.save(update_fields=['updated_at'])