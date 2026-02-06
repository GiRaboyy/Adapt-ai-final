#!/bin/bash

# Verify Production Deployment
# Tests all health check endpoints on a deployed URL
# Usage: ./verify_prod.sh https://your-deployment.vercel.app

set -e

if [ -z "$1" ]; then
    echo "Error: No URL provided"
    echo "Usage: ./verify_prod.sh https://your-deployment.vercel.app"
    exit 1
fi

BASE_URL="$1"
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

echo -e "${BOLD}=== Adapt MVP - Production Health Checks ===${NC}"
echo -e "Target: ${BASE_URL}\n"

# Function to check endpoint
check_endpoint() {
    local method=$1
    local endpoint=$2
    local name=$3
    
    echo -e "${YELLOW}Testing:${NC} ${name}"
    echo -e "  ${method} ${BASE_URL}${endpoint}"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "  ${GREEN}✓ Status: ${http_code}${NC}"
        echo -e "  Response: ${body}" | head -n 1
        echo ""
        return 0
    else
        echo -e "  ${RED}✗ Status: ${http_code}${NC}"
        echo -e "  Response: ${body}"
        echo ""
        return 1
    fi
}

# Track failures
failures=0

# Test 1: API Health
check_endpoint "GET" "/api/health" "API Health Check" || ((failures++))

# Test 2: Supabase Health
check_endpoint "GET" "/api/supabase/health" "Database Connectivity" || ((failures++))

# Test 3: Storage Health
check_endpoint "GET" "/api/storage/health" "Storage Bucket Check" || ((failures++))

# Test 4: Test Upload
check_endpoint "POST" "/api/storage/test-upload" "Test File Upload" || ((failures++))

# Summary
echo -e "${BOLD}=== Summary ===${NC}"
if [ $failures -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo -e "Production deployment is healthy."
    exit 0
else
    echo -e "${RED}✗ ${failures} check(s) failed${NC}"
    echo -e "Production deployment has issues."
    exit 1
fi
