ARG PYTHON_VERSION=3.12-slim

# ──────────────────────────────────────────────
# Stage 1: Builder — compile wheels
# ──────────────────────────────────────────────
FROM python:${PYTHON_VERSION} AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# ──────────────────────────────────────────────
# Stage 2: Development (hot-reload)
# ──────────────────────────────────────────────
FROM python:${PYTHON_VERSION} AS development
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/*
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt
COPY . .
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--log-level", "debug"]

# ──────────────────────────────────────────────
# Stage 3: Production Runner
# ──────────────────────────────────────────────
FROM python:${PYTHON_VERSION} AS production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r stadiumos && useradd -r -g stadiumos -u 1000 stadiumos
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && \
    rm -rf /wheels && \
    rm -f /requirements.txt
COPY --chown=stadiumos:stadiumos . .
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV GUNICORN_WORKERS=4
ENV GUNICORN_TIMEOUT=120
USER stadiumos
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${GUNICORN_WORKERS:-4} --timeout-keep-alive 5 --limit-max-requests 10000"]
