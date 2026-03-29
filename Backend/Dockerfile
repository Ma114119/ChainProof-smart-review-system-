# ChainProof backend — Python, dependencies, Gunicorn (PostgreSQL via DATABASE_URL / docker-compose)
FROM python:3.11-slim-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=smartreview_backend.settings_prod

# System libraries for psycopg2 and common wheels (torch/transformers may need more RAM at build time)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY manage.py .
COPY smartreview_backend/ ./smartreview_backend/
COPY api/ ./api/

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/docker-entrypoint.sh"]
