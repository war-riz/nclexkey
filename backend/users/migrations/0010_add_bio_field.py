# Generated manually to add missing bio field
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_add_django_user_fields'),
    ]

    operations = [
        # Add bio field
        migrations.AddField(
            model_name='user',
            name='bio',
            field=models.TextField(blank=True, null=True),
        ),
    ]
