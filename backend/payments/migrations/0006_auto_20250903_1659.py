# Generated manually to fix payment model fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0005_alter_payment_course_alter_payment_user'),
    ]

    operations = [
        # Make user field nullable for student registration
        migrations.AlterField(
            model_name='payment',
            name='user',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='payments',
                to='users.user',
                help_text='User can be null for student registration payments'
            ),
        ),
        # Make course field nullable for student registration
        migrations.AlterField(
            model_name='payment',
            name='course',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='payments',
                to='courses.course',
                help_text='Course can be null for student registration payments'
            ),
        ),
    ]
