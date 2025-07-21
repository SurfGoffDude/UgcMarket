"""
Сериализаторы для приложения users.

Преобразуют данные пользователей между JSON и объектами Django.
"""

from django.db import models  # для Max и Aggregate
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from core import models as core_models  # Импортируем модели из приложения core

from .models import (
    ClientProfile,
    CreatorProfile,
    SocialLink,
    # Tag,  # Удалено, так как теперь используется core_models.Tag
    PortfolioItem,
    PortfolioImage,
    Service,
    ServiceImage,
    FavoriteCreator,
)

User = get_user_model()


# ──────────────────────────────── USER ────────────────────────────────
class UserBriefSerializer(serializers.ModelSerializer):
    """
    Краткий сериализатор пользователя.
    
    Используется для вложенного представления пользователей в других сериализаторах,
    где требуется только основная информация о пользователе.
    """
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "avatar",
        ]
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    user_type = serializers.CharField(read_only=True)
    has_creator_profile = serializers.BooleanField(read_only=True)
    has_client_profile = serializers.BooleanField(read_only=True)
    creator_profile_id = serializers.IntegerField(source="creator_profile.id", read_only=True)
    # Явно указываем тип поля для аватара
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    def update(self, instance, validated_data):
        """
        Обновляет пользователя с обработкой аватара.
        
        Args:
            instance: Экземпляр модели User для обновления
            validated_data: Проверенные данные для обновления
            
        Returns:
            Обновленный экземпляр модели User
        """
        import os
        from django.conf import settings
        
        print(f"DEBUG - UserSerializer.update - начало обновления пользователя {instance.username}")
        print(f"DEBUG - UserSerializer.update - validated_data: {validated_data}")
        
        # Проверяем наличие аватара в данных
        avatar = validated_data.pop('avatar', None)
        if avatar is not None:
            print(f"DEBUG - UserSerializer.update - найден аватар: {avatar}")
            print(f"DEBUG - UserSerializer.update - тип аватара: {type(avatar)}")
            print(f"DEBUG - UserSerializer.update - имя файла: {avatar.name}")
            print(f"DEBUG - UserSerializer.update - размер файла: {avatar.size} байт")
            
            # Проверяем директорию для сохранения аватаров
            avatar_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
            print(f"DEBUG - UserSerializer.update - директория для аватаров: {avatar_dir}")
            print(f"DEBUG - UserSerializer.update - директория существует: {os.path.exists(avatar_dir)}")
            
            # Создаем директорию, если она не существует
            if not os.path.exists(avatar_dir):
                try:
                    os.makedirs(avatar_dir)
                    print(f"DEBUG - UserSerializer.update - создана директория: {avatar_dir}")
                except Exception as e:
                    print(f"DEBUG - UserSerializer.update - ошибка при создании директории: {e}")
            
            # Проверяем права доступа к директории
            try:
                print(f"DEBUG - UserSerializer.update - права доступа к директории: {oct(os.stat(avatar_dir).st_mode)[-3:]}")
            except Exception as e:
                print(f"DEBUG - UserSerializer.update - ошибка при проверке прав доступа: {e}")
            
            # Устанавливаем аватар
            old_avatar = instance.avatar
            instance.avatar = avatar
            print(f"DEBUG - UserSerializer.update - аватар установлен: {instance.avatar}")
        
        # Обновляем остальные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Сохраняем пользователя
        try:
            instance.save()
            print(f"DEBUG - UserSerializer.update - пользователь сохранен, аватар: {instance.avatar}")
            
            # Проверяем, что файл сохранен на диск
            if instance.avatar:
                try:
                    avatar_path = instance.avatar.path
                    print(f"DEBUG - UserSerializer.update - путь к файлу аватара: {avatar_path}")
                    print(f"DEBUG - UserSerializer.update - файл существует: {os.path.exists(avatar_path)}")
                    if os.path.exists(avatar_path):
                        print(f"DEBUG - UserSerializer.update - размер файла на диске: {os.path.getsize(avatar_path)} байт")
                except Exception as e:
                    print(f"DEBUG - UserSerializer.update - ошибка при проверке файла: {e}")
        except Exception as e:
            print(f"DEBUG - UserSerializer.update - ошибка при сохранении пользователя: {e}")
        
        return instance

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "avatar",
            "phone",
            "bio",
            "location",
            "gender",
            "is_verified",
            "user_type",
            "date_joined",
            "has_creator_profile",
            "has_client_profile",
            "creator_profile_id",
        ]
        read_only_fields = ["id", "email", "is_verified", "date_joined"]


class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Сериализатор регистрации нового пользователя.
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    user_type = serializers.ChoiceField(choices=[("client", "Клиент"), ("creator", "Креатор")])

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "phone",
            "user_type",
        ]
        extra_kwargs = {"first_name": {"required": False}, "last_name": {"required": False}}

    # --- validation / create -------------------------------------------------
    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})

        if User.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "Пользователь с таким email уже существует"})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        user_type = validated_data.pop("user_type")
        validated_data.setdefault("first_name", "")
        validated_data.setdefault("last_name", "")

        user = User.objects.create_user(**validated_data)

        if user_type == "creator":
            CreatorProfile.objects.create(user=user)
        else:
            ClientProfile.objects.create(user=user)
        return user


# ───────────────────────── TAGS ─────────────────────────
class TagSerializer(serializers.ModelSerializer):
    slug = serializers.CharField(required=False)

    class Meta:
        model = core_models.Tag  # Используем модель из приложения core
        fields = ["id", "name", "slug"]

    def create(self, validated_data):
        if "slug" not in validated_data:
            from django.utils.text import slugify

            base_slug = slugify(validated_data["name"])
            slug = base_slug
            counter = 1
            while core_models.Tag.objects.filter(slug=slug).exists():  # Используем core_models.Tag вместо Tag
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data["slug"] = slug
        return super().create(validated_data)


# Специализированный сериализатор пользователя для каталога
class UserCatalogSerializer(serializers.ModelSerializer):
    """UserSerializer без поля телефона для использования в каталоге."""
    
    full_name = serializers.CharField(read_only=True)
    user_type = serializers.CharField(read_only=True)
    has_creator_profile = serializers.BooleanField(read_only=True)
    has_client_profile = serializers.BooleanField(read_only=True)
    creator_profile_id = serializers.IntegerField(source="creator_profile.id", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "avatar",
            "bio",
            "location",
            "is_verified",
            "user_type",
            "date_joined",
            "has_creator_profile",
            "has_client_profile",
            "creator_profile_id",
        ]
        read_only_fields = ["id", "email", "is_verified", "date_joined"]

# ─────────────────────── CREATOR PROFILES (список) ───────────────────────
class CreatorProfileListSerializer(serializers.ModelSerializer):
    """Список профилей креаторов для каталога.
    
    Включает полный объект пользователя с контактной информацией
    для отображения в карточке креатора в каталоге.
    Важно: номер телефона не передается в ответе API по требованиям безопасности.
    """
    # Используем сериализатор без поля телефона
    user = UserCatalogSerializer(read_only=True)
    services_count = serializers.IntegerField(read_only=True)
    base_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    # Дополнительно оставляем отдельные поля для обратной совместимости фронтенда
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    avatar = serializers.ImageField(source="user.avatar", read_only=True)

    class Meta:
        model = CreatorProfile
        fields = [
            "id",
            "user",  # Полный объект пользователя (включая email, телефон и дату регистрации)
            "username",
            "first_name",
            "last_name",
            "avatar",
            "nickname",
            "tags",
            "services_count",
            "base_price",
            "rating",
            "specialization",
            "experience",
            "available_for_hire",
        ]
        read_only_fields = fields
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Преобразуем список объектов тегов в список их имён
        representation["tags"] = [tag["name"] for tag in representation.get("tags", [])]
        return representation


class CreatorProfileCatalogSerializer(serializers.ModelSerializer):
    """
    Компактный список (для главной / поиска).
    """
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    avatar = serializers.ImageField(source="user.avatar", read_only=True)
    bio = serializers.CharField(source="user.bio", read_only=True)
    services_count = serializers.IntegerField(read_only=True)
    base_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = CreatorProfile
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "avatar",
            "bio",
            "services_count",
            "base_price",
            "reviews_count",
        ]

    def get_reviews_count(self, obj):  # TODO: заменить, когда появятся отзывы
        return 0


# ─────────────────── CREATOR PROFILE (detail / edit) ───────────────────
class SocialLinkSerializer(serializers.ModelSerializer):
    """Сериализатор для социальных сетей креатора.
    
    Позволяет выбрать платформу из фиксированного списка и добавить ссылку на профиль.
    """
    platform_display = serializers.SerializerMethodField()
    
    class Meta:
        model = SocialLink
        fields = ["platform", "url", "platform_display"]
        
    def get_platform_display(self, obj):
        """Возвращает человекочитаемое название платформы."""
        return dict(SocialLink.PLATFORM_CHOICES).get(obj.platform, obj.platform)
        
    def to_representation(self, instance):
        """Добавляем поддержку обратной совместимости для старого API."""
        ret = super().to_representation(instance)
        # Для обратной совместимости добавляем поле name с тем же значением, что и platform
        ret['name'] = instance.platform
        return ret


class CreatorProfileSerializer(serializers.ModelSerializer):
    """
    Полный профиль креатора (базовый).

    Всегда приводит список тегов к списку их имён для удобства фронтенда.
    """
    user = UserSerializer(required=False)
    full_name = serializers.SerializerMethodField(read_only=True)
    username = serializers.SerializerMethodField(read_only=True)
    # Явно указываем поле avatar для обработки загружаемых файлов
    avatar = serializers.ImageField(required=False, allow_null=True)
    bio = serializers.SerializerMethodField(read_only=True)
    location = serializers.SerializerMethodField(read_only=True)
    social_links = SocialLinkSerializer(many=True, required=False)
    social_links_data = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    skills = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    services_count = serializers.IntegerField(read_only=True)
    tags = serializers.ListField(required=False, write_only=True)

    class Meta:
        model = CreatorProfile
        fields = [
            "id",
            "user",
            "nickname",
            "full_name",
            "username",
            "avatar",  # Поле для загрузки аватара
            "bio",
            "location",
            "specialization",
            "experience",
            "portfolio_link",
            "cover_image",
            "is_online",
            "available_for_hire",
            "social_links",
            "social_links_data",
            "skills",
            "tags",
            "rating",
            "completed_orders",
            "services_count",
            "average_response_time",
            "average_work_time",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "rating",
            "completed_orders",
            "created_at",
            "updated_at",
        ]

    # ─────────────── getters ───────────────
    def get_full_name(self, obj):
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.user.username

    def get_username(self, obj):
        return obj.user.username

    def get_avatar(self, obj):
        # Возвращает URL аватара пользователя.
    #     
    #     Если аватар не установлен, возвращает None.
        if obj.user.avatar and hasattr(obj.user.avatar, 'url'):
            try:
                return obj.user.avatar.url
            except Exception as e:
                print(f"DEBUG - Ошибка при получении URL аватара: {e}")
                return None
        return None

    def get_bio(self, obj):
        return obj.user.bio

    def get_location(self, obj):
        return obj.user.location

    # ─────────────── CRUD ───────────────
    def create(self, validated_data):
        social_links = validated_data.pop("social_links", [])
        profile = CreatorProfile.objects.create(**validated_data)
        for link in social_links:
            SocialLink.objects.create(creator_profile=profile, **link)
        return profile

    def update(self, instance, validated_data):
        # Отладка входящих данных
        print("DEBUG - CreatorProfileSerializer.update - validated_data:", validated_data)
        
        # Получаем social_links из social_links_data (для multipart/form-data)
        social_links_data = validated_data.pop("social_links_data", None)
        if social_links_data is not None:
            print("DEBUG - CreatorProfileSerializer.update - Найдено social_links_data:", social_links_data)
            social_links = social_links_data
        else:
            # Стандартная обработка (для application/json)
            social_links = validated_data.pop("social_links", None)
            
        tags_data = validated_data.pop("tags", None)
        user_data = validated_data.pop("user", {})
        bio = validated_data.pop("bio", None)
        location = validated_data.pop("location_write", None)
        avatar = validated_data.pop("avatar", None)
        
        # Отладка полей после извлечения
        print("DEBUG - CreatorProfileSerializer.update - user_data:", user_data)
        print("DEBUG - CreatorProfileSerializer.update - bio:", bio)
        print("DEBUG - CreatorProfileSerializer.update - location:", location)

        # --- update CreatorProfile itself
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # --- update related User
        user = instance.user
        if bio is not None:
            user.bio = bio
        if location is not None:
            user.location = location
            
        # Обработка аватара
        # Исправление: используем ранее извлеченный аватар, а не пытаемся получить его из validated_data снова
        if avatar is not None:
            print(f"DEBUG - CreatorProfileSerializer.update - avatar перед сохранением: {avatar} (тип: {type(avatar)})")
            
            # Проверяем, что файл существует и доступен для чтения
            try:
                print(f"DEBUG - CreatorProfileSerializer.update - размер файла: {avatar.size} байт")
                print(f"DEBUG - CreatorProfileSerializer.update - имя файла: {avatar.name}")
                print(f"DEBUG - CreatorProfileSerializer.update - content_type: {avatar.content_type}")
                
                # Проверяем чтение файла
                avatar.seek(0)  # Убедимся, что указатель в начале файла
                data = avatar.read(1024)  # Прочитаем первый килобайт
                avatar.seek(0)  # Вернем указатель в начало
                print(f"DEBUG - CreatorProfileSerializer.update - файл успешно прочитан, размер прочитанных данных: {len(data)} байт")
                
                # Устанавливаем аватар
                user.avatar = avatar
                print(f"DEBUG - CreatorProfileSerializer.update - user.avatar после присвоения: {user.avatar} (тип: {type(user.avatar)})")
                
            except Exception as e:
                print(f"DEBUG - CreatorProfileSerializer.update - ошибка при доступе к файлу: {e}")
                # Попробуем сохранить файл вручную
                try:
                    from django.core.files.storage import default_storage
                    from django.core.files.base import ContentFile
                    import os
                    
                    # Сохраняем файл во временный файл
                    temp_path = default_storage.save(f"avatars/temp_{avatar.name}", ContentFile(avatar.read()))
                    avatar.seek(0)  # Возвращаем указатель в начало файла
                    print(f"DEBUG - CreatorProfileSerializer.update - файл успешно сохранен во временный файл: {temp_path}")
                    
                    # Устанавливаем аватар
                    user.avatar = avatar
                    print(f"DEBUG - CreatorProfileSerializer.update - user.avatar после присвоения: {user.avatar} (тип: {type(user.avatar)})")
                except Exception as e2:
                    print(f"DEBUG - CreatorProfileSerializer.update - ошибка при ручном сохранении файла: {e2}")
            
            # Сохраняем пользователя сразу после установки аватара
            try:
                user.save()
                print(f"DEBUG - CreatorProfileSerializer.update - пользователь сохранен с аватаром")
                
                # Проверяем, что файл сохранен
                if user.avatar and hasattr(user.avatar, 'path'):
                    print(f"DEBUG - CreatorProfileSerializer.update - путь к файлу аватара: {user.avatar.path}")
                    import os
                    if os.path.exists(user.avatar.path):
                        print(f"DEBUG - CreatorProfileSerializer.update - файл существует на диске, размер: {os.path.getsize(user.avatar.path)} байт")
                    else:
                        print(f"DEBUG - CreatorProfileSerializer.update - файл не существует на диске: {user.avatar.path}")
            except Exception as e:
                print(f"DEBUG - CreatorProfileSerializer.update - ошибка при сохранении пользователя с аватаром: {e}")
        else:
            print("DEBUG - CreatorProfileSerializer.update - аватар не был передан")
            
        # Отладка поля gender в user_data и его установка
        print("DEBUG - CreatorProfileSerializer.update - gender в user_data:", user_data.get('gender'))
        gender = user_data.get('gender')
        if gender is not None:
            print("DEBUG - Установка поля gender:", gender)
            user.gender = gender
            
        # Обработка других полей пользователя
        for attr, value in user_data.items():
            if attr != 'gender' and value is not None:  # Пропускаем gender, т.к. мы уже его обработали выше
                setattr(user, attr, value)
                
        print("DEBUG - CreatorProfileSerializer.update - gender после установки:", user.gender)
        
        # Проверяем директорию для сохранения аватаров
        import os
        from django.conf import settings
        avatar_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
        print(f"DEBUG - CreatorProfileSerializer.update - директория для аватаров: {avatar_dir}")
        print(f"DEBUG - CreatorProfileSerializer.update - директория существует: {os.path.exists(avatar_dir)}")
        print(f"DEBUG - CreatorProfileSerializer.update - права доступа: {oct(os.stat(avatar_dir).st_mode)[-3:]}")
        
        # Сохраняем пользователя
        print("DEBUG - CreatorProfileSerializer.update - сохранение пользователя...")
        user.save()
        print("DEBUG - CreatorProfileSerializer.update - пользователь сохранен")
        
        # Проверяем, сохранился ли аватар
        if avatar is not None:
            print(f"DEBUG - CreatorProfileSerializer.update - аватар после сохранения: {user.avatar}")
            if user.avatar:
                avatar_path = user.avatar.path
                print(f"DEBUG - CreatorProfileSerializer.update - путь к файлу аватара: {avatar_path}")
                print(f"DEBUG - CreatorProfileSerializer.update - файл существует: {os.path.exists(avatar_path)}")
                if os.path.exists(avatar_path):
                    print(f"DEBUG - CreatorProfileSerializer.update - размер файла: {os.path.getsize(avatar_path)} байт")
            else:
                print("DEBUG - CreatorProfileSerializer.update - аватар не сохранился!")
        else:
            print("DEBUG - CreatorProfileSerializer.update - аватар не был передан")

        # --- tags
        if tags_data is not None:
            from django.utils.text import slugify
            tags_to_set = []
            
            for tag_item in tags_data:
                # Если передан ID (целое число) - используем его
                if isinstance(tag_item, int):
                    try:
                        tag =  core_models.Tag.objects.get(id=tag_item)
                        tags_to_set.append(tag)
                    except core_models.Tag.DoesNotExist:
                        # Пропускаем несуществующие ID тегов
                        continue
                # Если передано название или словарь с названием
                elif isinstance(tag_item, str):
                    tag_name = tag_item
                    tag, created = Tag.objects.get_or_create(
                        name=tag_name,
                        defaults={'slug': slugify(tag_name)}
                    )
                    tags_to_set.append(tag)
                # Если передан словарь (например, с id или name)
                elif isinstance(tag_item, dict):
                    if 'id' in tag_item and tag_item['id']:
                        try:
                            tag = Tag.objects.get(id=tag_item['id'])
                            tags_to_set.append(tag)
                        except core_models.Tag.DoesNotExist:
                            # Если ID не существует, но есть name - создаем новый тег
                            if 'name' in tag_item and tag_item['name']:
                                tag_name = tag_item['name']
                                tag, created = Tag.objects.get_or_create(
                                    name=tag_name,
                                    defaults={'slug': slugify(tag_name)}
                                )
                                tags_to_set.append(tag)
                    elif 'name' in tag_item and tag_item['name']:
                        tag_name = tag_item['name']
                        tag, created = Tag.objects.get_or_create(
                            name=tag_name,
                            defaults={'slug': slugify(tag_name)}
                        )
                        tags_to_set.append(tag)
            
            # Установка тегов
            instance.tags.set(tags_to_set)

        # --- social links
        if social_links is not None:
            print("\n" + "#" * 80)
            print(f"DEBUG - CreatorProfileSerializer.update - Обработка social_links: {social_links}")
            print("DEBUG - Тип social_links:", type(social_links))
            
            # Удаляем существующие ссылки
            current_links = list(instance.social_links.all())
            print(f"DEBUG - Удаляем текущие ссылки: {current_links}")
            instance.social_links.all().delete()
            
            print(f"DEBUG - Создаем новые ссылки:")
            for i, link in enumerate(social_links):
                print(f"  {i+1}. {link}")
                try:
                    new_link = SocialLink.objects.create(creator_profile=instance, **link)
                    print(f"     Создано: {new_link}")
                except Exception as e:
                    print(f"     ОШИБКА: {str(e)}")
            print("#" * 80 + "\n")
        else:
            print("DEBUG - CreatorProfileSerializer.update - social_links is None, пропускаем обработку")

        return instance


# ───────────────────────────── CLIENT PROFILE ─────────────────────────────
class ClientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)
    phone = serializers.CharField(source="user.phone", required=False, allow_blank=True, allow_null=True)
    bio = serializers.CharField(source="user.bio", required=False, allow_blank=True, allow_null=True)
    location = serializers.CharField(source="user.location", required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = ClientProfile
        fields = [
            "id",
            "user",
            "first_name",
            "last_name",
            "phone",
            "bio",
            "location",
            "company_name",
            "position",
            "website",
            "about",
            "notifications_enabled",
            "email_notifications",
            "push_notifications",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        return instance


# ───────────────────── верификация email ─────────────────────
class EmailVerificationSerializer(serializers.Serializer):
    """Пустой сериализатор для подтверждения email через ссылку.

    На этапе GET-запроса верификации данные не требуются, но DRF ожидает
    наличие `serializer_class` во вьюхе. Оставлен пустым на случай будущего
    расширения (например, если потребуется POST с токеном).
    """

    pass






# ─────────────────── CREATOR PROFILE (detail serializer) ───────────────────
class CreatorProfileDetailSerializer(CreatorProfileSerializer):
    """Подробный сериализатор профиля креатора.

    Дополнительно сериализует связанные теги и представляет их в виде списка
    имён (string) для удобства фронтенда.
    """

    # Показываем теги полностью через вложенный TagSerializer
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = CreatorProfile
        fields = [
            "id",
            "user",
            "nickname",
            "full_name",
            "username",
            "avatar",
            "bio",
            "location",
            "specialization",
            "experience",
            "portfolio_link",
            "social_links",
            "social_links_data",
            "skills",
            "tags",
            "rating",
            "completed_orders",
            "services_count",
            "available_for_hire",
            "average_response_time",
            "average_work_time",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "rating",
            "review_count",
            "completed_orders",
            "created_at",
            "updated_at",
        ]

    # --- representation -----------------------------------------------------
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Преобразуем список объектов тегов в список их имён
        representation["tags"] = [tag["name"] for tag in representation.get("tags", [])]
        return representation

# ───────────────────────── PORTFOLIO ─────────────────────────
from django.core.files.uploadedfile import UploadedFile
from .validators import validate_image_or_svg

class PortfolioImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    # Заменяем ImageField на FileField с кастомным валидатором для поддержки SVG
    image = serializers.FileField(validators=[validate_image_or_svg], write_only=True)

    class Meta:
        model = PortfolioImage
        fields = ["id", "portfolio_item", "image", "image_url", "caption", "order"]
        # Убираю portfolio_item из read_only_fields, так как контроллер ожидает это поле в запросе
        read_only_fields = []

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None
        
    def validate_image(self, value):
        """Custom validation for image field to support SVG files."""
        if isinstance(value, UploadedFile):
            # Применяем кастомный валидатор
            validate_image_or_svg(value)
        return value


class PortfolioItemSerializer(serializers.ModelSerializer):
    images = PortfolioImageSerializer(many=True, read_only=True)
    # Заменяем ImageField на FileField с кастомным валидатором для поддержки SVG
    uploaded_images = serializers.ListField(
        child=serializers.FileField(validators=[validate_image_or_svg], max_length=100_000),
        write_only=True,
        required=False,
    )
    # Заменяем ImageField на FileField с кастомным валидатором для поддержки SVG
    cover_image = serializers.FileField(validators=[validate_image_or_svg], write_only=True)
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioItem
        fields = [
            "id",
            "creator_profile",
            "title",
            "description",
            "cover_image",
            "cover_image_url",
            "external_url",
            "images",
            "uploaded_images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["creator_profile", "created_at", "updated_at"]
        extra_kwargs = {"cover_image": {"write_only": True}}

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.cover_image.url) if request else obj.cover_image.url
        return None

    # --- CRUD ---------------------------------------------------------------
    def create(self, validated_data):
        # Отладочный код для выявления проблем
        import logging
        logger = logging.getLogger('django.request')
        logger.debug(f"\n\n=== Детали валидации PortfolioItemSerializer ===\n")
        logger.debug(f"validated_data: {validated_data}\n")
        
        uploaded_images = validated_data.pop("uploaded_images", [])
        logger.debug(f"uploaded_images: {uploaded_images}\n")
        
        try:
            item = PortfolioItem.objects.create(**validated_data)
            
            for order, image in enumerate(uploaded_images):
                PortfolioImage.objects.create(portfolio_item=item, image=image, order=order)
            return item
        except Exception as e:
            logger.debug(f"\n\n=== Ошибка при создании PortfolioItem ===\n")
            logger.debug(f"Exception: {str(e)}\n")
            logger.debug(f"Exception type: {type(e)}\n\n")
            raise

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop("uploaded_images", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if uploaded_images:
            last_order = instance.images.aggregate(models.Max("order"))["order__max"] or 0
            for i, image in enumerate(uploaded_images):
                PortfolioImage.objects.create(
                    portfolio_item=instance,
                    image=image,
                    order=last_order + i + 1,
                )
        return instance


# ───────────────────────── SERVICES ─────────────────────────
class ServiceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceImage
        fields = ["id", "image", "caption", "order"]


class ServiceSerializer(serializers.ModelSerializer):
    creator_username = serializers.SerializerMethodField()
    creator_profile = serializers.PrimaryKeyRelatedField(queryset=CreatorProfile.objects.all(), required=False)

    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    modifications_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        coerce_to_string=False,
        required=False,
        allow_null=True,
    )

    images = ServiceImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Service
        fields = [
            "id",
            "creator_profile",
            "creator_username",
            "title",
            "description",
            "price",
            "estimated_time",
            "estimated_time_value",
            "estimated_time_unit",
            "allows_modifications",
            "modifications_price",
            "is_active",
            "images",
            "uploaded_images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    # ────────── helpers ──────────
    def get_creator_username(self, obj):
        return obj.creator_profile.user.username if obj.creator_profile else None

    # ────────── CRUD ──────────
    def create(self, validated_data):
        images_data = validated_data.pop("uploaded_images", [])
        service = Service.objects.create(**validated_data)
        for img in images_data:
            ServiceImage.objects.create(service=service, image=img)
        return service

    def update(self, instance, validated_data):
        images_data = validated_data.pop("uploaded_images", None)
        instance = super().update(instance, validated_data)

        if images_data:
            for img in images_data:
                ServiceImage.objects.create(service=instance, image=img)
        return instance


# ──────────────────────────────── FAVORITE CREATORS ────────────────────────────────
class FavoriteCreatorSerializer(serializers.ModelSerializer):
    """
    Сериализатор для избранных креаторов.
    
    Предоставляет полную информацию о связи клиент-креатор в избранном,
    включая детальную информацию о креаторе.
    """
    creator = CreatorProfileListSerializer(read_only=True)
    creator_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = FavoriteCreator
        fields = [
            'id',
            'creator',
            'creator_id', 
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        """
        Создает новую запись избранного креатора.
        
        Args:
            validated_data (dict): Валидированные данные с creator_id.
            
        Returns:
            FavoriteCreator: Созданная запись избранного креатора.
            
        Raises:
            ValidationError: Если креатор уже в избранном у данного клиента.
        """
        client = self.context['request'].user
        creator_id = validated_data['creator_id']
        
        # Проверяем, что креатор существует
        try:
            creator = CreatorProfile.objects.get(id=creator_id)
        except CreatorProfile.DoesNotExist:
            raise serializers.ValidationError({'creator_id': 'Креатор не найден'})
        
        # Проверяем, что клиент не добавляет себя в избранное (если он креатор)
        if hasattr(client, 'creator_profile') and client.creator_profile.id == creator_id:
            raise serializers.ValidationError({'creator_id': 'Нельзя добавить себя в избранное'})
        
        # Создаем запись
        favorite, created = FavoriteCreator.objects.get_or_create(
            client=client,
            creator=creator
        )
        
        if not created:
            raise serializers.ValidationError({'creator_id': 'Креатор уже в избранном'})
            
        return favorite
