"""
Представления для приложения users.
"""

import logging

from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.db.models import Count, Min, Value, DecimalField, Q
from django.db.models.functions import Coalesce
from rest_framework import status, viewsets, generics, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import ValidationError

from .models import (
    User,
    ClientProfile,
    CreatorProfile,
    PortfolioItem,
    PortfolioImage,
    Service,
)
from .serializers import (
    UserSerializer,
    UserRegisterSerializer,
    ClientProfileSerializer,
    CreatorProfileSerializer,
    CreatorProfileDetailSerializer,
    CreatorProfileListSerializer,
    EmailVerificationSerializer,
    PortfolioItemSerializer,
    PortfolioImageSerializer,
    ServiceSerializer,
)
from .tokens import email_verification_token
from .utils import send_verification_email

logger = logging.getLogger("django")


# ──────────────────────── helpers / permissions ────────────────────────
class IsProfileOwner(permissions.BasePermission):
    """Разрешение — владелец объекта = текущий пользователь."""

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "creator_profile"):
            return obj.creator_profile.user == request.user
        if hasattr(obj, "user"):
            return obj.user == request.user
        return False


class IsVerifiedUser(permissions.BasePermission):
    """Разрешение — пользователь должен иметь подтвержденный email."""

    def has_permission(self, request, view):
        # Проверяем, что пользователь аутентифицирован и имеет подтвержденный email
        is_authenticated = request.user and request.user.is_authenticated
        # Проверка на методы, которые не требуют верификации (например, GET для просмотра)
        safe_methods = request.method in permissions.SAFE_METHODS
        
        # Если запрос на чтение данных, то верификация не требуется
        if safe_methods:
            return is_authenticated
        
        # Для методов изменения данных нужна верификация
        return is_authenticated and request.user.is_verified

    def has_object_permission(self, request, view, obj):
        # Для методов чтения верификация не требуется
        if request.method in permissions.SAFE_METHODS:
            return True
        # Для методов изменения требуется верификация
        return request.user.is_verified


# ────────────────────────── текущее «я» ──────────────────────────
class CurrentCreatorProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CreatorProfileDetailSerializer

    def get_object(self):
        try:
            return self.request.user.creator_profile
        except CreatorProfile.DoesNotExist as exc:  # pragma: no cover
            from django.http import Http404

            raise Http404("У вас нет профиля креатора") from exc


class CurrentClientProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ClientProfileSerializer

    def get_object(self):
        try:
            return self.request.user.client_profile
        except ClientProfile.DoesNotExist as exc:
            from django.http import Http404

            raise Http404("У вас нет профиля клиента") from exc


class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


# ───────────────────── регистрация / почта ─────────────────────
class UserRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegisterSerializer

    def create(self, request, *args, **kwargs):
        logger.info("Регистрация: входящие данные %s", request.data)

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # Возвращаем подробные ошибки валидации
            detailed_errors = {}
            for field, errors in serializer.errors.items():
                detailed_errors[field] = [str(error) for error in errors]
            return Response(
                {
                    "error": "Ошибка при регистрации пользователя",
                    "details": detailed_errors
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Используем транзакцию для гарантии атомарности операции
        from django.db import transaction
        try:
            with transaction.atomic():
                user = serializer.save()
                send_verification_email(user, request)

            return Response(
                {
                    "message": (
                        "Пользователь успешно зарегистрирован. "
                        "Проверьте email для верификации аккаунта."
                    ),
                    "user": UserSerializer(user, context=self.get_serializer_context()).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Ошибка при регистрации пользователя: {e}")
            return Response(
                {
                    "error": "Ошибка при регистрации пользователя",
                    "details": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class EmailVerificationView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = EmailVerificationSerializer
    template_name = 'users/email_verified.html'  # Шаблон для успешного подтверждения
    error_template_name = 'users/email_verification_error.html'  # Шаблон для ошибок

    def get(self, request, uidb64, token):
        # Определяем URL для перенаправления на страницу логина
        frontend_url = request.build_absolute_uri('/').rstrip('/')
        if '/api' in frontend_url:
            frontend_url = frontend_url.split('/api')[0]
        login_url = f"{frontend_url}/login"
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            # Рендерим HTML-шаблон с ошибкой
            from django.shortcuts import render
            return render(request, self.error_template_name, {
                'error_message': "Недействительный пользователь. Возможно, ссылка повреждена или некорректна.",
                'login_url': login_url
            })

        if not email_verification_token.check_token(user, token):
            # Рендерим HTML-шаблон с ошибкой
            from django.shortcuts import render
            return render(request, self.error_template_name, {
                'error_message': "Недействительная или устаревшая ссылка для верификации.",
                'login_url': login_url
            })

        if not user.is_verified:
            user.is_verified = True
            user.is_active = True
            user.save(update_fields=["is_verified", "is_active"])

        # Определяем URL для перенаправления на профиль
        # Получаем базовый URL без /api
        frontend_url = request.build_absolute_uri('/').rstrip('/')
        # Если URL содержит /api, удаляем эту часть
        if '/api' in frontend_url:
            frontend_url = frontend_url.split('/api')[0]
            
        # Определяем тип профиля пользователя (клиент или креатор)
        try:
            if hasattr(user, 'creator_profile'):
                profile_url = f"{frontend_url}/creator-profile"
            else:
                # По умолчанию используем клиентский профиль
                profile_url = f"{frontend_url}/client-profile"
        except Exception:
            # В случае ошибки используем общий профиль
            profile_url = f"{frontend_url}/login"
        
        # Возвращаем HTML страницу вместо простого JSON ответа
        from django.shortcuts import render
        from django.http import HttpResponse
        
        context = {
            'user': user,
            'profile_url': profile_url,
        }
        
        return render(request, self.template_name, context)


# ───────────────────────────── users ─────────────────────────────
class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()

    @action(detail=False, methods=["get", "put", "patch"])
    def me(self, request):
        user = request.user

        if request.method == "GET":
            return Response(self.get_serializer(user).data)

        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ─────────────────────── client profiles ───────────────────────
class ClientProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ClientProfileSerializer
    permission_classes = [IsAuthenticated]
    queryset = ClientProfile.objects.all()

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        raise ValidationError(
            "Профиль клиента создаётся автоматически. Используйте PATCH для обновления."
        )

    def partial_update(self, request, *args, **kwargs):
        profile, _ = ClientProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


# ─────────────────────── creator profiles ───────────────────────
class CreatorProfileViewSet(viewsets.ModelViewSet):
    """
    CRUD для профилей креаторов:
    - оптимизированный список,
    - полные данные,
    - точка `/me/` для собственного профиля.
    """

    serializer_class = CreatorProfileSerializer
    permission_classes = [IsAuthenticated, IsVerifiedUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    queryset = CreatorProfile.objects.all()

    # ------ helpers -------------------------------------------------
    def get_serializer_class(self):
        if self.action == "list":
            return CreatorProfileListSerializer
        if self.action in ("retrieve", "retrieve_detail"):
            return CreatorProfileDetailSerializer
        return self.serializer_class

    def get_queryset(self):
        qs = (
            CreatorProfile.objects.select_related("user")
            .prefetch_related("tags", "portfolio_items", "social_links")
            .annotate(
                services_count=Count("services", distinct=True),
                base_price=Coalesce(
                    Min("services__price"),
                    Value(0),
                    output_field=DecimalField(),
                ),
            )
            .order_by("id")
        )

        user_id = self.request.query_params.get("user_id")
        if user_id:
            qs = qs.filter(user__id=user_id)
            
        # Добавляем поиск по имени, email или полному имени
        search_query = self.request.query_params.get("search")
        if search_query:
            # Логируем поисковый запрос для отладки
            logger.debug(f"Поисковый запрос: {search_query}")
            
            # Разделяем поисковый запрос на слова для поиска по отдельным частям имени и фамилии
            search_words = search_query.split()
            
            # Создаем начальный пустой Q-объект
            query_filter = Q()
            
            # Добавляем фильтр для полного поискового запроса
            query_filter |= Q(user__username__icontains=search_query)
            query_filter |= Q(user__email__icontains=search_query)
            query_filter |= Q(nickname__icontains=search_query)
            query_filter |= Q(specialization__icontains=search_query)
            
            # Если запрос состоит из нескольких слов, проверяем каждое слово отдельно
            # для полей first_name и last_name
            for word in search_words:
                query_filter |= Q(user__first_name__icontains=word)
                query_filter |= Q(user__last_name__icontains=word)
            
            # Применяем фильтры к запросу
            qs = qs.filter(query_filter)
            
            # Логируем количество найденных результатов
            logger.debug(f"Найдено креаторов по запросу '{search_query}': {qs.count()}")
            
        # Получаем параметры запроса для фильтрации по тегам
        tag_ids_param = self.request.query_params.get('tag_ids')
        tag_match_type = self.request.query_params.get('tag_match_type', 'any').lower()

        # Если указаны ID тегов, применяем фильтрацию
        if tag_ids_param:
            try:
                tag_ids = [int(tag_id.strip()) for tag_id in tag_ids_param.split(',') if tag_id.strip()]
                
                if tag_ids:
                    if tag_match_type == 'all':
                        # Фильтрация по всем указанным тегам (AND)
                        # Аннотируем количество совпадающих тегов и фильтруем по этому количеству
                        qs = qs.annotate(
                            matching_tags_count=Count('tags', filter=Q(tags__id__in=tag_ids), distinct=True)
                        ).filter(matching_tags_count=len(tag_ids))
                    else:  # 'any' или любое другое значение
                        # Фильтрация по любому из указанных тегов (OR)
                        qs = qs.filter(tags__id__in=tag_ids).distinct()
            except ValueError:
                # Если в параметре tag_ids передано некорректное значение, игнорируем фильтрацию
                pass
                
        return qs

    # ------ actions -------------------------------------------------
    @action(detail=False, methods=["get", "post", "put", "patch"])
    def me(self, request):
        user = request.user
        detail = request.query_params.get("detail", "false").lower() == "true"
        serializer_cls = CreatorProfileDetailSerializer if detail else self.get_serializer_class()

        try:
            profile = user.creator_profile
        except CreatorProfile.DoesNotExist:
            profile = None

        if request.method == "GET":
            if profile:
                return Response(serializer_cls(profile, context={"request": request}).data)
            return Response({"message": "Профиль креатора не найден"}, status=status.HTTP_404_NOT_FOUND)

        if request.method == "POST" and not profile:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        if profile:  # PUT / PATCH
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            if "is_online" in request.data:
                profile.is_online = str(request.data["is_online"]).lower() in ("true", "1")
                profile.save(update_fields=["is_online"])

            return Response(serializer.data)

        return Response({"error": "Профиль креатора не найден"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["get"])
    def retrieve_detail(self, request, pk=None):
        instance = self.get_object()
        serializer = CreatorProfileDetailSerializer(instance, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        instance = self.get_object()

        if instance.user != request.user:
            return Response(
                {"error": "Вы не можете изменять чужой профиль"},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = {}
        if "is_online" in request.data:
            instance.is_online = str(request.data["is_online"]).lower() in ("true", "1")
            data["is_online"] = instance.is_online

        if "available_for_hire" in request.data:
            instance.available_for_hire = str(request.data["available_for_hire"]).lower() in ("true", "1")
            data["available_for_hire"] = instance.available_for_hire

        if data:
            instance.save(update_fields=list(data.keys()))
        return Response(data)


# ─────────────────────── portfolio items ───────────────────────
class PortfolioItemViewSet(viewsets.ModelViewSet):
    """Portfolio items management."""

    queryset = PortfolioItem.objects.all()
    serializer_class = PortfolioItemSerializer
    permission_classes = [IsAuthenticated, IsProfileOwner, IsVerifiedUser]
    filterset_fields = ['creator_profile']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        """
        Переопределение метода create для отладки ошибок валидации
        """
        import logging
        import json
        logger = logging.getLogger('django.request')
        
        logger.debug(f"\n\n=== Данные запроса PortfolioItemViewSet ===\n")
        logger.debug(f"Request method: {request.method}\n")
        logger.debug(f"Content-Type: {request.content_type}\n")
        logger.debug(f"Request FILES: {request.FILES}\n")
        logger.debug(f"Request DATA: {request.data}\n")
        
        # Создаём экземпляр сериализатора
        serializer = self.get_serializer(data=request.data)
        
        # Проверяем валидацию
        if not serializer.is_valid():
            logger.debug(f"\n\n=== Ошибки валидации ===\n")
            logger.debug(f"Validation errors: {serializer.errors}\n\n")
            
            # Дополнительная проверка полей
            if 'cover_image' in serializer.errors:
                logger.debug(f"Cover image errors: {serializer.errors['cover_image']}\n")
                if 'cover_image' in request.FILES:
                    cover_img = request.FILES['cover_image']
                    logger.debug(f"Cover image details: name={cover_img.name}, size={cover_img.size}, content_type={cover_img.content_type}\n")
                else:
                    logger.debug("Cover image not found in FILES\n")
            
        # Вызываем родительский метод
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        user = self.request.user
        creator_profile_id = self.request.query_params.get("creator_profile_id")

        if creator_profile_id:
            qs = PortfolioItem.objects.filter(creator_profile_id=creator_profile_id)
            if str(creator_profile_id) != str(getattr(user.creator_profile, "id", None)):
                return qs.filter(creator_profile__user__is_active=True)
            return qs

        if user.is_authenticated and hasattr(user, "creator_profile"):
            return PortfolioItem.objects.filter(creator_profile=user.creator_profile)

        return PortfolioItem.objects.filter(creator_profile__user__is_active=True)

    def perform_create(self, serializer):
        try:
            creator_profile = self.request.user.creator_profile
        except CreatorProfile.DoesNotExist:
            raise ValidationError("У вас нет профиля креатора")

        serializer.save(creator_profile=creator_profile)


# ───────────────────── portfolio images ─────────────────────
class PortfolioImageViewSet(viewsets.ModelViewSet):
    serializer_class = PortfolioImageSerializer
    permission_classes = [IsAuthenticated, IsProfileOwner]
    parser_classes = [MultiPartParser, FormParser]
    queryset = PortfolioImage.objects.select_related(
        "portfolio_item__creator_profile__user"
    )

    def get_queryset(self):
        qs = self.queryset
        portfolio_item_id = self.request.query_params.get("portfolio_item")

        if portfolio_item_id:
            qs = qs.filter(portfolio_item_id=portfolio_item_id)

        user = self.request.user
        if user.is_authenticated and hasattr(user, "creator_profile"):
            return qs.filter(
                portfolio_item__creator_profile__in=[user.creator_profile]
            ) | qs.filter(portfolio_item__creator_profile__user__is_active=True)

        return qs.filter(portfolio_item__creator_profile__user__is_active=True)

    def perform_create(self, serializer):
        portfolio_item_id = self.request.data.get("portfolio_item")
        try:
            portfolio_item = PortfolioItem.objects.get(pk=portfolio_item_id)
        except PortfolioItem.DoesNotExist:
            raise ValidationError("Указанный элемент портфолио не существует")

        if portfolio_item.creator_profile.user != self.request.user:
            raise ValidationError("Вы не можете добавлять изображения к чужому портфолио")

        serializer.save(portfolio_item=portfolio_item)


# ───────────────────────── services ─────────────────────────
class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated, IsVerifiedUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = Service.objects.all()

    def get_queryset(self):
        qs = Service.objects.filter(is_active=True)
        creator_id = self.request.query_params.get("creator_id")
        creator_profile_id = self.request.query_params.get("creator_profile_id")

        if creator_id:
            qs = qs.filter(creator_profile__user_id=creator_id)
        if creator_profile_id:
            qs = qs.filter(creator_profile_id=creator_profile_id)

        user = self.request.user
        if user.is_authenticated and hasattr(user, "creator_profile"):
            if not (creator_id or creator_profile_id) or str(creator_id) == str(user.id) or str(
                creator_profile_id
            ) == str(user.creator_profile.id):
                return Service.objects.filter(creator_profile=user.creator_profile)

        return qs

    def perform_create(self, serializer):
        if "creator_profile" not in serializer.validated_data:
            try:
                creator_profile = self.request.user.creator_profile
            except CreatorProfile.DoesNotExist:
                raise ValidationError({"creator_profile": "У вас нет профиля креатора"})

            serializer.save(creator_profile=creator_profile)
        else:
            serializer.save()

    @action(detail=False, methods=["get"])
    def my_services(self, request):
        if not hasattr(request.user, "creator_profile"):
            return Response(
                {"error": "У вас нет профиля креатора"}, status=status.HTTP_400_BAD_REQUEST
            )

        services = Service.objects.filter(creator_profile=request.user.creator_profile)
        return Response(self.get_serializer(services, many=True).data)
