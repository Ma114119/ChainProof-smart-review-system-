from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0015_set_sole_admin_muhammad_anas'),
    ]

    operations = [
        migrations.AddField(
            model_name='review',
            name='owner_reply',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='review',
            name='owner_replied_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
