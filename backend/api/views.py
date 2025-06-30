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
        "category": str | None
    }
    """

    def get(self, request, *args, **kwargs):
        # Получаем все теги из базы данных (core.models.Tag)
        from core.models import Tag
        
        tags_list = []
        for tag in Tag.objects.all().prefetch_related('category'):
            category_name = tag.category.name if tag.category else None
            tags_list.append({
                'id': tag.id,
                'name': tag.name,
                'category': category_name
            })
            
        return Response(tags_list)
