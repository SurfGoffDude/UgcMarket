"""
Сериализаторы для приложения users.

Содержит сериализаторы для преобразования данных пользователей между JSON и объектами Django.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import (
    ClientProfile, CreatorProfile, SocialLink, 
    Skill, CreatorSkill, PortfolioItem, PortfolioImage, Service
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    user_type = serializers.CharField(read_only=True)
    has_creator_profile = serializers.BooleanField(read_only=True)
    has_client_profile = serializers.BooleanField(read_only=True)
    creator_profile_id = serializers.IntegerField(source='creator_profile.id', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'avatar', 'phone', 'bio', 'location', 'is_verified', 
            'user_type', 'date_joined', 'has_creator_profile', 
            'has_client_profile', 'creator_profile_id'
        ]
        read_only_fields = ['id', 'email', 'is_verified', 'date_joined']


class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Сериализатор для регистрации нового пользователя.
    
    Проверяет и создает нового пользователя со всеми необходимыми полями.
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    user_type = serializers.ChoiceField(choices=[('client', 'Клиент'), ('creator', 'Креатор')], required=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'user_type'
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate(self, attrs):
        """
        Проверяет соответствие паролей.
        
        Args:
            attrs: Атрибуты для валидации.
            
        Returns:
            dict: Проверенные атрибуты.
            
        Raises:
            serializers.ValidationError: Если пароли не совпадают или email уже существует.
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        
        # Проверка на уникальность email
        email = attrs.get('email')
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Пользователь с таким email уже существует"})
            
        return attrs
    
    def create(self, validated_data):
        """
        Создает нового пользователя с предоставленными данными.
        
        Args:
            validated_data: Проверенные данные для создания пользователя.
            
        Returns:
            User: Созданный экземпляр пользователя.
        """
        # Удаляем подтверждение пароля и извлекаем специальные поля
        validated_data.pop('password_confirm')
        user_type = validated_data.pop('user_type', 'client')
        phone = validated_data.pop('phone', '')
        
        # Создаем нового пользователя
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Создаем профиль в зависимости от типа пользователя
        if user_type == 'creator':
            # Для креаторов создаем профиль креатора
            CreatorProfile.objects.create(user=user)
        else:
            # Для клиентов создаем профиль клиента
            ClientProfile.objects.create(user=user)
        
        return user


class SocialLinkSerializer(serializers.ModelSerializer):
    """
    Сериализатор для социальных ссылок креатора.
    """
    class Meta:
        model = SocialLink
        fields = ['name', 'url']


class CreatorProfileSerializer(serializers.ModelSerializer):
    """
    Сериализатор для профиля креатора.
    
    Обеспечивает сериализацию и десериализацию модели CreatorProfile.
    Поддерживает все поля для полноценного профиля креатора.
    """
    # Делаем вложенный объект `user` записываемым, чтобы можно было обновлять
    # first_name, last_name, bio и другие поля через PATCH-запрос
    user = UserSerializer(required=False)
    social_links = SocialLinkSerializer(many=True, required=False)
    skills = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    full_name = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    # Убираем SerializerMethodField для location, чтобы его можно было записывать
    # location = serializers.SerializerMethodField()
    # Используем SerializerMethodField для чтения location из User
    location = serializers.SerializerMethodField()
    # Дополнительное поле для записи location
    location_write = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    review_count = serializers.IntegerField(source='completed_orders', read_only=True)
    
    class Meta:
        model = CreatorProfile
        fields = [
            'id', 'user', 'nickname', 'full_name', 'username', 'avatar', 'bio', 'location', 'location_write',
            'specialization', 'experience', 'portfolio_link', 'cover_image', 'is_online',
            'available_for_hire', 'social_links', 'skills', 'rating', 'review_count',
            'completed_orders', 'average_response_time', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'rating', 'review_count', 
                           'completed_orders', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        """
        Возвращает полное имя пользователя.
        """
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.user.username
    
    def get_username(self, obj):
        """
        Возвращает имя пользователя.
        """
        return obj.user.username
    
    def get_avatar(self, obj):
        """
        Возвращает URL аватара пользователя.
        """
        if obj.user.avatar:
            return obj.user.avatar.url
        return None
    
    def get_bio(self, obj):
        """
        Возвращает описание пользователя.
        """
        return obj.user.bio
    
    def get_location(self, obj):
        """
        Возвращает местоположение пользователя.
        """
        return obj.user.location
    
    def create(self, validated_data):
        """
        Создает профиль креатора с социальными ссылками.
        """
        social_links_data = validated_data.pop('social_links', [])
        creator_profile = CreatorProfile.objects.create(**validated_data)
        
        for link_data in social_links_data:
            SocialLink.objects.create(creator_profile=creator_profile, **link_data)
        
        return creator_profile
    
    def update(self, instance, validated_data):
        """
        Обновляет профиль креатора и его социальные ссылки.
        Также обновляет связанные поля пользователя (bio, avatar, location, nickname) и навыки.
        
        Args:
            instance: Экземпляр CreatorProfile для обновления
            validated_data: Проверенные данные для обновления профиля и вложенных объектов
            
        Returns:
            CreatorProfile: Обновленный экземпляр профиля креатора
        """
        # Выводим полученные данные для отладки
        import json
        print(f"PATCH validated_data: {json.dumps(validated_data, default=str)}")
        
        social_links_data = validated_data.pop('social_links', None)
        skills_data = validated_data.pop('skills', None)
        # Данные вложенного пользователя (first_name, last_name, bio, location, avatar и др.)
        user_data = validated_data.pop('user', {})
        print(f"Extracted user_data: {json.dumps(user_data, default=str)}")
        
        # Обработка полей пользователя, которые могут быть переданы в запросе
        bio = validated_data.pop('bio', None)
        # Проверяем наличие location_write (для записи поля location в user)
        location = validated_data.pop('location_write', None)
        avatar = validated_data.pop('avatar', None)
        nickname = validated_data.pop('nickname', None)
        
        # Обновление полей модели CreatorProfile
        for attr, value in validated_data.items():
            print(f"Setting instance.{attr} = {value}")
            setattr(instance, attr, value)
        
        # Обновляем nickname, который является частью CreatorProfile
        if nickname is not None:
            print(f"Setting instance.nickname = {nickname}")
            instance.nickname = nickname
        
        # Сохраняем изменения CreatorProfile
        instance.save()
        
        # Обновление полей пользователя (User), если они были переданы
        user = instance.user
        updated_user = False
        
        if bio is not None:
            print(f"Setting user.bio = {bio}")
            user.bio = bio
            updated_user = True
        
        if location is not None:
            print(f"Setting user.location = {location}")
            user.location = location
            updated_user = True
        
        if avatar is not None:
            print(f"Setting user.avatar = {avatar}")
            user.avatar = avatar
            updated_user = True
        
        # Обновляем вложенные поля пользователя, если они переданы во вложенном объекте `user`
        if user_data:
            print(f"Updating user with data: {json.dumps(user_data, default=str)}")
            for attr, value in user_data.items():
                # Игнорируем None, чтобы частичный PATCH не затирал существующие значения
                if value is not None:
                    print(f"Setting user.{attr} = {value}")
                    setattr(user, attr, value)
                    updated_user = True
        
        # Сохранение пользователя, если были изменения
        if updated_user:
            user.save()
            print(f"User saved: {user.id}, first_name={user.first_name}, last_name={user.last_name}, bio={user.bio}, location={user.location}")
        
        # Обновление навыков, если они предоставлены
        if skills_data is not None:
            # Удаляем существующие навыки
            instance.creator_skills.all().delete()
            
            # Создаем новые навыки
            for skill_data in skills_data:
                # Проверяем наличие обязательных полей
                if 'skill_id' in skill_data:
                    try:
                        skill = Skill.objects.get(pk=skill_data['skill_id'])
                        level = skill_data.get('level', 1)
                        CreatorSkill.objects.create(
                            creator_profile=instance,
                            skill=skill,
                            level=level
                        )
                    except Skill.DoesNotExist:
                        pass  # Игнорируем несуществующие навыки
                elif 'name' in skill_data:
                    # Если навык передан по имени, пытаемся найти или создать
                    skill_name = skill_data['name']
                    level = skill_data.get('level', 1)
                    
                    try:
                        skill = Skill.objects.get(name=skill_name)
                    except Skill.DoesNotExist:
                        # Создаем новый навык
                        from django.utils.text import slugify
                        skill = Skill.objects.create(
                            name=skill_name,
                            slug=slugify(skill_name)
                        )
                    
                    CreatorSkill.objects.create(
                        creator_profile=instance,
                        skill=skill,
                        level=level
                    )
        
        # Обновление социальных ссылок, если они предоставлены
        if social_links_data is not None:
            # Удаляем существующие ссылки
            instance.social_links.all().delete()
            # Создаем новые ссылки
            for link_data in social_links_data:
                SocialLink.objects.create(creator_profile=instance, **link_data)
        
        return instance


class ClientProfileSerializer(serializers.ModelSerializer):
    """
    Сериализатор для профиля клиента.
    """
    user = UserSerializer(read_only=True)
    
    # Добавляем поля из User для обновления
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    phone = serializers.CharField(source='user.phone', required=False, allow_blank=True, allow_null=True)
    bio = serializers.CharField(source='user.bio', required=False, allow_blank=True, allow_null=True)
    location = serializers.CharField(source='user.location', required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = ClientProfile
        fields = [
            'id', 'user', 'first_name', 'last_name', 'phone', 'bio', 'location',
            'company_name', 'position', 'website', 'about', 
            'notifications_enabled', 'email_notifications',
            'push_notifications', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
        
    def update(self, instance, validated_data):
        """
        Обновляет данные профиля клиента и связанного пользователя.
        
        Args:
            instance: объект ClientProfile
            validated_data: проверенные данные для обновления
            
        Returns:
            ClientProfile: обновленный объект профиля
        """
        # Извлекаем данные пользователя
        user_data = validated_data.pop('user', {})
        
        # Обновляем поля профиля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Если есть данные пользователя, обновляем их
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()
        
        # Сохраняем профиль
        instance.save()
        
        return instance


class EmailVerificationSerializer(serializers.Serializer):
    """
    Сериализатор для верификации email.
    """
    token = serializers.CharField()


class SkillSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели навыка.
    """
    class Meta:
        model = Skill
        fields = ['id', 'name', 'slug', 'description']


class CreatorSkillSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели навыка креатора.
    """
    skill = SkillSerializer(read_only=True)
    skill_id = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        source='skill',
        write_only=True
    )
    
    class Meta:
        model = CreatorSkill
        fields = ['id', 'creator_profile', 'skill', 'skill_id', 'level']
        read_only_fields = ['creator_profile']


class PortfolioImageSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели изображения портфолио.
    """
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioImage
        fields = ['id', 'portfolio_item', 'image', 'image_url', 'caption', 'order']
        read_only_fields = ['portfolio_item']
        extra_kwargs = {'image': {'write_only': True}}
    
    def get_image_url(self, obj):
        """Возвращает URL-адрес изображения."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class PortfolioItemSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели элемента портфолио.
    """
    images = PortfolioImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=100000),
        write_only=True,
        required=False
    )
    cover_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioItem
        fields = [
            'id', 'creator_profile', 'title', 'description',
            'cover_image', 'cover_image_url', 'external_url', 
            'images', 'uploaded_images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['creator_profile', 'created_at', 'updated_at']
        extra_kwargs = {'cover_image': {'write_only': True}}
    
    def get_cover_image_url(self, obj):
        """Возвращает URL-адрес обложки."""
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None
    
    def create(self, validated_data):
        """
        Создает новый элемент портфолио с изображениями.
        """
        uploaded_images = validated_data.pop('uploaded_images', [])
        portfolio_item = PortfolioItem.objects.create(**validated_data)
        
        # Создаем дополнительные изображения
        for i, image in enumerate(uploaded_images):
            PortfolioImage.objects.create(
                portfolio_item=portfolio_item,
                image=image,
                order=i
            )
        
        return portfolio_item
    
    def update(self, instance, validated_data):
        """
        Обновляет элемент портфолио и его изображения.
        """
        uploaded_images = validated_data.pop('uploaded_images', None)
        
        # Обновляем поля модели
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Добавляем новые изображения, если они предоставлены
        if uploaded_images:
            last_order = instance.images.aggregate(models.Max('order'))['order__max'] or 0
            
            for i, image in enumerate(uploaded_images):
                PortfolioImage.objects.create(
                    portfolio_item=instance,
                    image=image,
                    order=last_order + i + 1
                )
        
        return instance


class CreatorProfileDetailSerializer(CreatorProfileSerializer):
    """
    Расширенный сериализатор для профиля креатора с навыками и портфолио.
    """
    skills = CreatorSkillSerializer(source='creator_skills', many=True, read_only=True)
    portfolio = PortfolioItemSerializer(source='portfolio_items', many=True, read_only=True)
    
    class Meta(CreatorProfileSerializer.Meta):
        fields = CreatorProfileSerializer.Meta.fields + ['skills', 'portfolio']
    
    def to_representation(self, instance):
        """
        Добавляем навыки в виде удобного списка.
        """
        representation = super().to_representation(instance)
        
        # Формируем удобный список навыков с уровнями
        skills_list = []
        for skill_data in representation.get('skills', []):
            skills_list.append({
                'id': skill_data['id'],
                'skill_id': skill_data['skill']['id'],
                'name': skill_data['skill']['name'],
                'level': skill_data['level']
            })
        representation['skills'] = skills_list
        
        return representation


class ServiceSerializer(serializers.ModelSerializer):
    """
    Сериализатор для услуг, предоставляемых креатором.
    
    Обеспечивает сериализацию и десериализацию модели Service.
    """
    # Для вывода имени пользователя-креатора
    creator_username = serializers.SerializerMethodField(read_only=True)
    
    # Поле для приема ID профиля креатора из запроса фронтенда
    creator_profile = serializers.PrimaryKeyRelatedField(
        queryset=CreatorProfile.objects.all(),
        required=False,  # Не обязательно, т.к. может быть установлено в perform_create
        write_only=False  # Используется и для чтения и для записи
    )
    
    # Правильная обработка цены, представленной как строка или число
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        coerce_to_string=False  # Возвращаем число, а не строку
    )
    
    class Meta:
        model = Service
        fields = [
            'id', 'creator_profile', 'creator_username',
            'title', 'description', 'price', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_creator_username(self, obj):
        """
        Возвращает имя пользователя-креатора.
        """
        return obj.creator_profile.user.username if obj.creator_profile else None
        
        # Создаем услугу
        service = Service.objects.create(
            creator_profile=creator_profile,
            **validated_data
        )
        
        return service