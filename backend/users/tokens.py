"""
Модуль с токенами для подтверждения email пользователя.

Содержит класс для создания и проверки токенов, используемых при верификации email.
"""

from django.contrib.auth.tokens import PasswordResetTokenGenerator
import six


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """
    Генератор токенов для верификации email.
    
    Расширяет стандартный генератор токенов Django для сброса пароля,
    адаптируя его для задач верификации email.
    """
    def _make_hash_value(self, user, timestamp):
        """
        Создает значение хеша для токена.
        
        Args:
            user: Пользователь, для которого создается токен.
            timestamp: Временная метка создания токена.
            
        Returns:
            str: Строка для хеширования, содержащая ID пользователя, временную метку,
                 статус активации и флаг is_verified.
        """
        return (
            six.text_type(user.pk) + six.text_type(timestamp) +
            six.text_type(user.is_active) + six.text_type(user.is_verified)
        )


# Создаем экземпляр генератора токена для использования в представлениях
email_verification_token = EmailVerificationTokenGenerator()