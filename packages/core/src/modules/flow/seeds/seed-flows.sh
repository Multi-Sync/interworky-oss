#!/bin/bash

# Flow Seeding Script
# Seeds all flow configurations to the remote database

# Configuration - UPDATE THESE VALUES
API_URL="${API_URL:-https://your-api-url.com}"
TOKEN="${TOKEN:-your-jwt-token-here}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}   Flow Seeding Script${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo "API URL: $API_URL"
echo ""

# Check if token is set
if [ "$TOKEN" = "your-jwt-token-here" ]; then
    echo -e "${RED}Error: Please set the TOKEN environment variable${NC}"
    echo "Usage: TOKEN=your-jwt-token API_URL=https://api.example.com ./seed-flows.sh"
    exit 1
fi

# Array of flow files to seed
FLOW_FILES=(
    "macro-calculator.json"
    "career-plan.json"
    "resume-builder.json"
    "whats-my-vibe.json"
    "salary-reality-check.json"
    "dating-profile-fixer.json"
    "ai-roast-me.json"
    "startup-idea-validator.json"
)

# Counter for success/failure
SUCCESS=0
FAILED=0

# Seed each flow
for file in "${FLOW_FILES[@]}"; do
    filepath="$SCRIPT_DIR/$file"

    if [ ! -f "$filepath" ]; then
        echo -e "${RED}✗ File not found: $file${NC}"
        ((FAILED++))
        continue
    fi

    flow_id=$(grep -o '"flow_id": *"[^"]*"' "$filepath" | cut -d'"' -f4)
    flow_name=$(grep -o '"name": *"[^"]*"' "$filepath" | head -1 | cut -d'"' -f4)

    echo -n "Seeding: $flow_name ($flow_id)... "

    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/flows" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "@$filepath")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ Success${NC}"
        ((SUCCESS++))
    elif [ "$http_code" = "409" ] || echo "$body" | grep -q "duplicate\|already exists\|E11000"; then
        echo -e "${YELLOW}⚠ Already exists (skipped)${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}✗ Failed (HTTP $http_code)${NC}"
        echo "  Response: $body"
        ((FAILED++))
    fi
done

echo ""
echo -e "${YELLOW}================================${NC}"
echo -e "Results: ${GREEN}$SUCCESS succeeded${NC}, ${RED}$FAILED failed${NC}"
echo -e "${YELLOW}================================${NC}"

if [ $FAILED -gt 0 ]; then
    exit 1
fi
