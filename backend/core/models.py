"""Модели для приложения Core.

В данном модуле определены основные общие модели, используемые в разных частях приложения.
Здесь находится единая модель Tag, которая используется как для заказов, так и для профилей пользователей.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _


class Tag(models.Model):
    """
    Единая модель тега для всего приложения.
    
    Эта модель заменяет отдельные модели тегов из orders.models.Tag и users.models.Tag.
    Используется для маркировки как заказов, так и профилей креаторов.
    
    Attributes:
        name (CharField): Название тега.
        slug (SlugField): Уникальный slug для URL.
        category (ForeignKey): Категория тега (опционально).
        type (CharField): Тип тега, определяет его назначение ('order' или 'creator').
    """
    # Типы тегов
    TAG_TYPE_ORDER = 'order'
    TAG_TYPE_CREATOR = 'creator'
    TAG_TYPE_CHOICES = [
        (TAG_TYPE_ORDER, _('Тег заказа')),
        (TAG_TYPE_CREATOR, _('Тег креатора')),
    ]
    
    name = models.CharField(_('название'), max_length=100)
    slug = models.SlugField(_('slug'), max_length=100, unique=True)
    category = models.ForeignKey(
        'orders.Category',  # Оставляем связь с моделью Category из приложения orders
        on_delete=models.SET_NULL,
        related_name='tags',
        null=True,
        blank=True,
        verbose_name=_('категория')
    )
    type = models.CharField(
        _('тип тега'),
        max_length=10,
        choices=TAG_TYPE_CHOICES,
        default=TAG_TYPE_ORDER,
        help_text=_('Определяет назначение тега (для заказов или креаторов)')
    )
    
    class Meta:
        verbose_name = _('тег')
        verbose_name_plural = _('теги')
        ordering = ['name']
    
    def __str__(self):
        """Возвращает строковое представление тега."""
        return self.name
