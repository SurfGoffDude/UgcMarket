# Generated by Django 5.2.3 on 2025-07-19 07:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chats', '0002_add_attachment_field_manually'),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemMessageTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event', models.CharField(choices=[('order_accepted', 'Заказ принят'), ('order_completed', 'Заказ завершен'), ('order_cancelled', 'Заказ отменен'), ('delivery_created', 'Создана поставка'), ('delivery_accepted', 'Поставка принята'), ('delivery_rejected', 'Поставка отклонена')], max_length=50, unique=True, verbose_name='событие')),
                ('template', models.TextField(help_text='Используйте переменные в формате {variable_name}', verbose_name='шаблон сообщения')),
            ],
            options={
                'verbose_name': 'шаблон системного сообщения',
                'verbose_name_plural': 'шаблоны системных сообщений',
            },
        ),
        migrations.AlterUniqueTogether(
            name='chat',
            unique_together=set(),
        ),
        migrations.AlterField(
            model_name='chat',
            name='is_active',
            field=models.BooleanField(default=True, help_text='Указывает, активен ли чат', verbose_name='активен'),
        ),
        migrations.AlterField(
            model_name='message',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, verbose_name='дата создания'),
        ),
    ]
