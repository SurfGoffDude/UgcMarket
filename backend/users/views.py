"""
Представления для приложения users.

Содержит классы представлений для работы с пользователями.
"""

from django.shortcuts import get_object_or_404
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.db.models import Q
from rest_framework import status, viewsets, generics, permissions, filters
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import (
    User, ClientProfile, CreatorProfile, 
    Skill, CreatorSkill, PortfolioItem, PortfolioImage, Service
)
from .serializers import (
    UserSerializer, UserRegisterSerializer, ClientProfileSerializer,
    CreatorProfileSerializer, EmailVerificationSerializer,
    SkillSerializer, CreatorSkillSerializer, PortfolioItemSerializer,
    PortfolioImageSerializer, CreatorProfileDetailSerializer, ServiceSerializer
)
from .tokens import email_verification_token
from .utils import send_verification_email


import logging

# Получаем логгер Django
logger = logging.getLogger('django')


class CurrentCreatorProfileView(generics.RetrieveUpdateAPIView):
    """
    Представление для получения и обновления профиля текущего креатора.
    
    Предоставляет прямой доступ к профилю креатора текущего пользователя
    без необходимости указывать ID профиля.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CreatorProfileDetailSerializer
    
    def get_object(self):
        """
        Возвращает профиль креатора текущего пользователя
        или 404, если профиль не существует.
        """
        try:
            return self.request.user.creator_profile
        except CreatorProfile.DoesNotExist:
            from django.http import Http404
            raise Http404("У вас нет профиля креатора")


class CurrentClientProfileView(generics.RetrieveUpdateAPIView):
    """
    Представление для получения и обновления профиля текущего клиента.
    
    Предоставляет прямой доступ к профилю клиента текущего пользователя
    без необходимости указывать ID профиля.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ClientProfileSerializer
    
    def get_object(self):
        """
        Возвращает профиль клиента текущего пользователя
        или 404, если профиль не существует.
        """
        try:
            return self.request.user.client_profile
        except ClientProfile.DoesNotExist:
            from django.http import Http404
            raise Http404("У вас нет профиля клиента")



class CurrentUserView(generics.RetrieveAPIView):
    """
    Представление для получения данных текущего аутентифицированного пользователя.
    
    Возвращает информацию о текущем пользователе на основе JWT токена.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        """
        Возвращает текущего пользователя.
        
        Returns:
            User: объект текущего пользователя
        """
        return self.request.user

class UserRegistrationView(generics.CreateAPIView):
    """
    Представление для регистрации нового пользователя.
    
    При успешной регистрации создается новый пользователь и отправляется
    письмо с верификацией на указанный email.
    """
    permission_classes = [AllowAny]
    serializer_class = UserRegisterSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Создает нового пользователя и отправляет письмо для верификации.
        
        Args:
            request: HTTP запрос с данными нового пользователя
            
        Returns:
            Response: Ответ с созданными данными пользователя или с ошибками валидации
        """
        logger.info(f"=== Начало обработки запроса на регистрацию пользователя ===")
        logger.info(f"Получены данные: {request.data}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Метод запроса: {request.method}")
        logger.info(f"IP пользователя: {request.META.get('REMOTE_ADDR')}")
        
        try:
            logger.info("Начало валидации данных")
            serializer = self.get_serializer(data=request.data)
            
            if not serializer.is_valid():
                logger.warning(f"Ошибки валидации: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info("Валидация данных успешна, создание пользователя")
            user = serializer.save()
            logger.info(f"Пользователь успешно создан: {user.username} (ID: {user.id})")
            
            # Отправляем письмо с верификацией
            logger.info(f"Отправка письма верификации на {user.email}")
            send_verification_email(user, request)
            logger.info("Письмо верификации успешно отправлено")
            
            # Возвращаем информацию о созданном пользователе
            logger.info("Формирование успешного ответа")
            return Response({
                'message': 'Пользователь успешно зарегистрирован. Проверьте email для верификации аккаунта.',
                'user': UserSerializer(user, context=self.get_serializer_context()).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Необработанная ошибка при регистрации пользователя: {str(e)}", exc_info=True)
            logger.error(f"Тип ошибки: {type(e).__name__}")
            logger.error(f"Детали запроса: {request.data}")
            
            # Формируем подробный ответ об ошибке
            error_message = f"Ошибка при регистрации: {str(e)}"
            logger.info(f"Отправка ответа с ошибкой: {error_message}")
            
            return Response({
                'error': error_message,
                'error_type': type(e).__name__
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailVerificationView(generics.GenericAPIView):
    """
    Представление для подтверждения email адреса пользователя.
    """
    permission_classes = [AllowAny]
    serializer_class = EmailVerificationSerializer
    
    def get(self, request, uidb64, token):
        """
        Обрабатывает запрос верификации email по ссылке из письма.
        
        Args:
            request: HTTP запрос
            uidb64 (str): Кодированный ID пользователя
            token (str): Токен верификации
            
        Returns:
            Response: Ответ с результатом верификации
        """
        logger.info(f"=== Процесс верификации email ===")
        logger.info(f"uidb64: {uidb64}, token: {token}")
        
        try:
            # Декодируем uid пользователя
            uid = force_str(urlsafe_base64_decode(uidb64))
            logger.info(f"Декодированный uid: {uid}")
            
            user = User.objects.get(pk=uid)
            logger.info(f"Найден пользователь: {user.username} (ID: {user.id})")
            logger.info(f"Статус верификации: is_verified={user.is_verified}")
        except (TypeError, ValueError, OverflowError) as e:
            logger.error(f"Ошибка при декодировании uidb64: {str(e)}")
            user = None
        except User.DoesNotExist:
            logger.error(f"Пользователь с uid {uid} не найден")
            user = None
        
        # Проверяем токен и проводим активацию пользователя
        if user is None:
            logger.error("Пользователь не найден")
            return Response({
                'error': 'Недействительная ссылка для верификации'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token_valid = email_verification_token.check_token(user, token)
        logger.info(f"Проверка токена: {token_valid}")
        
        if token_valid:
            if user.is_verified:
                logger.info("Пользователь уже подтвержден")
                return Response({
                    'message': 'Email уже подтвержден'
                }, status=status.HTTP_200_OK)
            
            # Активируем пользователя
            user.is_verified = True
            user.is_active = True  # Активируем учетную запись для возможности входа в систему
            user.save()
            logger.info(f"Пользователь {user.username} успешно активирован, is_active=True, is_verified=True")
            
            return Response({
                'message': 'Email успешно подтвержден'
            }, status=status.HTTP_200_OK)
        else:
            logger.warning("Недействительный токен верификации")
            return Response({
                'error': 'Недействительная ссылка для верификации'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с пользователями.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """
        Получение и обновление информации о текущем пользователе.
        
        Args:
            request: HTTP запрос
            
        Returns:
            Response: Ответ с данными текущего пользователя или обновленными данными
        """
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        # Обновление информации пользователя (PUT или PATCH)
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)


class ClientProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления профилями клиентов.
    
    Предоставляет CRUD операции для профилей клиентов.
    """
    queryset = ClientProfile.objects.all()
    serializer_class = ClientProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Фильтрует профили, чтобы пользователи могли видеть только свои.
        Администраторы видят все профили.
        """
        user = self.request.user
        if user.is_staff:
            return ClientProfile.objects.all()
        # Пользователь может видеть/редактировать только свой профиль
        return ClientProfile.objects.filter(user=user)

    def perform_create(self, serializer):
        """
        Запрещает создание профиля через POST, так как он создается автоматически.
        """
        from rest_framework.exceptions import MethodNotAllowed
        raise MethodNotAllowed('POST', detail="Профиль клиента создается автоматически, используйте PATCH для обновления.")

    def partial_update(self, request, *args, **kwargs):
        """
        Частично обновляет профиль клиента для текущего пользователя.
        
        Использует get_or_create для создания профиля, если он не существует.
        Игнорирует 'pk' из URL для повышения надежности.
        """
        # Мы игнорируем 'pk' из URL и всегда работаем с профилем текущего пользователя
        profile, created = ClientProfile.objects.get_or_create(user=request.user)
        if created:
            logger.info(f"Создан новый профиль клиента для пользователя {request.user.username} при попытке обновления.")

        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)



class CreatorProfileViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с профилем креатора.
    
    Предоставляет CRUD функциональность для управления профилями креаторов.
    Поддерживает все поля профиля, включая псевдоним, обложку профиля, статус онлайн,
    доступность для заказов и среднее время ответа.
    """
    queryset = CreatorProfile.objects.all()
    serializer_class = CreatorProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        """
        Возвращает соответствующий сериализатор в зависимости от действия.
        """
        detail = self.request.query_params.get('detail', 'false').lower() == 'true'
        if detail or self.action == 'retrieve_detail':
            return CreatorProfileDetailSerializer
        return CreatorProfileSerializer
    
    @action(detail=False, methods=['get', 'post', 'put', 'patch'])
    def me(self, request):
        """
        Получение, создание и обновление профиля текущего пользователя-креатора.
        
        Поддерживает загрузку файлов для полей avatar и cover_image.
        Обрабатывает все поля профиля креатора, включая новые поля: nickname, cover_image,
        is_online, available_for_hire и average_response_time.
        
        Args:
            request: HTTP запрос
            
        Returns:
            Response: Ответ с данными профиля или обновленными данными
        """
        user = request.user
        detail = request.query_params.get('detail', 'false').lower() == 'true'
        serializer_class = CreatorProfileDetailSerializer if detail else self.get_serializer_class()
        
        # Проверяем, существует ли профиль креатора для текущего пользователя
        profile = None
        try:
            profile = user.creator_profile
        except CreatorProfile.DoesNotExist:
            pass
        
        if request.method == 'GET':
            if profile:
                serializer = serializer_class(profile, context={'request': request})
                return Response(serializer.data)
            else:
                return Response({
                    'message': 'Профиль креатора не найден'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Создание профиля креатора, если его нет
        if request.method == 'POST' and not profile:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # Обновление существующего профиля (PUT или PATCH)
        if profile:
            # Обрабатываем загрузку файлов и JSON данные
            data = request.data.copy()
            
            # Логируем полученные данные для отладки
            logger.debug(f"Updating creator profile with data: {data}")
            
            serializer = self.get_serializer(profile, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            # После сохранения обновляем статус онлайн
            if 'is_online' in data:
                profile.is_online = data.get('is_online') in ['true', True, 1, '1']
                profile.save(update_fields=['is_online'])
                
            return Response(serializer.data)
        
        return Response({
            'error': 'Профиль креатора не найден'
        }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def retrieve_detail(self, request, pk=None):
        """
        Получение детальной информации о профиле креатора.
        
        Включает все поля профиля, включая навыки, портфолио и отзывы.
        """
        instance = self.get_object()
        serializer = CreatorProfileDetailSerializer(instance, context={'request': request})
        return Response(serializer.data)
        
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Обновление статуса креатора (онлайн/оффлайн, доступность для заказов).
        
        Позволяет быстро обновить статус без отправки всех данных профиля.
        
        Args:
            request: HTTP запрос с полями is_online и/или available_for_hire
            pk: ID профиля креатора
            
        Returns:
            Response: Обновленный статус профиля
        """
        instance = self.get_object()
        
        # Проверяем, что пользователь может редактировать этот профиль
        if instance.user != request.user:
            return Response({'error': 'Вы не можете изменять чужой профиль'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Обновляем только поля статуса
        data = {}
        if 'is_online' in request.data:
            instance.is_online = request.data.get('is_online') in ['true', True, 1, '1']
            data['is_online'] = instance.is_online
            
        if 'available_for_hire' in request.data:
            instance.available_for_hire = request.data.get('available_for_hire') in ['true', True, 1, '1']
            data['available_for_hire'] = instance.available_for_hire
            
        if data:
            instance.save(update_fields=list(data.keys()))
            
        return Response(data)

class SkillViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с навыками.
    
    Предоставляет возможность просмотра и поиска навыков.
    """
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']


class IsProfileOwner(permissions.BasePermission):
    """
    Разрешение, проверяющее что пользователь работает со своим профилем.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Проверяем, что объект принадлежит текущему пользователю
        if hasattr(obj, 'creator_profile'):
            return obj.creator_profile.user == request.user
        return False


class CreatorSkillViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с навыками креатора.
    
    Предоставляет CRUD функциональность для управления навыками профиля креатора.
    """
    queryset = CreatorSkill.objects.all()
    serializer_class = CreatorSkillSerializer
    permission_classes = [IsAuthenticated, IsProfileOwner]
    
    def get_queryset(self):
        """
        Фильтрует результаты, возвращая только навыки текущего пользователя.
        """
        if not self.request.user.is_authenticated:
            return CreatorSkill.objects.none()
        
        # Если указан creator_profile_id, фильтруем по нему
        creator_profile_id = self.request.query_params.get('creator_profile_id')
        if creator_profile_id:
            queryset = CreatorSkill.objects.filter(creator_profile_id=creator_profile_id)
            # Проверяем, что профиль принадлежит текущему пользователю или профиль публичный
            if str(creator_profile_id) != str(getattr(self.request.user.creator_profile, 'id', None)):
                return queryset.filter(creator_profile__user__is_active=True)
            return queryset
        
        # Если creator_profile_id не указан, возвращаем навыки текущего пользователя
        try:
            if hasattr(self.request.user, 'creator_profile'):
                return CreatorSkill.objects.filter(creator_profile=self.request.user.creator_profile)
        except CreatorProfile.DoesNotExist:
            return CreatorSkill.objects.none()
        
        return CreatorSkill.objects.none()
    
    def perform_create(self, serializer):
        """
        Устанавливает профиль креатора при создании навыка.
        """
        # Проверяем, есть ли у пользователя профиль креатора
        try:
            creator_profile = self.request.user.creator_profile
        except CreatorProfile.DoesNotExist:
            raise ValidationError("У вас нет профиля креатора")
        
        serializer.save(creator_profile=creator_profile)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """
        Обновляет или создает несколько навыков за один запрос.
        
        Ожидаемый формат данных:
        [
            {"skill_id": 1, "level": 3},
            {"skill_id": 2, "level": 5},
            ...
        ]
        """
        # Проверяем, есть ли у пользователя профиль креатора
        try:
            creator_profile = request.user.creator_profile
        except CreatorProfile.DoesNotExist:
            return Response(
                {"error": "У вас нет профиля креатора"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        skills_data = request.data
        if not isinstance(skills_data, list):
            return Response(
                {"error": "Данные должны быть в формате списка"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = []
        for skill_data in skills_data:
            skill_id = skill_data.get("skill_id")
            level = skill_data.get("level")
            
            if not skill_id or not level:
                return Response(
                    {"error": "Каждая запись должна содержать skill_id и level"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Проверяем, существует ли навык
            try:
                skill = Skill.objects.get(pk=skill_id)
            except Skill.DoesNotExist:
                return Response(
                    {"error": f"Навык с ID {skill_id} не найден"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Создаем или обновляем навык креатора
            creator_skill, created = CreatorSkill.objects.update_or_create(
                creator_profile=creator_profile,
                skill=skill,
                defaults={"level": level}
            )
            
            result.append({
                "id": creator_skill.id,
                "skill_id": skill.id,
                "skill_name": skill.name,
                "level": creator_skill.level,
                "created": created
            })
        
        return Response(result, status=status.HTTP_200_OK)


class PortfolioItemViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с элементами портфолио креатора.
    
    Предоставляет CRUD функциональность для управления портфолио.
    """
    queryset = PortfolioItem.objects.all()
    serializer_class = PortfolioItemSerializer
    permission_classes = [IsAuthenticated, IsProfileOwner]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """
        Фильтрует результаты, возвращая элементы портфолио.
        """
        if not self.request.user.is_authenticated:
            # Для неавторизованных пользователей возвращаем портфолио активных пользователей
            return PortfolioItem.objects.filter(creator_profile__user__is_active=True)
        
        # Если указан creator_profile_id, фильтруем по нему
        creator_profile_id = self.request.query_params.get('creator_profile_id')
        if creator_profile_id:
            queryset = PortfolioItem.objects.filter(creator_profile_id=creator_profile_id)
            # Если это чужой профиль, проверяем его активность
            if str(creator_profile_id) != str(getattr(self.request.user.creator_profile, 'id', None)):
                return queryset.filter(creator_profile__user__is_active=True)
            return queryset
        
        # Если creator_profile_id не указан, возвращаем портфолио текущего пользователя
        try:
            if hasattr(self.request.user, 'creator_profile'):
                return PortfolioItem.objects.filter(creator_profile=self.request.user.creator_profile)
        except CreatorProfile.DoesNotExist:
            return PortfolioItem.objects.none()
        
        return PortfolioItem.objects.filter(creator_profile__user__is_active=True)
    
    def perform_create(self, serializer):
        """
        Устанавливает профиль креатора при создании элемента портфолио.
        """
        # Проверяем, есть ли у пользователя профиль креатора
        try:
            creator_profile = self.request.user.creator_profile
        except CreatorProfile.DoesNotExist:
            raise ValidationError("У вас нет профиля креатора")
        
        serializer.save(creator_profile=creator_profile)


class PortfolioImageViewSet(viewsets.ModelViewSet):
    """
    Представление для работы с изображениями элементов портфолио.
    
    Предоставляет CRUD функциональность для управления изображениями портфолио.
    """
    queryset = PortfolioImage.objects.all()
    serializer_class = PortfolioImageSerializer
    permission_classes = [IsAuthenticated, IsProfileOwner]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """
        Фильтрует результаты, возвращая только изображения портфолио текущего пользователя.
        """
        if not self.request.user.is_authenticated:
            return PortfolioImage.objects.none()
        
        # Если указан portfolio_item_id, фильтруем по нему
        portfolio_item_id = self.request.query_params.get('portfolio_item_id')
        if portfolio_item_id:
            queryset = PortfolioImage.objects.filter(portfolio_item_id=portfolio_item_id)
            # Проверяем, принадлежит ли элемент портфолио текущему пользователю
            try:
                portfolio_item = PortfolioItem.objects.get(id=portfolio_item_id)
                if portfolio_item.creator_profile.user != self.request.user:
                    # Для чужих элементов портфолио проверяем, активен ли пользователь
                    if portfolio_item.creator_profile.user.is_active:
                        return queryset
                    return PortfolioImage.objects.none()
                return queryset
            except PortfolioItem.DoesNotExist:
                return PortfolioImage.objects.none()
        
        # Возвращаем изображения элементов портфолио текущего пользователя
        try:
            if hasattr(self.request.user, 'creator_profile'):
                return PortfolioImage.objects.filter(
                    portfolio_item__creator_profile=self.request.user.creator_profile
                )
        except CreatorProfile.DoesNotExist:
            return PortfolioImage.objects.none()
        
        return PortfolioImage.objects.none()
    
    def perform_create(self, serializer):
        """
        Проверяет, что элемент портфолио принадлежит текущему пользователю.
        """
        portfolio_item_id = self.request.data.get('portfolio_item')
        
        try:
            portfolio_item = PortfolioItem.objects.get(pk=portfolio_item_id)
        except PortfolioItem.DoesNotExist:
            raise ValidationError("Указанный элемент портфолио не существует")
        
        # Проверяем, принадлежит ли элемент портфолио текущему пользователю
        if portfolio_item.creator_profile.user != self.request.user:
            raise ValidationError("Вы не можете добавить изображение к чужому портфолио")
        
        serializer.save(portfolio_item=portfolio_item)


class ServiceViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    """
    Представление для работы с услугами креаторов.
    
    Предоставляет CRUD функциональность для управления услугами креатора:
    создание, чтение, обновление и удаление услуг.
    """
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Фильтрует результаты, возвращая только услуги, доступные текущему пользователю.
        
        Если пользователь является креатором, то он видит только свои услуги.
        Для остальных пользователей доступны все активные услуги.
        """
        queryset = Service.objects.filter(is_active=True)
        
        # Получаем параметры запроса для фильтрации
        creator_id = self.request.query_params.get('creator_id')
        creator_profile_id = self.request.query_params.get('creator_profile_id')
        
        # Фильтруем по ID креатора
        if creator_id:
            queryset = queryset.filter(creator_profile__user_id=creator_id)
        
        # Или фильтруем по ID профиля креатора
        if creator_profile_id:
            queryset = queryset.filter(creator_profile_id=creator_profile_id)
        
        # Если пользователь является креатором, показываем все его услуги (включая неактивные)
        if self.request.user.is_authenticated and hasattr(self.request.user, 'creator_profile'):
            # Если запрошены услуги без фильтра или конкретно этого креатора
            if not (creator_id or creator_profile_id) or \
               (creator_id and int(creator_id) == self.request.user.id) or \
               (creator_profile_id and int(creator_profile_id) == self.request.user.creator_profile.id):
                return Service.objects.filter(creator_profile=self.request.user.creator_profile)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Устанавливает профиль креатора при создании услуги только если он не был указан в запросе.
        """
        # Проверяем наличие creator_profile в валидированных данных
        if 'creator_profile' not in serializer.validated_data:
            # Проверяем, есть ли у пользователя профиль креатора
            try:
                creator_profile = self.request.user.creator_profile
                serializer.save(creator_profile=creator_profile)
            except CreatorProfile.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"creator_profile": "У вас нет профиля креатора"})
        else:
            # Если creator_profile уже указан в запросе, просто сохраняем как есть
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def my_services(self, request):
        """
        Возвращает услуги, принадлежащие текущему пользователю-креатору.
        """
        if not hasattr(request.user, 'creator_profile'):
            return Response(
                {"error": "У вас нет профиля креатора"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        services = Service.objects.filter(creator_profile=request.user.creator_profile)
        serializer = self.get_serializer(services, many=True)
        return Response(serializer.data)