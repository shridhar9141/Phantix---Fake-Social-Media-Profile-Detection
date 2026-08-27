# ==============================================================================
# Phantix — Production Multi-Stage Dockerfile
# Stage 1: Build React Production SPA Bundle
# Stage 2: Production Python Runtime with FastAPI serving React SPA + API
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Frontend Builder
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependency specifications
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source files
COPY frontend/ ./

# Build arguments for Vite environment variables with fallback defaults
ARG VITE_FIREBASE_API_KEY=AIzaSyAYwHbLX1HEPIuovsXdafa6uOHkA9mWAnU
ARG VITE_FIREBASE_AUTH_DOMAIN=fake-social-media-detect-4bf0a.firebaseapp.com
ARG VITE_FIREBASE_PROJECT_ID=fake-social-media-detect-4bf0a
ARG VITE_FIREBASE_STORAGE_BUCKET=fake-social-media-detect-4bf0a.firebasestorage.app
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=382068959219
ARG VITE_FIREBASE_APP_ID=1:382068959219:web:f01741f1c608c82ecf9486
ARG VITE_API_BASE_URL=/api/v1

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build production React assets to /app/frontend/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Python Backend + Static SPA Server
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    PORT=8000 \
    STATIC_DIR=/app/frontend/dist

WORKDIR /app

# Install curl for container health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application code
COPY backend/ /app/backend/

# Copy compiled React frontend bundle from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend

# Expose container port (dynamic in Railway)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start FastAPI server via start.py
CMD ["python", "start.py"]
