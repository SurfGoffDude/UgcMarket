"""
Централизованная система логирования для UgcMarket backend.
Создает иерархическую структуру логов: дата/пользователь/backend/компонент.json
"""

import json
import os
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, Union
from pathlib import Path
import threading
from django.conf import settings
from django.contrib.auth.models import AnonymousUser


class LogLevel(Enum):
    """Уровни логирования"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class ErrorCode(Enum):
    """Коды ошибок для системы"""
    # Пользователи
    USER_AUTH_FAILED = "USER_001"
    USER_REGISTRATION_FAILED = "USER_002"
    USER_PROFILE_UPDATE_FAILED = "USER_003"
    USER_VALIDATION_ERROR = "USER_004"
    
    # Заказы
    ORDER_CREATE_FAILED = "ORDER_001"
    ORDER_UPDATE_FAILED = "ORDER_002"
    ORDER_DELETE_FAILED = "ORDER_003"
    ORDER_NOT_FOUND = "ORDER_004"
    ORDER_PERMISSION_DENIED = "ORDER_005"
    
    # Чаты
    CHAT_CREATE_FAILED = "CHAT_001"
    CHAT_MESSAGE_FAILED = "CHAT_002"
    CHAT_ACCESS_DENIED = "CHAT_003"
    
    # Система
    DATABASE_ERROR = "SYS_001"
    VALIDATION_ERROR = "SYS_002"
    PERMISSION_ERROR = "SYS_003"
    EXTERNAL_API_ERROR = "SYS_004"
    FILE_OPERATION_ERROR = "SYS_005"
    
    # Общие
    UNKNOWN_ERROR = "GEN_001"
    SUCCESS = "SUCCESS"


class UgcLogger:
    """
    Централизованный логгер для UgcMarket.
    
    Создает структуру логов:
    logs/YYYY-MM-DD/user_id/backend/component.json
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.base_path = getattr(settings, 'LOGS_BASE_PATH', 
                                   os.path.join(settings.BASE_DIR, 'logs'))
            self.initialized = True
    
    def _get_user_id(self, user) -> str:
        """Получает ID пользователя или 'anonymous'"""
        if user is None or isinstance(user, AnonymousUser) or not hasattr(user, 'id'):
            return 'anonymous'
        return str(user.id)
    
    def _ensure_log_directory(self, date_str: str, user_id: str) -> Path:
        """Создает необходимые директории для логов"""
        log_dir = Path(self.base_path) / date_str / user_id / 'backend'
        log_dir.mkdir(parents=True, exist_ok=True)
        return log_dir
    
    def _create_log_entry(self, 
                         level: LogLevel, 
                         component: str,
                         message: str,
                         error_code: ErrorCode = ErrorCode.SUCCESS,
                         extra_data: Optional[Dict[str, Any]] = None,
                         user_id: str = 'anonymous') -> Dict[str, Any]:
        """Создает запись лога"""
        timestamp = datetime.now()
        
        log_entry = {
            'timestamp': timestamp.isoformat(),
            'level': level.value,
            'component': component,
            'message': message,
            'error_code': error_code.value,
            'user_id': user_id,
            'extra_data': extra_data or {}
        }
        
        return log_entry
    
    def _write_log(self, log_entry: Dict[str, Any], component: str, user_id: str):
        """Записывает лог в файл"""
        try:
            date_str = datetime.now().strftime('%Y-%m-%d')
            log_dir = self._ensure_log_directory(date_str, user_id)
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
            
            # Записываем обратно
            with open(log_file, 'w', encoding='utf-8') as f:
                json.dump(logs, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            # Fallback: записываем в общий лог ошибок
            fallback_path = Path(self.base_path) / 'system_errors.log'
            fallback_path.parent.mkdir(parents=True, exist_ok=True)
            with open(fallback_path, 'a', encoding='utf-8') as f:
                f.write(f"{datetime.now().isoformat()} - LOGGING_ERROR: {str(e)}\n")
    
    def log(self, 
            level: LogLevel,
            component: str,
            message: str,
            error_code: ErrorCode = ErrorCode.SUCCESS,
            extra_data: Optional[Dict[str, Any]] = None,
            user: Optional[Any] = None):
        """
        Основной метод логирования.
        
        Args:
            level: Уровень логирования
            component: Компонент системы (например, 'users_views', 'orders_models')
            message: Сообщение лога
            error_code: Код ошибки
            extra_data: Дополнительные данные
            user: Объект пользователя Django
        """
        user_id = self._get_user_id(user)
        log_entry = self._create_log_entry(level, component, message, error_code, extra_data, user_id)
        self._write_log(log_entry, component, user_id)
    
    # Удобные методы для разных уровней логирования
    def debug(self, component: str, message: str, error_code: ErrorCode = ErrorCode.SUCCESS,
              extra_data: Optional[Dict[str, Any]] = None, user: Optional[Any] = None):
        """Лог уровня DEBUG"""
        self.log(LogLevel.DEBUG, component, message, error_code, extra_data, user)
    
    def info(self, component: str, message: str, error_code: ErrorCode = ErrorCode.SUCCESS,
             extra_data: Optional[Dict[str, Any]] = None, user: Optional[Any] = None):
        """Лог уровня INFO"""
        self.log(LogLevel.INFO, component, message, error_code, extra_data, user)
    
    def warning(self, component: str, message: str, error_code: ErrorCode = ErrorCode.UNKNOWN_ERROR, 
                extra_data: Optional[Dict[str, Any]] = None, user: Optional[Any] = None):
        """Лог уровня WARNING"""
        self.log(LogLevel.WARNING, component, message, error_code, extra_data, user)
    
    def error(self, component: str, message: str, error_code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
              extra_data: Optional[Dict[str, Any]] = None, user: Optional[Any] = None):
        """Лог уровня ERROR"""
        self.log(LogLevel.ERROR, component, message, error_code, extra_data, user)
    
    def critical(self, component: str, message: str, error_code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
                 extra_data: Optional[Dict[str, Any]] = None, user: Optional[Any] = None):
        """Лог уровня CRITICAL"""
        self.log(LogLevel.CRITICAL, component, message, error_code, extra_data, user)


# Глобальный экземпляр логгера
logger = UgcLogger()


# Удобные функции для быстрого использования
def log_debug(component: str, message: str, error_code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
              extra_data: Optional[Dict[str, Any]] = None, user: Optional[Any] = None):
    """Быстрое логирование DEBUG"""
    logger.debug(component, message, error_code, extra_data, user)


def log_info(component: str, message: str, error_code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
             extra_data: Optional[Dict[str, Any]] = None, user: Optional[Any] = None):
    """Быстрое логирование INFO"""
    logger.info(component, message, error_code, extra_data, user)


def log_warning(component: str, message: str, error_code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
                extra_data: Optional[Dict[str, Any]] = None, user: Optional[Any] = None):
    """Быстрое логирование WARNING"""
    logger.warning(component, message, error_code, extra_data, user)


def log_error(component: str, message: str, error_code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
              extra_data: Optional[Dict[str, Any]] = None, user: Optional[Any] = None):
    """Быстрое логирование ERROR"""
    logger.error(component, message, error_code, extra_data, user)


def log_critical(component: str, message: str, error_code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
                 extra_data: Optional[Dict[str, Any]] = None, user: Optional[Any] = None):
    """Быстрое логирование CRITICAL"""
    logger.critical(component, message, error_code, extra_data, user)


def log_user_action(user: Any, action: str, component: str, success: bool = True, 
                   extra_data: Optional[Dict[str, Any]] = None):
    """
    Логирование действий пользователя.
    
    Args:
        user: Объект пользователя Django
        action: Описание действия
        component: Компонент системы
        success: Успешность операции
        extra_data: Дополнительные данные
    """
    level = LogLevel.INFO if success else LogLevel.ERROR
    error_code = ErrorCode.SUCCESS if success else ErrorCode.UNKNOWN_ERROR
    message = f"Пользователь выполнил действие: {action}"
    
    logger.log(level, component, message, error_code, extra_data, user)