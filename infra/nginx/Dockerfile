FROM nginx:alpine
# Copy your existing config (named nginx.config) to the expected nginx.conf path
COPY infra/nginx/nginx.config /etc/nginx/conf.d/default.conf
# Ship the frontend page
COPY frontend/index.html /usr/share/nginx/html/index.html
