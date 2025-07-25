# Generated by Django 5.2.3 on 2025-07-19 12:57

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chats', '0004_remove_chat_order'),
        ('orders', '0009_order_chat'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='chat',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='orders', to='chats.chat', verbose_name='чат'),
        ),
    ]
