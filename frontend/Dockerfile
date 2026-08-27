# ==============================================================================
# Phantix — Standalone Frontend Production Image (Nginx + React SPA)
# ==============================================================================

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Production Nginx Stage
FROM nginx:alpine

# Copy compiled React static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config for SPA routing with dynamic DNS resolution (no boot crash if backend host is unmapped)
RUN echo 'server { \
    listen 80; \
    listen 8080; \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        resolver 127.0.0.11 8.8.8.8 1.1.1.1 valid=30s ipv6=off; \
        set $backend_upstream "http://127.0.0.1:8000"; \
        proxy_pass $backend_upstream; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80 8080

CMD ["nginx", "-g", "daemon off;"]
