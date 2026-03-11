from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_remove_wallet_unique_for_demo'),
    ]

    operations = [
        migrations.CreateModel(
            name='OwnerCoinPurchaseRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('coins_requested', models.IntegerField()),
                ('amount_paid_pkr', models.DecimalField(decimal_places=2, max_digits=12)),
                ('wallet_address', models.CharField(max_length=42)),
                ('payment_method', models.CharField(blank=True, max_length=50)),
                ('provider_name', models.CharField(blank=True, max_length=100)),
                ('account_title', models.CharField(blank=True, max_length=150)),
                ('account_number', models.CharField(blank=True, max_length=50)),
                ('status', models.CharField(default='Pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('business', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='coin_purchase_requests', to='api.business')),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='coin_purchase_requests', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='CustomerPayoutRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('coins_to_sell', models.IntegerField()),
                ('payment_method', models.CharField(blank=True, max_length=50)),
                ('provider_name', models.CharField(blank=True, max_length=100)),
                ('account_title', models.CharField(blank=True, max_length=150)),
                ('account_number', models.CharField(blank=True, max_length=50)),
                ('status', models.CharField(default='Pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payout_requests', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
