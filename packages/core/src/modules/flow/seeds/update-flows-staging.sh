#!/bin/bash

# Flow Update Script for Staging
# Reads the full flow JSON files and updates staging via API

# Configuration
API_URL="${API_URL:-https://staging.interworky.com/api-core}"
TOKEN="${TOKEN:-your-jwt-token-here}"
ORG_ID="${ORG_ID:-default}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}   Flow Update Script (Staging)${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo "API URL: $API_URL"
echo "Organization: $ORG_ID"
echo "Script Dir: $SCRIPT_DIR"
echo ""

if [ "$TOKEN" = "your-jwt-token-here" ]; then
    echo -e "${RED}Error: Please set TOKEN environment variable${NC}"
    exit 1
fi

SUCCESS=0
FAILED=0

FLOWS=("resume-builder" "career-plan" "macro-calculator" "ai-roast-me" "whats-my-vibe" "salary-reality-check" "startup-idea-validator" "dating-profile-fixer")

for flow_id in "${FLOWS[@]}"; do
    JSON_FILE="$SCRIPT_DIR/$flow_id.json"

    if [ ! -f "$JSON_FILE" ]; then
        echo -e "${RED}File not found: $JSON_FILE${NC}"
        ((FAILED++))
        continue
    fi

    echo -n "Updating: $flow_id... "

    # Remove flow_id and organization_id from JSON, then send
    PAYLOAD=$(jq 'del(.flow_id, .organization_id)' "$JSON_FILE")

    response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/api/flows/organization/$ORG_ID/$flow_id" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$PAYLOAD")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Success${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}✗ Failed (HTTP $http_code)${NC}"
        echo "  Error: $(echo "$body" | jq -r '.error // .message // .' 2>/dev/null || echo "$body")"
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
