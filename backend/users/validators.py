"""
Валидаторы для приложения users.

Содержит функции валидации для различных полей моделей.
"""

import os
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_image_or_svg(file):
    """
    Валидатор для проверки, является ли файл изображением или SVG.
    
    Проверяет расширение файла для определения допустимости.
    
    Args:
        file: Объект файла для проверки
        
    Raises:
        ValidationError: Если файл не является изображением или SVG
    """
    # Проверяем расширение файла
    ext = os.path.splitext(file.name)[1].lower()
    
    # Допустимые расширения для изображений
    valid_image_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg']
    
    if ext not in valid_image_extensions:
        raise ValidationError(
            _('Загрузите правильное изображение. Поддерживаемые форматы: JPEG, PNG, WEBP, SVG.')
        )
    
    # Дополнительная проверка для SVG-файлов
    if ext == '.svg':
        try:
            # Проверяем наличие тега <svg> в файле
            content = file.read().decode('utf-8', errors='ignore')
            file.seek(0)  # Сбрасываем указатель файла в начало
            
            if not re.search(r'<svg', content, re.IGNORECASE):
                raise ValidationError(
                    _('Загруженный SVG-файл недействителен или поврежден.')
                )
        except UnicodeDecodeError:
            raise ValidationError(
                _('Загруженный SVG-файл содержит недопустимые символы.')
            )
    
    return True