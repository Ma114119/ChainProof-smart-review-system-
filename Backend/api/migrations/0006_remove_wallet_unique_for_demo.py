# FYP Demo: Allow same MetaMask wallet for multiple accounts (one person acting as all users)
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_business_images_email_user_phone'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='wallet_address',
            field=models.CharField(blank=True, max_length=42, null=True),
        ),
    ]
