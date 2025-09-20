# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS build
WORKDIR /app

ARG REACT_APP_CHAIN_RPC
ARG REACT_APP_CONTRACT_ADDRESS
ENV REACT_APP_CHAIN_RPC=${REACT_APP_CHAIN_RPC}
ENV REACT_APP_CONTRACT_ADDRESS=${REACT_APP_CONTRACT_ADDRESS}

# Copy package manifest and local shim required for install
COPY package.json ./
COPY shims ./shims
RUN npm install --no-audit --no-fund

# Copy app sources
COPY public ./public
COPY src ./src

ENV CI=true
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html

# Provide a default nginx config optimized for single-page apps
RUN rm /etc/nginx/conf.d/default.conf
COPY --link <<'EOF' /etc/nginx/conf.d/default.conf
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;

  location / {
    try_files $uri /index.html;
  }

  location /healthz {
    return 200 'ok';
    add_header Content-Type text/plain;
  }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
