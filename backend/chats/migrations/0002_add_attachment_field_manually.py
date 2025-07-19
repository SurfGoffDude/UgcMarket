from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('chats', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            """
            ALTER TABLE chats_message 
            ADD COLUMN IF NOT EXISTS attachment VARCHAR(255) NULL;
            """,
            """
            ALTER TABLE chats_message 
            DROP COLUMN IF EXISTS attachment;
            """
        )
    ]