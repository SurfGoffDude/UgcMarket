"""
API views для системы логирования.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.contrib.auth.models import AnonymousUser

from .logger import logger, LogLevel, ErrorCode


@api_view(['POST'])
@permission_classes([])  # Разрешаем анонимные запросы для логирования
def log_frontend_entry(request):
    """
    API endpoint для получения логов от frontend.
    
    Принимает JSON с полями:
    - timestamp: строка ISO формата
    - level: уровень логирования
    - component: компонент frontend
    - message: сообщение
    - error_code: код ошибки
    - user_id: ID пользователя
    - extra_data: дополнительные данные
    - url: URL страницы
    - user_agent: User Agent браузера
    """
    try:
        data = request.data
        
        # Валидация обязательных полей
        required_fields = ['timestamp', 'level', 'component', 'message', 'error_code', 'user_id']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'Отсутствует обязательное поле: {field}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Получаем данные из запроса
        timestamp_str = data['timestamp']
        level_str = data['level']
        component = data['component']
        message = data['message']
        error_code_str = data['error_code']
        user_id = data['user_id']
        extra_data = data.get('extra_data', {})
        url = data.get('url', '')
        user_agent = data.get('user_agent', '')
        
        # Добавляем frontend-специфичные данные в extra_data
        extra_data.update({
            'url': url,
            'user_agent': user_agent,
            'source': 'frontend'
        })
        
        # Создаем структуру директорий для frontend логов
        try:
            timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            date_str = timestamp.strftime('%Y-%m-%d')
        except ValueError:
            date_str = datetime.now().strftime('%Y-%m-%d')
        
        base_path = getattr(settings, 'LOGS_BASE_PATH', 
                           os.path.join(settings.BASE_DIR, 'logs'))
        log_dir = Path(base_path) / date_str / user_id / 'frontend'
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Создаем запись лога
        log_entry = {
            'timestamp': timestamp_str,
            'level': level_str,
            'component': component,
            'message': message,
            'error_code': error_code_str,
            'user_id': user_id,
            'extra_data': extra_data
        }
        
        # Записываем в файл компонента
        log_file = log_dir / f'{component}.json'
        
        # Читаем существующие логи или создаем новый список
        logs = []
        if log_file.exists():
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    logs = json.load(f)
            except (json.JSONDecodeError, IOError):
                logs = []
        
        # Добавляем новую запись
        logs.append(log_entry)
        
        # Ограничиваем количество записей в файле (последние 1000)
        if len(logs) > 1000:
            logs = logs[-1000:]
        
        # Записываем обратно
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)
        
        return Response({'status': 'success'}, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Логируем ошибку в системе логирования backend
        logger.error(
            'logging_api',
            f'Ошибка при обработке лога от frontend: {str(e)}',
            ErrorCode.UNKNOWN_ERROR,
            {'request_data': request.data, 'error': str(e)}
        )
        
        return Response(
            {'error': 'Внутренняя ошибка сервера'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_logs(request):
    """
    API endpoint для получения логов пользователя.
    
    Параметры запроса:
    - date: дата в формате YYYY-MM-DD (по умолчанию сегодня)
    - component: фильтр по компоненту (опционально)
    - level: фильтр по уровню логирования (опционально)
    - source: backend или frontend (опционально)
    """
    try:
        user_id = str(request.user.id)
        date_str = request.GET.get('date', datetime.now().strftime('%Y-%m-%d'))
        component_filter = request.GET.get('component')
        level_filter = request.GET.get('level')
        source_filter = request.GET.get('source')  # backend или frontend
        
        base_path = getattr(settings, 'LOGS_BASE_PATH', 
                           os.path.join(settings.BASE_DIR, 'logs'))
        
        user_logs = []
        
        # Определяем источники для поиска
        sources = []
        if source_filter:
            sources = [source_filter]
        else:
            sources = ['backend', 'frontend']
        
        for source in sources:
            log_dir = Path(base_path) / date_str / user_id / source
            
            if not log_dir.exists():
                continue
            
            # Проходим по всем файлам логов в директории
            for log_file in log_dir.glob('*.json'):
                component_name = log_file.stem
                
                # Применяем фильтр по компоненту
                if component_filter and component_name != component_filter:
                    continue
                
                try:
                    with open(log_file, 'r', encoding='utf-8') as f:
                        logs = json.load(f)
                    
                    for log_entry in logs:
                        # Применяем фильтр по уровню
                        if level_filter and log_entry.get('level') != level_filter:
                            continue
                        
                        # Добавляем информацию об источнике
                        log_entry['source'] = source
                        user_logs.append(log_entry)
                        
                except (json.JSONDecodeError, IOError):
                    continue
        
        # Сортируем по времени (новые сначала)
        user_logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return Response({
            'logs': user_logs,
            'total_count': len(user_logs),
            'date': date_str,
            'user_id': user_id
        })
        
    except Exception as e:
        logger.error(
            'logging_api',
            f'Ошибка при получении логов пользователя: {str(e)}',
            ErrorCode.UNKNOWN_ERROR,
            {'user_id': request.user.id, 'error': str(e)}
        )
        
        return Response(
            {'error': 'Внутренняя ошибка сервера'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )