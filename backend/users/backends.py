"""
Бэкенды аутентификации для приложения users.

Содержит кастомный бэкенд для аутентификации пользователей по email или username.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

import logging
logger = logging.getLogger('django')

User = get_user_model()


class EmailOrUsernameModelBackend(ModelBackend):
    """
    Кастомный бэкенд аутентификации, позволяющий входить с использованием
    либо email, либо username.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Аутентификация пользователя по email или username.
        
        Args:
            request: HTTP запрос
            username: Имя пользователя или email
            password: Пароль пользователя
            
        Returns:
            User: Пользователь, если аутентификация успешна, иначе None
        """
        logger.info(f"Попытка аутентификации для пользователя: {username}")
        
        try:
            # Проверяем, есть ли пользователь с таким username или email
            user = User.objects.get(
                Q(username__iexact=username) | Q(email__iexact=username)
            )
            
            logger.info(f"Найден пользователь: {user.username} (ID: {user.id})")
            logger.info(f"Статус пользователя: is_active={user.is_active}, is_verified={user.is_verified}")
            
            # Проверяем пароль и активность аккаунта
            if user.check_password(password) and self.user_can_authenticate(user):
                logger.info(f"Аутентификация успешна для пользователя: {user.username}")
                return user
            else:
                if not user.is_active:
                    logger.warning(f"Аутентификация не удалась: пользователь не активирован (is_active=False)")
                else:
                    logger.warning(f"Аутентификация не удалась: неверный пароль")
                return None
                
        except User.DoesNotExist:
            logger.warning(f"Пользователь с username/email '{username}' не найден")
            return None