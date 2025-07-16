# Multi-stage build for optimized production image
FROM node:24-alpine3.19 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Run linting and tests
RUN npm run lint
RUN npm run test

# Production stage
FROM nginx:1.27-alpine3.19 AS production

# Add metadata labels for security scanning
LABEL maintainer="learnimals-team"
LABEL description="Learnimals educational web application"
LABEL version="1.0.0"

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy application files
COPY --from=builder /app/src /usr/share/nginx/html/src
COPY --from=builder /app/public /usr/share/nginx/html/public
COPY --from=builder /app/index.html /usr/share/nginx/html/
COPY --from=builder /app/package.json /usr/share/nginx/html/

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# Add health check script
COPY docker/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Create nginx cache directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d && \
    chown -R appuser:appgroup /usr/share/nginx/html

# Create PID directory for nginx
RUN mkdir -p /var/run/nginx && \
    chown -R appuser:appgroup /var/run/nginx

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]