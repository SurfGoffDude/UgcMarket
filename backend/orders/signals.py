"""
Сигналы для приложения orders.

Модуль содержит обработчики сигналов для моделей заказов,
обеспечивающие автоматическое создание чатов, уведомлений и т.д.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils.translation import gettext as _
from django.conf import settings

from .models import Order
from chats.models import Chat, Message, SystemMessageTemplate


@receiver(post_save, sender=Order)
def create_chat_for_order(sender, instance, created, **kwargs):
    """
    Создаёт чат для заказа при его создании или обновляет сообщения при изменении статуса.
    
    Args:
        sender: Модель, отправившая сигнал (Order).
        instance: Экземпляр модели Order.
        created: Флаг, указывающий, что запись только что создана.
    """
    # Если заказ не приватный (публичный каталог), пропускаем создание чата
    # Чат будет создан при назначении креатора
    if created:
        # Для приватных заказов сразу создаём чат между клиентом и выбранным креатором
        if instance.is_private and instance.creator:
            chat, chat_created = Chat.objects.get_or_create(
                client=instance.client,
                creator=instance.creator,
                order=instance
            )
            
            if chat_created:
                # Создаём системное сообщение о создании заказа
                try:
                    template = SystemMessageTemplate.objects.get(
                        event_type=SystemMessageTemplate.EVENT_ORDER_CREATOR_ASSIGNED,
                        is_active=True
                    )
                    message_text = template.template.format(
                        order_title=instance.title,
                        client_name=instance.client.username,
                        creator_name=instance.creator.username
                    )
                except (SystemMessageTemplate.DoesNotExist, KeyError):
                    # Если шаблон не найден, используем стандартное сообщение
                    message_text = _(
                        "Создан новый заказ '{order_title}'. "
                        "Клиент {client_name} выбрал креатора {creator_name} для выполнения."
                    ).format(
                        order_title=instance.title,
                        client_name=instance.client.username,
                        creator_name=instance.creator.username
                    )
                
                Message.objects.create(
                    chat=chat,
                    content=message_text,
                    is_system_message=True
                )
    else:
        # Получаем предыдущее сохранённое состояние объекта Order
        try:
            previous_status = instance._prev_status
        except AttributeError:
            previous_status = None
        
        # Если статус заказа изменился, добавляем системное сообщение в чат
        if previous_status and previous_status != instance.status:
            chats = Chat.objects.filter(order=instance)
            
            if chats.exists():
                try:
                    template = SystemMessageTemplate.objects.get(
                        event_type=SystemMessageTemplate.EVENT_ORDER_STATUS_CHANGE,
                        is_active=True
                    )
                    message_text = template.template.format(
                        order_title=instance.title,
                        old_status=dict(Order.STATUS_CHOICES).get(previous_status, previous_status),
                        new_status=dict(Order.STATUS_CHOICES).get(instance.status, instance.status)
                    )
                except (SystemMessageTemplate.DoesNotExist, KeyError):
                    # Если шаблон не найден, используем стандартное сообщение
                    message_text = _(
                        "Статус заказа '{order_title}' изменён с '{old_status}' на '{new_status}'."
                    ).format(
                        order_title=instance.title,
                        old_status=dict(Order.STATUS_CHOICES).get(previous_status, previous_status),
                        new_status=dict(Order.STATUS_CHOICES).get(instance.status, instance.status)
                    )
                
                for chat in chats:
                    Message.objects.create(
                        chat=chat,
                        content=message_text,
                        is_system_message=True
                    )


@receiver(post_save, sender=Order)
def create_order_reminder(sender, instance, created, **kwargs):
    """
    Создаёт напоминания для клиентов о смене статуса заказа.
    
    Args:
        sender: Модель, отправившая сигнал (Order).
        instance: Экземпляр модели Order.
        created: Флаг, указывающий, что запись только что создана.
    """
    # Если заказ в статусе "on_review" (На проверке), и клиент должен изменить статус
    if instance.status == 'on_review':
        # Проверяем существование чатов для этого заказа
        chats = Chat.objects.filter(order=instance)
        
        if chats.exists():
            try:
                template = SystemMessageTemplate.objects.get(
                    event_type=SystemMessageTemplate.EVENT_ORDER_REMINDER,
                    is_active=True
                )
                message_text = template.template.format(
                    order_title=instance.title,
                    action="проверить и изменить статус"
                )
            except (SystemMessageTemplate.DoesNotExist, KeyError):
                # Если шаблон не найден, используем стандартное сообщение
                message_text = _(
                    "Напоминание: заказ '{order_title}' ожидает проверки. "
                    "Пожалуйста, не забудьте изменить статус заказа после проверки."
                ).format(order_title=instance.title)
            
            # Добавляем напоминание во все чаты, связанные с этим заказом
            for chat in chats:
                Message.objects.create(
                    chat=chat,
                    content=message_text,
                    is_system_message=True
                )