# Generated manually

from django.db import migrations

# Функция для преобразования старых значений name в значения платформ
def convert_name_to_platform(apps, schema_editor):
    # Получаем модель SocialLink в контексте миграции
    SocialLink = apps.get_model('users', 'SocialLink')
    
    # Словарь для преобразования старых названий в новые идентификаторы платформ
    name_to_platform_map = {
        'facebook': 'facebook',
        'Facebook': 'facebook',
        'FACEBOOK': 'facebook',
        'youtube': 'youtube',
        'YouTube': 'youtube', 
        'YOUTUBE': 'youtube',
        'twitter': 'twitter',
        'Twitter': 'twitter',
        'TWITTER': 'twitter',
        'instagram': 'instagram',
        'Instagram': 'instagram',
        'INSTAGRAM': 'instagram',
        'whatsapp': 'whatsapp',
        'WhatsApp': 'whatsapp',
        'WHATSAPP': 'whatsapp',
        'tiktok': 'tiktok',
        'TikTok': 'tiktok',
        'TIKTOK': 'tiktok',
        'linkedin': 'linkedin',
        'LinkedIn': 'linkedin',
        'LINKEDIN': 'linkedin',
        'Linkedin': 'linkedin',
        'telegram': 'telegram',
        'Telegram': 'telegram',
        'TELEGRAM': 'telegram',
        'pinterest': 'pinterest',
        'Pinterest': 'pinterest',
        'PINTEREST': 'pinterest',
        'reddit': 'reddit',
        'Reddit': 'reddit',
        'REDDIT': 'reddit',
        'vkontakte': 'vkontakte',
        'ВКонтакте': 'vkontakte',
        'вконтакте': 'vkontakte',
        'dzen': 'dzen',
        'Дзен': 'dzen',
        'дзен': 'dzen',
        'twitch': 'twitch',
        'Twitch': 'twitch',
        'TWITCH': 'twitch',
    }
    
    # Выведем количество ссылок до миграции
    total_links = SocialLink.objects.count()
    print(f"[MIGRATION] Всего ссылок на соцсети: {total_links}")
    
    # Обрабатываем каждую запись
    for link in SocialLink.objects.all():
        # Если у нас уже есть значение platform, пропускаем
        if hasattr(link, 'platform') and link.platform:
            continue
            
        # Получаем старое значение name
        old_name = getattr(link, 'name', None)
        if not old_name:
            print(f"[MIGRATION WARNING] Запись {link.id} не имеет значения name.")
            continue
            
        # Пытаемся преобразовать старое значение
        platform = name_to_platform_map.get(old_name)
        
        # Если не удалось преобразовать, используем стандартное значение
        if not platform:
            print(f"[MIGRATION WARNING] Неизвестное название: {old_name}, установлено как 'other'")
            platform = 'facebook'  # По умолчанию используем facebook
        
        # Устанавливаем новое значение
        link.platform = platform
        link.save()
        
        print(f"[MIGRATION] Преобразовано: {old_name} -> {platform}")

# Пустая функция для отката миграции (если потребуется)
def reverse_conversion(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_alter_sociallink_unique_together_sociallink_platform_and_more'),
    ]

    operations = [
        migrations.RunPython(convert_name_to_platform, reverse_conversion),
    ]