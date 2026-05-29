FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile --ignore-scripts

COPY . .

ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL \
    VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

RUN npm run build


FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    server_tokens off;

    add_header X-Frame-Options         "SAMEORIGIN"                      always;
    add_header X-Content-Type-Options  "nosniff"                         always;
    add_header X-XSS-Protection        "1; mode=block"                   always;
    add_header Referrer-Policy         "strict-origin-when-cross-origin" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass         http://backend:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|svg|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ /\. { deny all; }
}
EOF

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]