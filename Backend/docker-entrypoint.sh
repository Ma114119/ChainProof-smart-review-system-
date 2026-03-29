#!/bin/sh
set -e
# Render sets PORT; docker-compose uses 8000 by default
if [ -n "$PORT" ]; then
  export GUNICORN_BIND="0.0.0.0:${PORT}"
else
  export GUNICORN_BIND="${GUNICORN_BIND:-0.0.0.0:8000}"
fi
python manage.py collectstatic --noinput
exec gunicorn smartreview_backend.wsgi:application \
  --bind "$GUNICORN_BIND" \
  --workers "${GUNICORN_WORKERS:-2}" \
  --threads "${GUNICORN_THREADS:-4}" \
  --timeout "${GUNICORN_TIMEOUT:-120}"
