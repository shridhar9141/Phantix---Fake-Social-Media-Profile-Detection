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

# Build-time API configuration (same-origin relative path in production)
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build production React assets to /app/frontend/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Python Backend + Static SPA Server
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    STATIC_DIR=/app/frontend/dist

WORKDIR /app

# Install curl for connectivity and diagnostics
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

# Expose all standard application ports for Railway networking
EXPOSE 8080 8000 80

# Start FastAPI server via production entrypoint
CMD ["python", "start.py"]
