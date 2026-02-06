#!/bin/bash

# Verify Local Development Environment
# Tests all health check endpoints on localhost:3000

set -e

BASE_URL="http://localhost:3000"
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

echo -e "${BOLD}=== Adapt MVP - Local Health Checks ===${NC}\n"

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
    exit 0
else
    echo -e "${RED}✗ ${failures} check(s) failed${NC}"
    exit 1
fi
