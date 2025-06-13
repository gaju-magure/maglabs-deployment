# Migration to fix conversation_type column removal
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ideas', '0011_remove_conversation_type'),
    ]

    operations = [
        migrations.RunSQL(
            # Drop the conversation_type column if it still exists
            sql=[
                "ALTER TABLE ideas_chatsession DROP COLUMN IF EXISTS conversation_type;",
                "ALTER TABLE ideas_chattemplate DROP COLUMN IF EXISTS conversation_type;",
            ],
            reverse_sql=[
                # No reverse - we don't want to add the column back
            ]
        ),
    ]