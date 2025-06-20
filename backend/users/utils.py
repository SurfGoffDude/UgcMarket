"""
Утилиты для приложения users.

Содержит вспомогательные функции для работы с пользователями,
включая отправку электронных писем и генерацию токенов.
"""

from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from .tokens import email_verification_token
import threading


class EmailThread(threading.Thread):
    """
    Класс для асинхронной отправки email.
    
    Позволяет отправлять электронные письма в отдельном потоке
    для повышения производительности обработки запросов.
    """
    def __init__(self, email):
        """
        Инициализация класса EmailThread.
        
        Args:
            email (EmailMessage): Объект письма для отправки.
        """
        self.email = email
        threading.Thread.__init__(self)
    
    def run(self):
        """
        Запускает отправку email в отдельном потоке.
        """
        self.email.send()


def send_email(subject, message, recipient_list, from_email=None):
    """
    Отправляет email асинхронно.
    
    Args:
        subject (str): Тема письма
        message (str): Содержимое письма
        recipient_list (list): Список получателей
        from_email (str, optional): Email отправителя. Если None, используется DEFAULT_FROM_EMAIL из настроек.
        
    Returns:
        bool: True, если письмо было успешно отправлено в отдельный поток
    """
    if from_email is None:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@ugcmarket.com')
    
    email = EmailMessage(subject, message, from_email, recipient_list)
    email.content_subtype = 'html'  # Указываем, что письмо в формате HTML
    
    # Запускаем отправку письма в отдельном потоке
    EmailThread(email).start()
    return True


def send_verification_email(user, request):
    """
    Отправляет email для верификации пользователя.
    
    Args:
        user: Пользователь, которому отправляется письмо
        request: HTTP запрос
        
    Returns:
        bool: True, если письмо было отправлено успешно
    """
    # Получаем домен из запроса
    domain = request.get_host()
    protocol = 'https' if request.is_secure() else 'http'
    
    # Генерируем токен и uid
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)
    
    # URL для верификации email
    verification_url = f"{protocol}://{domain}/api/auth/verify-email/{uid}/{token}/"
    
    # Формируем контекст для шаблона
    context = {
        'user': user,
        'verification_url': verification_url,
        'domain': domain
    }
    
    # Рендерим шаблон письма
    message = render_to_string('users/email_verification.html', context)
    
    # Отправляем письмо
    return send_email(
        'Подтверждение email адреса для UGC Market',
        message,
        [user.email]
    )