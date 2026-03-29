# Deploying ChainProof backend (Render + PostgreSQL)

This guide covers **environment variables**, **database migrations**, and **CORS** for hosting the Django API on [Render](https://render.com) with a **Vercel** frontend.

## 1. Create a PostgreSQL database on Render

1. In the Render dashboard, create a **PostgreSQL** instance.
2. After it is ready, copy the **Internal Database URL** (or **External** if required by your plan). Render provides this as a single connection string.

## 2. Create a Web Service (backend)

Use **Docker** (recommended, matches this repo’s `Backend/Dockerfile`) or **Python** native build.

### Environment variables (required)

| Variable | Example / notes |
|----------|-----------------|
| `DJANGO_SETTINGS_MODULE` | `smartreview_backend.settings_prod` |
| `DJANGO_SECRET_KEY` | Long random string. Generate locally: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DATABASE_URL` | Paste Render’s PostgreSQL URL (usually includes `sslmode=require`). |
| `DATABASE_SSL_REQUIRE` | `true` for Render’s managed Postgres (default in `settings_prod`). Use `false` only for local Docker. |
| `ALLOWED_HOSTS` | Comma-separated, no scheme: `chainproof-api.onrender.com,yourdomain.com` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated **full URLs** of your Vercel app: `https://your-app.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | Same as CORS for HTTPS origins you use in the browser: `https://your-app.vercel.app` |
| `PORT` | Set automatically by Render; do not override. |

Optional email / OTP variables (same as local `.env`): `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `USE_CONSOLE_EMAIL`, etc.

### Start command (if not using Docker)

If you deploy with a **Python** environment instead of Docker:

```bash
gunicorn smartreview_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120
```

Install dependencies from `Backend/requirements.txt` and set `DJANGO_SETTINGS_MODULE` as above.

---

## 2a. Database migrations on Render (create tables)

Migrations are **not** run automatically on every deploy unless you add a step. Run them once after the first deploy (or after pulling new migrations).

### Option A — Render Shell (simplest)

1. Open your **Web Service** → **Shell** (or **SSH** if enabled).
2. Run:

```bash
cd /path/to/app   # if needed; Render often uses /opt/render/project/src/Backend or similar
export DJANGO_SETTINGS_MODULE=smartreview_backend.settings_prod
python manage.py migrate
```

Ensure the same `DATABASE_URL` (and other env vars) are available in that shell context—usually they are inherited from the service.

### Option B — One-off release command

In the service settings, you can use a **Deploy hook** or set **Build Command** / **Start Command** to run migrate before Gunicorn, for example:

```bash
python manage.py migrate && gunicorn smartreview_backend.wsgi:application --bind 0.0.0.0:$PORT
```

**Note:** Running migrate on every instance start is fine for a single worker; for multiple instances, prefer one release job or migrate manually to avoid concurrent migration locks.

### Verify

```bash
python manage.py showmigrations
```

---

## 3. Static files

`settings_prod` uses **WhiteNoise**. The Docker `docker-entrypoint.sh` runs `collectstatic` before Gunicorn. For non-Docker Render deploys, add to build or start:

```bash
python manage.py collectstatic --noinput
```

---

## 4. Frontend on Vercel

In the Vercel project **Environment Variables**, set:

```text
REACT_APP_API_URL=https://your-backend-name.onrender.com
```

No trailing slash. Rebuild the site after changing this value.

---

## 5. CORS checklist

- `CORS_ALLOWED_ORIGINS` on Render must include your exact Vercel URL, e.g. `https://chainproof.vercel.app`.
- Use **https** in production (no `http` for the live Vercel URL unless you know you need it).
- If you add a custom domain on Vercel, add that origin too (comma-separated).

---

## 6. Local Docker (optional)

From the `Backend` folder:

```bash
docker compose up --build
```

Then run migrations inside the web container once:

```bash
docker compose exec web python manage.py migrate
```

Use `DATABASE_SSL_REQUIRE=false` in `docker-compose.yml` (already set) for the internal Postgres service.
