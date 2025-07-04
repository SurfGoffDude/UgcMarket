from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
import re

class TagsView(APIView):
    """Возвращает список тегов из базы данных (модель core.Tag) в формате JSON

    Формат элемента:
    {
        "id": int,
        "name": str,
        "slug": str,
        "category": str | None,
        "type": str  # 'order' или 'creator'
    }
    
    Параметры запроса:
    - type: фильтрация по типу тега ('order' или 'creator')
    """

    def get(self, request, *args, **kwargs):
        # Получаем все теги из базы данных (core.models.Tag)
        from core.models import Tag
        
        # Получаем параметр type из запроса для фильтрации
        tag_type = request.query_params.get('type')
        
        # Фильтруем теги по типу, если указан параметр
        tags_query = Tag.objects.all()
        if tag_type in [Tag.TAG_TYPE_ORDER, Tag.TAG_TYPE_CREATOR]:
            tags_query = tags_query.filter(type=tag_type)
        
        # Добавляем связанные объекты для оптимизации запросов
        tags_query = tags_query.prefetch_related('category')
        
        tags_list = []
        for tag in tags_query:
            category_info = None
            
            # Обрабатываем категорию, возвращаем более детальную информацию
            if tag.category:
                category_info = {
                    'id': tag.category.id,
                    'name': tag.category.name
                }
            
            # Добавляем теги с расширенной информацией, включая type и slug
            tags_list.append({
                'id': tag.id,
                'name': tag.name,
                'slug': tag.slug,
                'category': category_info,
                'type': tag.type  # Добавляем тип тега
            })
            
        return Response(tags_list)
