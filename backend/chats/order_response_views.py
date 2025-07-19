"""
Представления для интеграции заказов и чатов.

В данном модуле описаны представления для работы с откликами на заказы через интерфейс чатов.
"""

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Chat, Message
from .permissions import IsParticipantInChat
from orders.models import Order, OrderResponse
from orders.serializers import OrderResponseSerializer
from rest_framework import permissions as drf_permissions
from django.db.models import Q


class IsParticipantInChatByID(drf_permissions.BasePermission):
    """
    Разрешение для доступа к чату по ID только участникам чата.
    
    Разрешает доступ только если пользователь является клиентом или креатором в чате.
    Специальная версия для использования с chat_id вместо chat_pk.
    """
    
    def has_permission(self, request, view):
        """
        Проверяет, является ли пользователь участником чата для доступа к чату по ID.
        
        Args:
            request: Объект запроса.
            view: Представление, обрабатывающее запрос.
            
        Returns:
            bool: True, если пользователь является участником чата, иначе False.
        """
        chat_id = view.kwargs.get('chat_id')
        if not chat_id:
            return False
        
        try:
            chat = Chat.objects.get(pk=chat_id)
            return request.user == chat.client or request.user == chat.creator
        except Chat.DoesNotExist:
            return False
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет, является ли пользователь участником чата для доступа к объекту.
        
        Args:
            request: Объект запроса.
            view: Представление, обрабатывающее запрос.
            obj: Объект, к которому запрашивается доступ.
            
        Returns:
            bool: True, если пользователь является участником чата, иначе False.
        """
        if hasattr(obj, 'chat'):
            chat = obj.chat
        else:
            chat = obj
        return request.user == chat.client or request.user == chat.creator

import logging
logger = logging.getLogger(__name__)


class CreateOrderResponseByChatView(APIView):
    """
    Представление для создания отклика на заказ по ID чата.
    
    Эндпоинт: /api/chats/create-for-order/<int:chat_id>/
    
    Метод: POST
    
    Создаёт отклик на заказ, указанный в теле запроса, от имени креатора, участвующего в чате.
    Если такой отклик уже существует, возвращает существующий отклик.
    """
    permission_classes = [permissions.IsAuthenticated, IsParticipantInChatByID]
    
    def post(self, request, chat_id):
        # Получаем чат по ID
        try:
            chat = Chat.objects.get(id=chat_id)
        except Chat.DoesNotExist:
            return Response(
                {'error': 'Чат не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Проверяем, что пользователь является участником чата
        self.check_object_permissions(request, chat)
        
        # Получаем ID заказа из запроса или из связанного с чатом заказа
        order_id = request.data.get('order')
        
        # Если ID заказа не передан в запросе, но чат связан с заказом, используем его
        if not order_id and chat.order:
            order_id = chat.order.id
            
        # Если ID заказа все еще не определен, возвращаем ошибку
        if not order_id:
            return Response(
                {'error': 'ID заказа обязателен. Передайте его в запросе или свяжите чат с заказом'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Получаем заказ
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Заказ не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Проверяем, что пользователь является креатором в чате
        user = request.user
        if user.id != chat.creator.id:
            return Response(
                {'error': 'Только креатор может создать отклик на заказ'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем, что заказ принадлежит клиенту в чате
        if order.client.id != chat.client.id:
            return Response(
                {'error': 'Заказ не принадлежит клиенту в этом чате'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Проверяем, существует ли уже отклик на этот заказ от данного креатора
        existing_response = OrderResponse.objects.filter(
            order=order,
            creator=chat.creator
        ).first()
        
        if existing_response:
            # Если отклик уже существует, просто возвращаем информацию о нём
            serializer = OrderResponseSerializer(existing_response)
            return Response(serializer.data)
        
        # Создаем новый отклик
        price = request.data.get('price', order.budget)  # По умолчанию цена равна бюджету заказа
        message = request.data.get('message', 'Я заинтересован в выполнении этого заказа')
        timeframe = request.data.get('timeframe', 7)  # По умолчанию срок выполнения 7 дней
        
        # Создаем отклик
        order_response = OrderResponse.objects.create(
            order=order,
            creator=chat.creator,
            price=price,
            message=message,
            timeframe=timeframe
        )
        
        # Автоматически назначаем креатора на заказ
        logger.info("Автоматическое назначение креатора %s на заказ %s", chat.creator.id, order.id)
        order.creator = chat.creator
        order.target_creator = chat.creator
        if order.status in ['published', 'awaiting_response']:
            order.status = 'in_progress'
            logger.info("Обновление статуса заказа на 'in_progress'")
        order.save()
        logger.info("Креатор успешно назначен на заказ")
        
        # Добавляем системное сообщение в чат
        try:
            system_message = Message.objects.create(
                chat=chat,
                content=f"Создан отклик на заказ '{order.title}'",
                is_system_message=True,
                sender=None  # Системное сообщение не имеет отправителя
            )
        except Exception as e:
            # Если не удается создать системное сообщение, продолжаем работу
            logger.error(f"Ошибка при создании системного сообщения: {str(e)}")
            # Не прерываем процесс создания отклика
        
        # Связываем чат с заказом, если он еще не связан
        if not chat.order:
            chat.order = order
            chat.save()
        
        # Возвращаем информацию о созданном отклике
        serializer = OrderResponseSerializer(order_response)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CreateOrderResponseByOrderView(APIView):
    """
    Представление для создания отклика на заказ по ID заказа.
    
    Это представление позволяет креатору создать отклик на заказ, указав ID заказа.
    Если чат между клиентом и креатором не существует - он будет создан.
    Если чат существует - добавляется сообщение о принятии заказа.
    Заказ связывается с чатом, если это новый заказ для данного чата.
    """
    
    # Добавляем явное указание permission_classes
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, order_id):
        """
        Обработка POST-запроса на создание отклика на заказ по ID заказа.
        
        Args:
            request: Объект запроса.
            order_id: ID заказа.
            
        Returns:
            Response: Объект ответа с данными созданного отклика или ошибкой.
        """
        # Добавляем явное логирование для определения вызванного метода
        print("!!! ВЫЗВАН CreateOrderResponseByOrderView.post для order_id =", order_id, "!!!")
        # Добавляем подробное логирование для диагностики
        import logging
        logger = logging.getLogger(__name__)
        logger.info("=" * 80)
        logger.info("ДЕТАЛЬНАЯ ДИАГНОСТИКА ЗАПРОСА")
        logger.info("=" * 80)
        logger.info("Получен запрос на создание отклика для заказа %s", order_id)
        logger.info("Метод запроса: %s", request.method)
        logger.info("Параметры запроса: %s", request.query_params)
        logger.info("Данные запроса: %s", request.data)
        
        # Логируем все заголовки запроса
        logger.info("Все заголовки запроса:")
        for key, value in request.META.items():
            if key.startswith('HTTP_'):
                header_name = key[5:].replace('_', '-').title()
                # Маскируем токены для безопасности логов
                if 'AUTHORIZATION' in key:
                    if value:
                        parts = value.split(' ')
                        if len(parts) > 1:
                            masked_token = parts[0] + ' ' + parts[1][:10] + '...'
                            logger.info("  %s: %s", header_name, masked_token)
                        else:
                            logger.info("  %s: [некорректный формат]", header_name)
                    else:
                        logger.info("  %s: [пустое значение]", header_name)
                else:
                    logger.info("  %s: %s", header_name, value)
        
        # Проверяем аутентификацию
        logger.info("Аутентификация пользователя:")
        logger.info("  is_authenticated: %s", request.user.is_authenticated)
        logger.info("  user: %s (ID: %s)", request.user.username if hasattr(request.user, 'username') else 'Анонимный', 
                   request.user.id if hasattr(request.user, 'id') else 'Нет ID')
        
        # Проверяем конкретно заголовок Authorization
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        logger.info("Authorization header: %s", auth_header[:15] + '...' if auth_header else '[отсутствует]')
        
        # Проверяем схему авторизации
        if auth_header:
            parts = auth_header.split(' ', 1)
            if len(parts) == 2:
                auth_type, auth_value = parts
                logger.info("  Тип авторизации: %s", auth_type)
                logger.info("  Длина токена: %s символов", len(auth_value))
            else:
                logger.info("  Некорректный формат заголовка Authorization")
        
        # Проверяем конфигурацию DRF
        from rest_framework.settings import api_settings
        logger.info("Настройки DRF:")
        logger.info("  DEFAULT_AUTHENTICATION_CLASSES: %s", api_settings.DEFAULT_AUTHENTICATION_CLASSES)
        
        from rest_framework_simplejwt.settings import api_settings as jwt_settings
        logger.info("Настройки JWT:")
        logger.info("  AUTH_HEADER_TYPES: %s", jwt_settings.AUTH_HEADER_TYPES)
        logger.info("  AUTH_HEADER_NAME: %s", jwt_settings.AUTH_HEADER_NAME)
        
        logger.info("=" * 80)
        
        # Если пользователь не аутентифицирован, возвращаем ошибку
        if not request.user.is_authenticated:
            logger.error("ОШИБКА: Пользователь не аутентифицирован!")
            return Response({"error": "Требуется аутентификация", "detail": "Неверные учетные данные"}, 
                            status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            # Проверяем, что пользователь является креатором
            if not hasattr(request.user, 'creator_profile'):
                return Response(
                    {"error": "Только креаторы могут создавать отклики на заказы."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Получаем заказ по его ID
            try:
                order = Order.objects.get(pk=order_id)
            except Order.DoesNotExist:
                return Response(
                    {"error": f"Заказ с ID {order_id} не найден."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Получаем клиента и креатора
            client = order.client
            creator = request.user
            
            # Проверяем, что креатор не является также клиентом
            if client == creator:
                return Response(
                    {"error": "Вы не можете откликнуться на свой собственный заказ."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Проверяем, существует ли уже отклик от этого креатора
            existing_response = OrderResponse.objects.filter(order=order, creator=creator).first()
            if existing_response:
                # Если отклик уже существует, возвращаем информацию о нём
                serializer = OrderResponseSerializer(existing_response)
                return Response(serializer.data)
            
            # Проверяем, существует ли уже чат между этими пользователями для этого заказа
            logger.info("Поиск существующего чата между клиентом %s и креатором %s для заказа %s", client.id, creator.id, order.id)
            # Сначала ищем чат для этого заказа
            chat = Chat.objects.filter(
                client=client,
                creator=creator,
                order=order
            ).first()
            
            # Если не нашли, ищем любой чат между этими пользователями
            if not chat:
                logger.info("Чат для этого заказа не найден, ищем любой чат между пользователями")
                chat = Chat.objects.filter(
                    client=client,
                    creator=creator
                ).first()
            
            # Если чата нет, создаем его
            if not chat:
                logger.info("Создание нового чата между клиентом %s и креатором %s", client.id, creator.id)
                try:
                    chat = Chat.objects.create(
                        client=client,
                        creator=creator,
                        order=order  # Сразу связываем с заказом
                    )
                    logger.info("Чат успешно создан, ID: %s", chat.id)
                except Exception as e:
                    logger.error("Ошибка при создании чата: %s", str(e))
                    return Response({"error": f"Не удалось создать чат: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            # Если чат есть, но не связан с заказом, связываем
            elif not chat.order:
                chat.order = order
                chat.save()
            
            # Создаем отклик
            price = request.data.get('price', order.budget)  # По умолчанию цена равна бюджету заказа
            message = request.data.get('message', 'Я заинтересован в выполнении этого заказа')
            timeframe = request.data.get('timeframe', 7)  # По умолчанию срок выполнения 7 дней
            
            # Создаем отклик
            logger.info("Создание отклика на заказ: %s", order.id)
            try:
                order_response = OrderResponse.objects.create(
                    order=order,
                    creator=creator,
                    price=price,
                    message=message,
                    timeframe=timeframe
                )
                logger.info("Отклик успешно создан, ID: %s", order_response.id)
                
                # Автоматически назначаем креатора на заказ
                logger.info("Автоматическое назначение креатора %s на заказ %s", creator.id, order.id)
                order.creator = creator
                order.target_creator = creator
                if order.status in ['published', 'awaiting_response']:
                    order.status = 'in_progress'
                    logger.info("Обновление статуса заказа на 'in_progress'")
                order.save()
                logger.info("Креатор успешно назначен на заказ")
            except Exception as e:
                logger.error("Ошибка при создании отклика на заказ: %s", str(e))
                return Response({"error": f"Не удалось создать отклик: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Добавляем системное сообщение в чат
            logger.info("Создание системного сообщения в чате: %s", chat.id)
            try:
                # Подробное логирование всех аргументов
                logger.info("Аргументы для создания системного сообщения:")
                logger.info("  - chat.id: %s", chat.id if chat else "None")
                logger.info("  - content: %s", f"Создан отклик на заказ '{order.title}'")
                logger.info("  - is_system_message: %s", True)
                logger.info("  - sender: %s", None)
                
                system_message = Message.objects.create(
                    chat=chat,
                    content=f"Создан отклик на заказ '{order.title}'",
                    is_system_message=True,
                    sender=None  # Системное сообщение не имеет отправителя
                )
                logger.info("Системное сообщение успешно создано, ID: %s", system_message.id)
            except Exception as e:
                # Логируем подробную информацию об ошибке, но позволяем процессу продолжиться
                logger.error("Ошибка при создании системного сообщения: %s", str(e))
                import traceback
                logger.error("Трассировка стека: %s", traceback.format_exc())
                # Не прерываем процесс создания отклика
            
            # Возвращаем информацию о созданном отклике
            serializer = OrderResponseSerializer(order_response)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Логируем ошибку для отладки
            logger.error(f"Ошибка при создании отклика на заказ: {str(e)}")
            return Response(
                {"error": f"Произошла ошибка при создании отклика: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
