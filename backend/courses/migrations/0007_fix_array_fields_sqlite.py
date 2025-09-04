# Generated manually to fix ArrayField compatibility with SQLite
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0006_rename_courses_categor_33f89e_idx_courses_categor_2870c7_idx_and_more'),
    ]

    operations = [
        # Remove the old ArrayField fields
        migrations.RemoveField(
            model_name='course',
            name='requirements',
        ),
        migrations.RemoveField(
            model_name='course',
            name='what_you_will_learn',
        ),
        
        # Add new TextField fields
        migrations.AddField(
            model_name='course',
            name='requirements',
            field=models.TextField(blank=True, default='[]', help_text='JSON string of requirements/prerequisites for this course'),
        ),
        migrations.AddField(
            model_name='course',
            name='what_you_will_learn',
            field=models.TextField(blank=True, default='[]', help_text='JSON string of learning objectives/outcomes'),
        ),
    ]
