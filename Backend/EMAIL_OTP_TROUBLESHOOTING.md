# OTP Email Not Received? Troubleshooting Guide

## 1. Check your backend terminal

When `DEBUG=True`, the OTP is printed to the console when the email is sent:

```
[DEV] OTP sent to your@email.com: 123456
```

If the email fails to send, the OTP is also printed so you can still test:

```
[DEV] Email failed. OTP for your@email.com: 123456 (use this to test)
```

**Check your terminal where `python manage.py runserver` is running.** You can use the printed OTP to verify registration.

---

## 2. Gmail App Password (most common fix)

Gmail requires an **App Password** (not your regular password) when using SMTP:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App passwords** (search for it in settings)
4. Create a new App Password for "Mail"
5. Copy the 16-character code (e.g. `vtxo apre tgdh ecvl`)
6. Put it in `.env` as `EMAIL_HOST_PASSWORD`
   - With spaces: `EMAIL_HOST_PASSWORD="vtxo apre tgdh ecvl"`
   - Without spaces: `EMAIL_HOST_PASSWORD=vtxoapretgdhecvl` (both work)

---

## 3. Check spam folder

OTP emails can land in **Spam** or **Promotions**. Check those folders.

---

## 4. Verify .env is loaded

- Ensure `.env` is in the `Backend/` folder (same level as `manage.py`)
- Restart the Django server after changing `.env`

---

## 5. Test email manually

Run in Django shell:

```bash
cd Backend
python manage.py shell
```

```python
from django.core.mail import send_mail
send_mail('Test', 'Hello', 'chainproof.verify@gmail.com', ['your-email@gmail.com'], fail_silently=False)
```

If the shell command fails, you'll see the exact error (e.g. authentication error).

---

## 6. Resend OTP button

If the code expired, use the **Resend OTP** button on the verification screen instead of going back to the form.
