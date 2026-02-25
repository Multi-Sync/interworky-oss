#!/bin/bash

# Update Resume Builder Flow
# Sets the correct output_schema for the new modular renderer system

# Configuration - UPDATE THESE VALUES
API_URL="${API_URL:-https://your-api-url.com}"
TOKEN="${TOKEN:-your-jwt-token-here}"
ORG_ID="${ORG_ID:-default}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}   Resume Builder Update Script${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo "API URL: $API_URL"
echo "Organization: $ORG_ID"
echo ""

# Check if token is set
if [ "$TOKEN" = "your-jwt-token-here" ]; then
    echo -e "${RED}Error: Please set the TOKEN environment variable${NC}"
    echo "Usage: TOKEN=your-jwt-token API_URL=https://api.example.com ./update-resume-builder.sh"
    exit 1
fi

echo -e "${CYAN}Updating resume-builder output_schema...${NC}"
echo ""

# Update resume-builder with proper output_schema
response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/api/flows/organization/$ORG_ID/resume-builder" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
  "output_schema": {
    "type": "resume",
    "success_message": "Your Resume is Ready!",
    "theme_color": "#1f2937",
    "loading_title": "Building Your Resume...",
    "loading_subtitle": "Formatting your professional profile",
    "downloadFormats": ["pdf", "doc", "copy"],
    "dataMapping": {
      "contact": { "source": "save_contact_info", "merge": "single" },
      "education": { "source": "save_education", "merge": "array" },
      "experience": { "source": "save_work_experience", "merge": "array" },
      "skills": { "source": "save_skills", "merge": "single" },
      "summary": { "source": "generate_resume", "field": "summary", "merge": "single" }
    }
  }
}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Resume builder updated successfully${NC}"
    echo ""
    echo -e "${CYAN}New output_schema:${NC}"
    echo "  type: resume"
    echo "  downloadFormats: [pdf, doc, copy]"
    echo "  dataMapping:"
    echo "    - contact -> save_contact_info (single)"
    echo "    - education -> save_education (array)"
    echo "    - experience -> save_work_experience (array)"
    echo "    - skills -> save_skills (single)"
    echo "    - summary -> generate_resume.summary (single)"
else
    echo -e "${RED}✗ Failed to update resume builder (HTTP $http_code)${NC}"
    echo "  Response: $body"
    exit 1
fi

echo ""
echo -e "${YELLOW}================================${NC}"
echo -e "${GREEN}Done!${NC}"
echo -e "${YELLOW}================================${NC}"
