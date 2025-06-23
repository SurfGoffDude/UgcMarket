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
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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


class EmailVerificationView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = EmailVerificationSerializer

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Недействительная ссылка для верификации"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not email_verification_token.check_token(user, token):
            return Response(
                {"error": "Недействительная ссылка для верификации"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_verified:
            user.is_verified = True
            user.is_active = True
            user.save(update_fields=["is_verified", "is_active"])

        return Response({"message": "Email успешно подтвержден"})


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
    permission_classes = [IsAuthenticated]
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
    serializer_class = PortfolioItemSerializer
    permission_classes = [IsAuthenticated, IsProfileOwner]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = PortfolioItem.objects.all()

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
    permission_classes = [IsAuthenticated]
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
