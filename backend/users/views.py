"""
Представления для приложения users.
"""

import json
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
    FavoriteCreator,
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
    FavoriteCreatorSerializer,
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
    
    # Переопределяем стандартный метод partial_update
    def partial_update(self, request, *args, **kwargs):
        """
        Обновляет профиль креатора с поддержкой multipart/form-data.
        
        Поддерживает обработку вложенных JSON-полей и загрузку файлов.
        """
        import os
        from django.conf import settings
        
        instance = self.get_object()
        print(f"DEBUG - CreatorProfileViewSet.partial_update - начало обработки для профиля {instance.id}")
        
        # Отладка: проверяем тип запроса и наличие файлов
        print(f"DEBUG - CreatorProfileViewSet.partial_update - Content-Type: {request.content_type}")
        print(f"DEBUG - CreatorProfileViewSet.partial_update - Файлы в запросе: {request.FILES.keys()}")
        
        # Проверяем директорию для сохранения аватаров
        avatar_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
        print(f"DEBUG - CreatorProfileViewSet.partial_update - директория для аватаров: {avatar_dir}")
        print(f"DEBUG - CreatorProfileViewSet.partial_update - директория существует: {os.path.exists(avatar_dir)}")
        
        # Создаем директорию, если она не существует
        if not os.path.exists(avatar_dir):
            try:
                os.makedirs(avatar_dir)
                print(f"DEBUG - CreatorProfileViewSet.partial_update - создана директория: {avatar_dir}")
            except Exception as e:
                print(f"DEBUG - CreatorProfileViewSet.partial_update - ошибка при создании директории: {e}")
        
        # Проверяем права доступа к директории
        try:
            print(f"DEBUG - CreatorProfileViewSet.partial_update - права доступа к директории: {oct(os.stat(avatar_dir).st_mode)[-3:]}")
        except Exception as e:
            print(f"DEBUG - CreatorProfileViewSet.partial_update - ошибка при проверке прав доступа: {e}")
        
        # Обработка multipart/form-data с вложенными JSON-полями
        processed_data = {}
        
        # Обрабатываем обычные поля из request.data
        for key, value in request.data.items():
            # Обработка вложенных JSON-полей
            if key == 'user' and isinstance(value, str):
                try:
                    print(f"DEBUG - Десериализация user из строки JSON: {value}")
                    user_data = json.loads(value)
                    processed_data['user'] = user_data
                    
                    # Если аватар еще не добавлен в processed_data, добавляем его
                    if 'avatar' not in processed_data and 'user.avatar' in request.FILES:
                        processed_data['avatar'] = request.FILES['user.avatar']
                        print(f"DEBUG - Обработка user.avatar: {request.FILES['user.avatar']} (тип: {type(request.FILES['user.avatar'])}), размер: {request.FILES['user.avatar'].size} байт")
                except Exception as e:
                    print(f"DEBUG - Ошибка при десериализации user: {e}")
                    # Если не удалось десериализовать, передаем как есть
                    processed_data[key] = value
                    
                    # Если аватар еще не добавлен в processed_data, добавляем его
                    if 'avatar' not in processed_data and 'user.avatar' in request.FILES:
                        processed_data['avatar'] = request.FILES['user.avatar']
                        print(f"DEBUG - Обработка user.avatar: {request.FILES['user.avatar']} (тип: {type(request.FILES['user.avatar'])}), размер: {request.FILES['user.avatar'].size} байт")
            # Остальные поля передаем как есть
            else:
                processed_data[key] = value
        
        # Добавляем отладочную информацию для аватара и обрабатываем файлы
        if 'avatar' in request.FILES:
            print(f"DEBUG - CreatorProfileViewSet.partial_update - avatar в request.FILES: {request.FILES['avatar']}")
            print(f"DEBUG - CreatorProfileViewSet.partial_update - тип avatar: {type(request.FILES['avatar'])}")
            print(f"DEBUG - CreatorProfileViewSet.partial_update - размер avatar: {request.FILES['avatar'].size} байт")
            print(f"DEBUG - CreatorProfileViewSet.partial_update - имя файла: {request.FILES['avatar'].name}")
            print(f"DEBUG - CreatorProfileViewSet.partial_update - content_type: {request.FILES['avatar'].content_type}")
            processed_data['avatar'] = request.FILES['avatar']
        elif 'user.avatar' in request.FILES:
            print(f"DEBUG - CreatorProfileViewSet.partial_update - user.avatar в request.FILES: {request.FILES['user.avatar']}")
            print(f"DEBUG - CreatorProfileViewSet.partial_update - тип user.avatar: {type(request.FILES['user.avatar'])}")
            print(f"DEBUG - CreatorProfileViewSet.partial_update - размер user.avatar: {request.FILES['user.avatar'].size} байт")
            print(f"DEBUG - CreatorProfileViewSet.partial_update - имя файла: {request.FILES['user.avatar'].name}")
            print(f"DEBUG - CreatorProfileViewSet.partial_update - content_type: {request.FILES['user.avatar'].content_type}")
            processed_data['avatar'] = request.FILES['user.avatar']
            
            # Проверяем, что файл корректно читается
            try:
                file_content = request.FILES['user.avatar'].read(1024)  # Читаем первые 1024 байта для проверки
                print(f"DEBUG - CreatorProfileViewSet.partial_update - файл успешно прочитан, первые байты: {file_content[:20]}")
                request.FILES['user.avatar'].seek(0)  # Возвращаем указатель в начало файла
            except Exception as e:
                print(f"DEBUG - CreatorProfileViewSet.partial_update - ошибка при чтении файла: {e}")
                
            # Проверяем, что файл корректно открывается
            try:
                from PIL import Image
                img = Image.open(request.FILES['user.avatar'])
                print(f"DEBUG - CreatorProfileViewSet.partial_update - изображение успешно открыто, размер: {img.size}")
                request.FILES['user.avatar'].seek(0)  # Возвращаем указатель в начало файла
            except Exception as e:
                print(f"DEBUG - CreatorProfileViewSet.partial_update - ошибка при открытии изображения: {e}")
                
            # Проверяем, что файл корректно сохраняется
            try:
                from django.core.files.storage import default_storage
                from django.core.files.base import ContentFile
                path = default_storage.save(f"avatars/test_{request.FILES['user.avatar'].name}", ContentFile(request.FILES['user.avatar'].read()))
                print(f"DEBUG - CreatorProfileViewSet.partial_update - файл успешно сохранен по пути: {path}")
                request.FILES['user.avatar'].seek(0)  # Возвращаем указатель в начало файла
            except Exception as e:
                print(f"DEBUG - CreatorProfileViewSet.partial_update - ошибка при сохранении файла: {e}")
                
            # Проверяем, что файл корректно копируется
            try:
                import shutil
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False) as tmp:
                    shutil.copyfileobj(request.FILES['user.avatar'], tmp)
                    print(f"DEBUG - CreatorProfileViewSet.partial_update - файл успешно скопирован во временный файл: {tmp.name}")
                request.FILES['user.avatar'].seek(0)  # Возвращаем указатель в начало файла
            except Exception as e:
                print(f"DEBUG - CreatorProfileViewSet.partial_update - ошибка при копировании файла: {e}")
                
            # Проверяем, что файл корректно передается в processed_data
            try:
                print(f"DEBUG - CreatorProfileViewSet.partial_update - файл в processed_data: {processed_data['avatar']}")
                print(f"DEBUG - CreatorProfileViewSet.partial_update - тип файла в processed_data: {type(processed_data['avatar'])}")
                print(f"DEBUG - CreatorProfileViewSet.partial_update - размер файла в processed_data: {processed_data['avatar'].size} байт")
            except Exception as e:
                print(f"DEBUG - CreatorProfileViewSet.partial_update - ошибка при проверке файла в processed_data: {e}")
                
            # Проверяем, что файл корректно передается в сериализатор
            try:
                print(f"DEBUG - CreatorProfileViewSet.partial_update - файл перед передачей в сериализатор: {processed_data['avatar']}")
                print(f"DEBUG - CreatorProfileViewSet.partial_update - тип файла перед передачей в сериализатор: {type(processed_data['avatar'])}")
                print(f"DEBUG - CreatorProfileViewSet.partial_update - размер файла перед передачей в сериализатор: {processed_data['avatar'].size} байт")
            except Exception as e:
                print(f"DEBUG - CreatorProfileViewSet.partial_update - ошибка при проверке файла перед передачей в сериализатор: {e}")
        
        print(f"DEBUG - CreatorProfileViewSet.partial_update - ключи в processed_data: {processed_data.keys()}")
        if 'avatar' in processed_data:
            print(f"DEBUG - CreatorProfileViewSet.partial_update - avatar в processed_data: {processed_data['avatar']}")
        
        # Обработка social_links
        if 'social_links' in processed_data and isinstance(processed_data['social_links'], str):
            try:
                print("DEBUG - Текущие social_links в БД:", list(instance.social_links.all().values()))
                print("DEBUG - Десериализация social_links из строки JSON:", processed_data['social_links'])
                social_links_data = json.loads(processed_data['social_links'])
                print("DEBUG - После десериализации social_links_data:", social_links_data)
                
                # Добавляем social_links_data в обработанные данные
                processed_data['social_links_data'] = social_links_data
                # Удаляем исходное поле social_links
                del processed_data['social_links']
            except Exception as e:
                print(f"DEBUG - Ошибка десериализации social_links: {e}")
        
        print("DEBUG - Обработанные данные перед передачей сериализатору:", processed_data)
        
        serializer = self.get_serializer(instance, data=processed_data, partial=True)
        valid = serializer.is_valid(raise_exception=False)
        
        if not valid:
            print("DEBUG - Ошибки валидации:", serializer.errors)
            raise ValidationError(serializer.errors)
        
        # Проверяем, что аватар попал в validated_data
        print(f"DEBUG - Ключи в validated_data: {serializer.validated_data.keys()}")
        if 'avatar' in serializer.validated_data:
            print(f"DEBUG - Аватар в validated_data: {serializer.validated_data['avatar']}")
            print(f"DEBUG - Тип аватара в validated_data: {type(serializer.validated_data['avatar'])}")
            print(f"DEBUG - Размер аватара в validated_data: {serializer.validated_data['avatar'].size} байт")
        else:
            print("DEBUG - Аватар отсутствует в validated_data")
        
        # Выполняем обновление
        try:
            self.perform_update(serializer)
            print("DEBUG - Обновление успешно выполнено")
        except Exception as e:
            print(f"DEBUG - Ошибка при выполнении обновления: {e}")
            raise
        
        # Проверим, что social_links сохранились
        instance.refresh_from_db()
        print("DEBUG - После сохранения, social_links:", list(instance.social_links.all().values()))
        
        # Проверяем, сохранился ли аватар
        user = instance.user
        user.refresh_from_db()
        print(f"DEBUG - Аватар после сохранения: {user.avatar}")
        
        # Проверяем наличие файла на диске
        import os
        from django.conf import settings
        
        if user.avatar:
            try:
                avatar_path = user.avatar.path
                print(f"DEBUG - Путь к файлу аватара: {avatar_path}")
                print(f"DEBUG - Файл существует: {os.path.exists(avatar_path)}")
                
                if os.path.exists(avatar_path):
                    print(f"DEBUG - Размер файла: {os.path.getsize(avatar_path)} байт")
                    print(f"DEBUG - Права доступа к файлу: {oct(os.stat(avatar_path).st_mode)[-3:]}")
                    
                    # Проверяем URL аватара
                    print(f"DEBUG - URL аватара: {user.avatar.url}")
                    
                    # Проверяем доступность файла через URL
                    media_url = settings.MEDIA_URL.lstrip('/')
                    media_root = settings.MEDIA_ROOT
                    relative_path = os.path.relpath(avatar_path, media_root)
                    url_path = os.path.join(media_url, relative_path)
                    print(f"DEBUG - Относительный путь к файлу: {url_path}")
                else:
                    print("DEBUG - Файл не существует на диске!")
            except Exception as e:
                print(f"DEBUG - Ошибка при проверке файла аватара: {e}")
        else:
            print("DEBUG - Аватар не был сохранен в модели пользователя!")
        
        if getattr(instance, "_prefetched_objects_cache", None):
            # Если объект имеет предзагруженные отношения, мы должны их очистить
            # поскольку они не будут автоматически обновлены
            instance._prefetched_objects_cache = {}
        
        print("DEBUG - CreatorProfileViewSet.partial_update - ЗАВЕРШЕНО")
        return Response(serializer.data)

    queryset = CreatorProfile.objects.all()

    # ------ helpers -------------------------------------------------
    def get_serializer_class(self):
        if self.action == "list":
            return CreatorProfileListSerializer
        if self.action in ("retrieve", "retrieve_detail"):
            return CreatorProfileDetailSerializer
        return self.serializer_class

    def get_queryset(self):
        # Добавляем прямой вывод всех query параметров для отладки
        print("\n\n")
        print("*" * 80)
        print("ФИЛЬТРАЦИЯ КРЕАТОРОВ: ПОЛУЧЕНЫ ПАРАМЕТРЫ:")
        for key, value in self.request.query_params.items():
            print(f"   {key}: {value}")
        print("*" * 80)
        print("\n\n")
        
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
        
        # Добавляем прямой вывод информации в консоль
        
        # Проверяем исходный набор данных
        pre_filter_count = qs.count()
        print(f"\nКоличество креаторов до фильтрации: {pre_filter_count}")
        
        # Получаем список креаторов для анализа
        creators_with_tags_info = []
        for creator in CreatorProfile.objects.all():
            tags = [{'id': t.id, 'name': t.name} for t in creator.tags.all()]
            creators_with_tags_info.append({
                'id': creator.id, 
                'name': getattr(creator.user, 'first_name', '') or getattr(creator.user, 'username', ''),
                'tag_count': len(tags),
                'tags': tags
            })
        
        print("\nИнформация о креаторах и их тегах:")
        for creator_info in creators_with_tags_info:
            print(f"\nКреатор #{creator_info['id']} {creator_info['name']}:")
            print(f"  - Кол-во тегов: {creator_info['tag_count']}")
            if creator_info['tag_count'] > 0:
                print("  - Теги: ")
                for tag in creator_info['tags']:
                    print(f"    * ID: {tag['id']}, Название: {tag['name']}")
        print("\n")
        
        # Если есть параметр tag_ids, проверяем наличие креаторов с этими тегами
        if tag_ids_param:
            try:
                tag_ids = [int(tag_id.strip()) for tag_id in tag_ids_param.split(',') if tag_id.strip()]
                print(f"\nПроверка креаторов с тегами {tag_ids}:")
                
                # Получаем информацию о тегах
                from django.apps import apps
                Tag = apps.get_model('core', 'Tag')
                existing_tags = Tag.objects.filter(id__in=tag_ids)
                print(f"  Найденные теги: {list(existing_tags.values('id', 'name'))}")
                
                # Проверяем, есть ли креаторы с этими тегами
                creators_with_tags = CreatorProfile.objects.filter(tags__id__in=tag_ids).values_list('id', flat=True).distinct()
                print(f"  ID креаторов с этими тегами: {list(creators_with_tags)}")
                print(f"  Количество креаторов с этими тегами: {len(creators_with_tags)}")
            except Exception as e:
                print(f"\nОшибка при проверке тегов: {str(e)}")
        
        # Конец дополнительного вывода

        # Если указаны ID тегов, применяем фильтрацию
        if tag_ids_param:
            try:
                tag_ids = [int(tag_id.strip()) for tag_id in tag_ids_param.split(',') if tag_id.strip()]
                logger.debug(f"[FILTER DEBUG] Преобразованные ID тегов для фильтрации: {tag_ids}")
                
                if tag_ids:
                    # Предварительная проверка: есть ли в базе теги с такими ID?
                    from django.apps import apps
                    Tag = apps.get_model('core', 'Tag')
                    existing_tags = Tag.objects.filter(id__in=tag_ids)
                    logger.debug(f"[FILTER DEBUG] Найдены следующие теги в базе: {list(existing_tags.values('id', 'name'))}")
                    
                    # Предварительная проверка: есть ли креаторы с этими тегами?
                    creators_with_tags = CreatorProfile.objects.filter(tags__id__in=tag_ids).values('id').distinct()
                    logger.debug(f"[FILTER DEBUG] Количество креаторов с этими тегами: {creators_with_tags.count()}")
                    logger.debug(f"[FILTER DEBUG] ID креаторов с этими тегами: {[c['id'] for c in creators_with_tags]}")
                    
                    if tag_match_type == 'all':
                        # Фильтрация по всем указанным тегам (AND)
                        # Аннотируем количество совпадающих тегов и фильтруем по этому количеству
                        qs = qs.annotate(
                            matching_tags_count=Count('tags', filter=Q(tags__id__in=tag_ids), distinct=True)
                        ).filter(matching_tags_count=len(tag_ids))
                        logger.debug(f"[FILTER DEBUG] Применена фильтрация по ВСЕМ тегам (AND). SQL: {qs.query}")
                    else:  # 'any' или любое другое значение
                        # Фильтрация по любому из указанных тегов (OR)
                        qs = qs.filter(tags__id__in=tag_ids).distinct()
                        logger.debug(f"[FILTER DEBUG] Применена фильтрация по ЛЮБОМУ из тегов (OR). SQL: {qs.query}")
                    
                    # Логируем результат после фильтрации
                    post_filter_count = qs.count()
                    logger.debug(f"[FILTER DEBUG] Количество креаторов после фильтрации по тегам: {post_filter_count} (было {pre_filter_count})")
                else:
                    logger.debug("[FILTER DEBUG] После обработки список tag_ids пуст, фильтрация не применена")
            except ValueError as e:
                # Если в параметре tag_ids передано некорректное значение, игнорируем фильтрацию
                logger.error(f"[FILTER DEBUG] Ошибка при обработке tag_ids: {str(e)}. Значение параметра: '{tag_ids_param}'")
                pass
        else:
            logger.debug("[FILTER DEBUG] Параметр tag_ids отсутствует, фильтрация по тегам не применяется")
                
        # Фильтрация по полу пользователя
        gender = self.request.query_params.get('gender')
        if gender:
            # Логируем запрос для отладки
            logger.debug(f"Фильтрация по полу: {gender}")
            # Фильтруем креаторов по полу связанного пользователя
            qs = qs.filter(user__gender=gender)
            # Логируем количество найденных креаторов
            logger.debug(f"Найдено креаторов с полом '{gender}': {qs.count()}")
        
        # Фильтрация по среднему времени выполнения работы
        average_work_time = self.request.query_params.get('average_work_time')
        if average_work_time:
            # Логируем запрос для отладки
            logger.debug(f"Фильтрация по среднему времени выполнения: {average_work_time}")
            
            # Определяем приоритеты времени ответа
            time_priority = {
                'up_to_24_hours': 1,
                'up_to_3_days': 2,
                'up_to_10_days': 3,
                'up_to_14_days': 4,
                'up_to_30_days': 5,
                'up_to_60_days': 6,
                'more_than_60_days': 7,
            }
            
            # Получаем приоритет выбранного времени
            filter_priority = time_priority.get(average_work_time, 999)
            
            # Получаем все допустимые значения времени (с приоритетом меньше или равным выбранному)
            valid_times = [time for time, priority in time_priority.items() if priority <= filter_priority]
            
            logger.debug(f"Допустимые значения времени для фильтра '{average_work_time}': {valid_times}")
            
            # Фильтруем креаторов по всем допустимым значениям времени
            qs = qs.filter(average_work_time__in=valid_times)
            
            # Логируем количество найденных креаторов
            logger.debug(f"Найдено креаторов со средним временем выполнения до '{average_work_time}': {qs.count()}")
                
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


# ──────────────────────── favorite creators ─────────────────────────
class FavoriteCreatorViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления избранными креаторами.
    
    Позволяет клиентам добавлять креаторов в избранное, удалять из избранного
    и просматривать список своих избранных креаторов.
    
    Endpoints:
        GET /api/users/favorite-creators/ - получить список избранных креаторов
        POST /api/users/favorite-creators/ - добавить креатора в избранное
        DELETE /api/users/favorite-creators/{id}/ - удалить из избранного
        GET /api/users/favorite-creators/check/{creator_id}/ - проверить, в избранном ли креатор
    """
    serializer_class = FavoriteCreatorSerializer
    permission_classes = [IsAuthenticated, IsVerifiedUser]
    queryset = FavoriteCreator.objects.all()  # Базовый queryset для роутера
    
    def get_queryset(self):
        """
        Возвращает только избранных креаторов текущего пользователя.
        
        Returns:
            QuerySet: Избранные креаторы текущего пользователя с предзагруженными данными.
        """
        return FavoriteCreator.objects.filter(
            client=self.request.user
        ).select_related(
            'creator__user'
        ).prefetch_related(
            'creator__tags',
            'creator__social_links'
        ).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """
        Добавляет креатора в избранное.
        
        Args:
            request: HTTP запрос с creator_id в данных.
            
        Returns:
            Response: Созданная запись избранного или ошибка валидации.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            favorite = serializer.save()
            return Response(
                self.get_serializer(favorite).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        Удаляет креатора из избранного.
        
        Args:
            request: HTTP запрос.
            *args, **kwargs: Аргументы с ID записи для удаления.
            
        Returns:
            Response: Подтверждение удаления или ошибка.
        """
        try:
            instance = self.get_object()
            instance.delete()
            return Response(
                {'message': 'Креатор удален из избранного'},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """
        Проверяет, находится ли креатор в избранном у текущего пользователя.
        
        Параметры запроса:
        - creator_id: ID креатора для проверки
        
        Args:
            request: HTTP запрос.
            
        Returns:
            Response: Результат проверки с булевым значением is_favorite.
        """
        creator_id = request.query_params.get('creator_id')
        if not creator_id:
            return Response(
                {'error': 'Параметр creator_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            creator_id = int(creator_id)
            is_favorite = FavoriteCreator.objects.filter(
                client=request.user,
                creator_id=creator_id
            ).exists()
            
            return Response({
                'is_favorite': is_favorite,
                'creator_id': creator_id
            })
        except (ValueError, TypeError):
            return Response(
                {'error': 'Неверный ID креатора'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['delete'])
    def remove(self, request):
        """
        Удаляет креатора из избранного по ID креатора.
        
        Альтернативный способ удаления, когда известен только ID креатора,
        а не ID записи FavoriteCreator.
        
        Параметры запроса:
        - creator_id: ID креатора для удаления
        
        Args:
            request: HTTP запрос.
            
        Returns:
            Response: Подтверждение удаления или ошибка.
        """
        creator_id = request.query_params.get('creator_id')
        if not creator_id:
            return Response(
                {'error': 'Параметр creator_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            creator_id = int(creator_id)
            deleted_count, _ = FavoriteCreator.objects.filter(
                client=request.user,
                creator_id=creator_id
            ).delete()
            
            if deleted_count > 0:
                return Response(
                    {'message': 'Креатор удален из избранного'},
                    status=status.HTTP_204_NO_CONTENT
                )
            else:
                return Response(
                    {'error': 'Креатор не найден в избранном'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Неверный ID креатора'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
