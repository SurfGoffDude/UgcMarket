"""
Фильтры для приложения orders.

Содержит классы фильтрации для эндпоинтов заказов.
"""

import django_filters
from .models import Order


class OrderFilter(django_filters.FilterSet):
    """
    Фильтр для заказов.
    
    Позволяет фильтровать заказы по различным параметрам.
    """
    min_budget = django_filters.NumberFilter(field_name='budget', lookup_expr='gte')
    max_budget = django_filters.NumberFilter(field_name='budget', lookup_expr='lte')
    deadline_before = django_filters.DateFilter(field_name='deadline', lookup_expr='lte')
    deadline_after = django_filters.DateFilter(field_name='deadline', lookup_expr='gte')
    category = django_filters.CharFilter(field_name='category__slug')
    tags = django_filters.CharFilter(method='filter_by_tags')
    client = django_filters.NumberFilter(field_name='client')
    target_creator = django_filters.NumberFilter(field_name='target_creator')
    status = django_filters.CharFilter(field_name='status')
    is_private = django_filters.BooleanFilter(field_name='is_private')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = Order
        fields = [
            'min_budget', 'max_budget', 
            'deadline_before', 'deadline_after',
            'category', 'tags', 'status',
            'client', 'target_creator', 'is_private',
            'created_after', 'created_before'
        ]
    
    def filter_by_tags(self, queryset, name, value):
        """
        Фильтрует заказы по нескольким тегам (разделенным запятыми).
        
        Args:
            queryset: Исходный QuerySet заказов
            name: Имя поля фильтра
            value: Значение фильтра (список slug тегов, разделенных запятыми)
            
        Returns:
            QuerySet: Отфильтрованный QuerySet
        """
        tag_slugs = value.split(',')
        return queryset.filter(tags__slug__in=tag_slugs).distinct()