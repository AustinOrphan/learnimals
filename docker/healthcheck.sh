#!/bin/sh

# Health check script for the Learnimals application
# This script performs comprehensive health checks to ensure the application is running properly

set -e

# Configuration
HEALTH_ENDPOINT="http://localhost:8080/health"
APP_ENDPOINT="http://localhost:8080/"
TIMEOUT=10
MAX_RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local timeout=${3:-$TIMEOUT}
    
    log "Checking endpoint: $url"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        log "${GREEN}✓${NC} Endpoint $url responded with status $response"
        return 0
    else
        log "${RED}✗${NC} Endpoint $url responded with status $response (expected $expected_status)"
        return 1
    fi
}

check_nginx_process() {
    log "Checking nginx process..."
    
    if pgrep nginx > /dev/null; then
        log "${GREEN}✓${NC} Nginx process is running"
        return 0
    else
        log "${RED}✗${NC} Nginx process is not running"
        return 1
    fi
}

check_disk_space() {
    log "Checking disk space..."
    
    # Check if disk usage is below 90%
    disk_usage=$(df /usr/share/nginx/html | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 90 ]; then
        log "${GREEN}✓${NC} Disk usage is $disk_usage% (acceptable)"
        return 0
    else
        log "${YELLOW}⚠${NC} Disk usage is $disk_usage% (high)"
        return 1
    fi
}

check_memory_usage() {
    log "Checking memory usage..."
    
    # Check if memory usage is below 90%
    memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$memory_usage" -lt 90 ]; then
        log "${GREEN}✓${NC} Memory usage is $memory_usage% (acceptable)"
        return 0
    else
        log "${YELLOW}⚠${NC} Memory usage is $memory_usage% (high)"
        return 1
    fi
}

check_static_files() {
    log "Checking static files..."
    
    # Check if main application files exist
    files_to_check="
        /usr/share/nginx/html/index.html
        /usr/share/nginx/html/src/main.js
        /usr/share/nginx/html/public/manifest.json
    "
    
    for file in $files_to_check; do
        if [ -f "$file" ]; then
            log "${GREEN}✓${NC} File exists: $file"
        else
            log "${RED}✗${NC} File missing: $file"
            return 1
        fi
    done
    
    return 0
}

# Main health check function
main() {
    log "Starting health check for Learnimals application..."
    
    # Track failures
    failures=0
    
    # Basic checks
    check_nginx_process || failures=$((failures + 1))
    check_static_files || failures=$((failures + 1))
    
    # System resource checks
    check_disk_space || failures=$((failures + 1))
    check_memory_usage || failures=$((failures + 1))
    
    # Endpoint checks with retries
    retry_count=0
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if check_endpoint "$HEALTH_ENDPOINT" 200; then
            break
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            log "${YELLOW}⚠${NC} Retrying health endpoint check ($retry_count/$MAX_RETRIES)..."
            sleep 2
        else
            failures=$((failures + 1))
        fi
    done
    
    # Check main application endpoint
    retry_count=0
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if check_endpoint "$APP_ENDPOINT" 200; then
            break
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            log "${YELLOW}⚠${NC} Retrying app endpoint check ($retry_count/$MAX_RETRIES)..."
            sleep 2
        else
            failures=$((failures + 1))
        fi
    done
    
    # Final assessment
    if [ $failures -eq 0 ]; then
        log "${GREEN}✓${NC} All health checks passed - application is healthy"
        exit 0
    elif [ $failures -le 2 ]; then
        log "${YELLOW}⚠${NC} Some health checks failed ($failures), but application may still be functional"
        exit 0
    else
        log "${RED}✗${NC} Multiple health checks failed ($failures) - application is unhealthy"
        exit 1
    fi
}

# Run main function
main