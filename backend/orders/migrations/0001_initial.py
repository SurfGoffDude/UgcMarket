# Generated by Django 5.2.3 on 2025-06-22 16:55

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Delivery',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(blank=True, null=True, verbose_name='комментарий')),
                ('is_final', models.BooleanField(default=False, verbose_name='финальная версия')),
                ('client_approved', models.BooleanField(default=False, verbose_name='одобрено клиентом')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='дата обновления')),
            ],
            options={
                'verbose_name': 'сдача работы',
                'verbose_name_plural': 'сдачи работ',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='DeliveryFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='orders/deliveries/', verbose_name='файл')),
                ('file_name', models.CharField(max_length=255, verbose_name='имя файла')),
                ('file_type', models.CharField(max_length=100, verbose_name='тип файла')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='дата загрузки')),
            ],
            options={
                'verbose_name': 'файл сдачи',
                'verbose_name_plural': 'файлы сдачи',
            },
        ),
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='заголовок')),
                ('description', models.TextField(verbose_name='описание')),
                ('budget', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='бюджет')),
                ('deadline', models.DateField(verbose_name='срок выполнения')),
                ('status', models.CharField(choices=[('draft', 'Черновик'), ('published', 'Опубликован'), ('in_progress', 'В работе'), ('on_review', 'На проверке'), ('completed', 'Выполнен'), ('canceled', 'Отменен')], default='draft', max_length=20, verbose_name='статус')),
                ('is_private', models.BooleanField(default=False, verbose_name='приватный')),
                ('views_count', models.PositiveIntegerField(default=0, verbose_name='количество просмотров')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='дата обновления')),
                ('with_modifications', models.BooleanField(default=False, verbose_name='с правками')),
                ('modifications_description', models.TextField(blank=True, null=True, verbose_name='описание правок')),
            ],
            options={
                'verbose_name': 'заказ',
                'verbose_name_plural': 'заказы',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='OrderAttachment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='orders/attachments/', verbose_name='файл')),
                ('file_name', models.CharField(max_length=255, verbose_name='имя файла')),
                ('file_type', models.CharField(max_length=100, verbose_name='тип файла')),
                ('description', models.TextField(blank=True, null=True, verbose_name='описание')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='дата загрузки')),
            ],
            options={
                'verbose_name': 'приложение к заказу',
                'verbose_name_plural': 'приложения к заказу',
            },
        ),
        migrations.CreateModel(
            name='OrderResponse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField(verbose_name='сообщение')),
                ('price', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='предложенная цена')),
                ('timeframe', models.PositiveIntegerField(verbose_name='срок выполнения (дни)')),
                ('status', models.CharField(choices=[('pending', 'На рассмотрении'), ('accepted', 'Принят'), ('rejected', 'Отклонен')], default='pending', max_length=20, verbose_name='статус')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='дата обновления')),
            ],
            options={
                'verbose_name': 'отклик на заказ',
                'verbose_name_plural': 'отклики на заказ',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Review',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.PositiveSmallIntegerField(choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')], verbose_name='рейтинг')),
                ('comment', models.TextField(verbose_name='комментарий')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='дата создания')),
            ],
            options={
                'verbose_name': 'отзыв',
                'verbose_name_plural': 'отзывы',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, verbose_name='название')),
                ('slug', models.SlugField(unique=True, verbose_name='слаг')),
            ],
            options={
                'verbose_name': 'тег',
                'verbose_name_plural': 'теги',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='название')),
                ('slug', models.SlugField(max_length=100, unique=True, verbose_name='слаг')),
                ('description', models.TextField(blank=True, null=True, verbose_name='описание')),
                ('image', models.ImageField(blank=True, null=True, upload_to='categories/', verbose_name='изображение')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='children', to='orders.category', verbose_name='родительская категория')),
            ],
            options={
                'verbose_name': 'категория',
                'verbose_name_plural': 'категории',
                'ordering': ['name'],
            },
        ),
    ]
