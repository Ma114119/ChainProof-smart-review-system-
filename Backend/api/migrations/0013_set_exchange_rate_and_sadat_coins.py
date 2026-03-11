# Generated manually
from django.db import migrations


def set_exchange_rate_and_sadat(apps, schema_editor):
    SystemSettings = apps.get_model('api', 'SystemSettings')
    CustomUser = apps.get_model('api', 'CustomUser')
    # Set exchange rate: 1 RTC = 120 PKR
    SystemSettings.objects.update_or_create(key='exchange_rate', defaults={'value': '120'})
    # Credit 500 coins to customer 'sadat' for testing
    try:
        user = CustomUser.objects.get(username__iexact='sadat', role='customer')
        user.bonus_coins = (user.bonus_coins or 0) + 500
        user.save()
    except CustomUser.DoesNotExist:
        pass  # User may not exist yet


def reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_add_bonus_coins_and_support_attachment'),
    ]

    operations = [
        migrations.RunPython(set_exchange_rate_and_sadat, reverse),
    ]
