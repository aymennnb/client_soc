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

USER root

RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_name localhost;

    root  /usr/share/nginx/html;
    index index.html;

    server_tokens off;

    add_header X-Frame-Options         "SAMEORIGIN"                      always;
    add_header X-Content-Type-Options  "nosniff"                         always;
    add_header X-XSS-Protection        "1; mode=block"                   always;
    add_header Referrer-Policy         "strict-origin-when-cross-origin" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|svg|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ /\. { deny all; }
}
EOF

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /etc/nginx/conf.d

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]