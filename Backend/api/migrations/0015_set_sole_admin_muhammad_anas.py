# Generated manually — promotes sole platform admin for ChainProof FYP.
# Run: python manage.py migrate
# After migrate: log out and log in again so JWT gets role=admin.

from django.db import migrations


SOLE_ADMIN_EMAIL = 'm13211911@gmail.com'


def set_sole_admin(apps, schema_editor):
    CustomUser = apps.get_model('api', 'CustomUser')
    qs = CustomUser.objects.filter(email__iexact=SOLE_ADMIN_EMAIL)
    if not qs.exists():
        return
    # Demote everyone else's app role admin → customer
    CustomUser.objects.filter(role='admin').exclude(email__iexact=SOLE_ADMIN_EMAIL).update(role='customer')
    # Clear Django superuser on everyone except target
    others = CustomUser.objects.exclude(email__iexact=SOLE_ADMIN_EMAIL)
    others.filter(is_superuser=True).update(is_superuser=False, is_staff=False)
    # Promote target
    qs.update(role='admin', is_superuser=True, is_staff=True)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_pendinguser'),
    ]

    operations = [
        migrations.RunPython(set_sole_admin, noop_reverse),
    ]
