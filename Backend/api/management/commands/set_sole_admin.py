"""
Promote one user to the only ChainProof admin (role + Django superuser).
Demotes all other users with role='admin' or is_superuser=True.

Usage:
  python manage.py set_sole_admin
  python manage.py set_sole_admin --email you@example.com
"""
from django.core.management.base import BaseCommand

from api.models import CustomUser


class Command(BaseCommand):
    help = 'Set exactly one user as admin (role + superuser); demote others.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='m13211911@gmail.com',
            help='Email of the user who should be the sole admin.',
        )

    def handle(self, *args, **options):
        email = (options['email'] or '').strip().lower()
        if not email:
            self.stderr.write(self.style.ERROR('Provide a valid --email'))
            return

        try:
            admin_user = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            self.stderr.write(self.style.ERROR(f'No user found with email: {email}'))
            return

        # Demote other app-level admins (keep owners/customers as-is)
        demoted_roles = CustomUser.objects.filter(role='admin').exclude(pk=admin_user.pk).update(role='customer')
        # Demote Django superusers except target (so only one can access /admin/)
        demoted_su = 0
        for u in CustomUser.objects.filter(is_superuser=True).exclude(pk=admin_user.pk):
            u.is_superuser = False
            u.is_staff = False
            u.save(update_fields=['is_superuser', 'is_staff'])
            demoted_su += 1

        admin_user.role = 'admin'
        admin_user.is_superuser = True
        admin_user.is_staff = True
        admin_user.save(update_fields=['role', 'is_superuser', 'is_staff'])

        self.stdout.write(
            self.style.SUCCESS(
                f'Sole admin set: {admin_user.email} (username={admin_user.username})\n'
                f'  Demoted {demoted_roles} other user(s) from role=admin to customer.\n'
                f'  Cleared superuser on {demoted_su} other account(s).'
            )
        )
