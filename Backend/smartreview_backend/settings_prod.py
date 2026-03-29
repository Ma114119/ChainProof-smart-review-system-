"""
Production Django settings for ChainProof.

Use with: DJANGO_SETTINGS_MODULE=smartreview_backend.settings_prod

Required environment variables (see RENDER_DEPLOY.md):
  DJANGO_SECRET_KEY
  DATABASE_URL          (Render PostgreSQL internal or external URL)
  ALLOWED_HOSTS         (comma-separated)
  CORS_ALLOWED_ORIGINS  (comma-separated; include your Vercel URL)
  CSRF_TRUSTED_ORIGINS  (comma-separated HTTPS origins)
"""

from pathlib import Path
import os

from dotenv import load_dotenv

_BASE = Path(__file__).resolve().parent.parent
load_dotenv(_BASE / ".env")

# Import base configuration, then override for production.
from .settings import *  # noqa: E402, F403, F401

DEBUG = False

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "").strip()
if not SECRET_KEY:
    raise ValueError(
        "DJANGO_SECRET_KEY must be set in production. "
        "Generate one with: python -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\""
    )

# Future cloud hosts: set ALLOWED_HOSTS on the server, e.g.
# your-service.onrender.com,your-custom-domain.com
_hosts = os.getenv("ALLOWED_HOSTS", "").strip()
if _hosts:
    ALLOWED_HOSTS = [h.strip() for h in _hosts.split(",") if h.strip()]
else:
    ALLOWED_HOSTS = [
        ".onrender.com",
        "localhost",
        "127.0.0.1",
    ]

# --- Database (Render provides DATABASE_URL) ---
import dj_database_url  # noqa: E402

_ssl = os.getenv("DATABASE_SSL_REQUIRE", "true").strip().lower() in ("1", "true", "yes")
_database_url = os.getenv("DATABASE_URL", "").strip()
if not _database_url:
    raise ValueError("DATABASE_URL must be set in production.")
DATABASES = {
    "default": dj_database_url.parse(
        _database_url,
        conn_max_age=600,
        ssl_require=_ssl,
    )
}

# --- Static files (WhiteNoise) ---
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        # CompressedStaticFilesStorage avoids collectstatic manifest errors when no hashed manifest exists
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# --- CORS / CSRF (Vercel frontend + local dev if needed) ---
# Example CORS_ALLOWED_ORIGINS:
#   https://chainproof.vercel.app,https://www.yourdomain.com
_cors = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
if _cors:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-app.vercel.app",
    ]

_csrf = os.getenv("CSRF_TRUSTED_ORIGINS", "").strip()
if _csrf:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf.split(",") if o.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-app.vercel.app",
    ]

# Behind Render / other reverse proxies terminating TLS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "true").strip().lower() in (
    "1",
    "true",
    "yes",
)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
