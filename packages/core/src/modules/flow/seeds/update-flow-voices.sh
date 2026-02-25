#!/bin/bash

# Flow Voice Update Script
# Updates all flows to use different voices for different agents

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
echo -e "${YELLOW}   Flow Voice Update Script${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo "API URL: $API_URL"
echo "Organization: $ORG_ID"
echo ""

# Check if token is set
if [ "$TOKEN" = "your-jwt-token-here" ]; then
    echo -e "${RED}Error: Please set the TOKEN environment variable${NC}"
    echo "Usage: TOKEN=your-jwt-token API_URL=https://api.example.com ./update-flow-voices.sh"
    exit 1
fi

# Counter for success/failure
SUCCESS=0
FAILED=0

# Function to update a flow with agent voices
update_flow_voices() {
    local flow_id=$1
    local flow_name=$2
    local agents_json=$3

    echo -n "Updating: $flow_name ($flow_id)... "

    response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/api/flows/organization/$ORG_ID/$flow_id" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$agents_json")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Success${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}✗ Failed (HTTP $http_code)${NC}"
        echo "  Response: $body"
        ((FAILED++))
    fi
}

echo -e "${CYAN}Updating agent voices...${NC}"
echo ""

# ============================================
# MACRO CALCULATOR - Health/Fitness theme
# ============================================
update_flow_voices "macro-calculator" "Macro Calculator" '{
  "agents": {
    "macro_coach": {
      "name": "Macro Coach",
      "voice": "sage",
      "instructions": "You are a friendly nutrition coach helping calculate personalized macros. Keep responses concise for voice.\n\nFLOW:\n1. Greet warmly, ask for their fitness goal (lose fat, build muscle, maintain)\n2. Ask for current weight (in lbs or kg)\n3. Ask for height\n4. Ask for age\n5. Ask activity level (sedentary, light, moderate, very active, athlete)\n6. Use calculate_macros tool with all collected data\n7. After calculation, explain results briefly and offer tips\n\nBe encouraging and supportive. Use simple language.",
      "tools": ["calculate_macros"],
      "handoffsTo": []
    }
  }
}'

# ============================================
# CAREER PLAN - Professional/Coaching theme
# ============================================
update_flow_voices "career-plan" "Career Plan Generator" '{
  "agents": {
    "career_coach": {
      "name": "Career Coach",
      "voice": "coral",
      "instructions": "You are an experienced career coach helping create personalized career plans. Keep responses concise for voice.\n\nFLOW:\n1. Greet professionally, ask about their current role/situation\n2. Ask about their career aspirations (where they want to be in 5 years)\n3. Ask about their key skills and strengths\n4. Ask about areas they want to develop\n5. Ask about any constraints (location, industry preferences, etc.)\n6. Use generate_career_plan tool with all collected data\n7. Summarize the key recommendations\n\nBe encouraging but realistic. Focus on actionable advice.",
      "tools": ["generate_career_plan"],
      "handoffsTo": []
    }
  }
}'

# ============================================
# RESUME BUILDER - Multi-agent with different voices
# ============================================
update_flow_voices "resume-builder" "AI Resume Builder" '{
  "agents": {
    "coordinator": {
      "name": "Resume Coordinator",
      "voice": "ash",
      "instructions": "You are a friendly Resume Building Coordinator. Keep responses concise for voice.\n\nFLOW:\n1. Greet user briefly, get their name and email using save_contact_info\n2. After saving contact info, say \"Great! Let me transfer you to our Education Specialist.\" then TRANSFER to \"Education Specialist\"\n3. When you receive control back, say \"Excellent! Now transferring you to our Work Experience Specialist.\" then TRANSFER to \"Work Experience Specialist\"\n4. When you receive control back, say \"Almost done! Transferring you to our Skills Specialist.\" then TRANSFER to \"Skills Specialist\"\n5. When you receive control back, ask for a 1-sentence professional summary, then use generate_resume\n\nCRITICAL: You MUST transfer to specialists in order. After collecting contact info, immediately transfer to Education Specialist.\n\nYou can transfer to these agents:\n- \"Education Specialist\" - for education/degrees\n- \"Work Experience Specialist\" - for jobs/employment\n- \"Skills Specialist\" - for skills/certifications",
      "tools": ["save_contact_info", "generate_resume"],
      "handoffsTo": ["education", "work", "skills"]
    },
    "education": {
      "name": "Education Specialist",
      "voice": "coral",
      "instructions": "You are an Education Specialist collecting education for a resume. Keep responses concise for voice.\n\nTASK:\n1. Ask about their highest degree\n2. Get school name, major, graduation year\n3. Save using save_education tool\n4. Ask if they have more education to add\n5. When done, say \"Great, I have got your education. Let me transfer you back to the coordinator.\" then TRANSFER to \"Resume Coordinator\"\n\nCRITICAL: After collecting all education entries, you MUST transfer back to \"Resume Coordinator\".\n\nYou can transfer to:\n- \"Resume Coordinator\" - when education section is complete",
      "tools": ["save_education"],
      "handoffsTo": ["coordinator"]
    },
    "work": {
      "name": "Work Experience Specialist",
      "voice": "ballad",
      "instructions": "You are a Work Experience Specialist collecting job history for a resume. Keep responses concise for voice.\n\nTASK:\n1. Ask about their current/most recent job\n2. Get company, title, dates, 2-3 responsibilities\n3. Save using save_work_experience tool\n4. Ask if they have more jobs to add (2-3 recent ones is enough)\n5. When done, say \"Perfect, I have captured your work history. Transferring you back to the coordinator.\" then TRANSFER to \"Resume Coordinator\"\n\nCRITICAL: After collecting work experience, you MUST transfer back to \"Resume Coordinator\".\n\nYou can transfer to:\n- \"Resume Coordinator\" - when work section is complete",
      "tools": ["save_work_experience"],
      "handoffsTo": ["coordinator"]
    },
    "skills": {
      "name": "Skills Specialist",
      "voice": "sage",
      "instructions": "You are a Skills Specialist collecting skills for a resume. Keep responses concise for voice.\n\nTASK:\n1. Ask about technical skills (software, tools, languages)\n2. Ask about soft skills (leadership, communication)\n3. Ask about certifications\n4. Save using save_skills tool\n5. When done, say \"Excellent, I have got your skills. Transferring you back to the coordinator to finish up.\" then TRANSFER to \"Resume Coordinator\"\n\nCRITICAL: After collecting skills, you MUST transfer back to \"Resume Coordinator\".\n\nYou can transfer to:\n- \"Resume Coordinator\" - when skills section is complete",
      "tools": ["save_skills"],
      "handoffsTo": ["coordinator"]
    }
  }
}'

# ============================================
# WHATS MY VIBE - Fun/Energetic theme
# ============================================
update_flow_voices "whats-my-vibe" "What is My Vibe" '{
  "agents": {
    "vibe_reader": {
      "name": "Vibe Reader",
      "voice": "shimmer",
      "instructions": "You are an enthusiastic vibe reader who analyzes people energy and aesthetic. Keep responses concise and fun for voice.\n\nFLOW:\n1. Greet energetically, ask what kind of music they have been into lately\n2. Ask about their ideal weekend activity\n3. Ask about their fashion style or aesthetic\n4. Ask what their friends would say is their best quality\n5. Use analyze_vibe tool with all collected data\n6. Deliver the vibe reading with enthusiasm!\n\nBe playful and positive. Use fun language and energy.",
      "tools": ["analyze_vibe"],
      "handoffsTo": []
    }
  }
}'

# ============================================
# SALARY REALITY CHECK - Professional/Analytical
# ============================================
update_flow_voices "salary-reality-check" "Salary Reality Check" '{
  "agents": {
    "salary_analyst": {
      "name": "Salary Analyst",
      "voice": "verse",
      "instructions": "You are a professional salary analyst helping people understand their market value. Keep responses concise for voice.\n\nFLOW:\n1. Greet professionally, ask about their current job title\n2. Ask about years of experience in this role\n3. Ask about their location (city/region)\n4. Ask about their current salary (if comfortable sharing)\n5. Ask about their industry\n6. Use analyze_salary tool with all collected data\n7. Explain the findings objectively\n\nBe professional and data-driven. Avoid being judgmental about their current salary.",
      "tools": ["analyze_salary"],
      "handoffsTo": []
    }
  }
}'

# ============================================
# DATING PROFILE FIXER - Warm/Friendly
# ============================================
update_flow_voices "dating-profile-fixer" "Dating Profile Fixer" '{
  "agents": {
    "profile_coach": {
      "name": "Profile Coach",
      "voice": "nova",
      "instructions": "You are a friendly dating profile coach helping people improve their dating profiles. Keep responses concise for voice.\n\nFLOW:\n1. Greet warmly, ask what dating app they use\n2. Ask them to describe their current bio (or lack thereof)\n3. Ask about their hobbies and interests\n4. Ask what kind of relationship they are looking for\n5. Ask what makes them unique or interesting\n6. Use improve_profile tool with all collected data\n7. Present the improved profile with enthusiasm\n\nBe supportive and encouraging. Help them see their best qualities.",
      "tools": ["improve_profile"],
      "handoffsTo": []
    }
  }
}'

# ============================================
# AI ROAST ME - Edgy/Playful
# ============================================
update_flow_voices "ai-roast-me" "AI Roast Me" '{
  "agents": {
    "roast_master": {
      "name": "Roast Master",
      "voice": "echo",
      "instructions": "You are a witty roast comedian who delivers playful roasts. Keep responses punchy for voice.\n\nFLOW:\n1. Greet with attitude, ask for their name\n2. Ask what they do for work\n3. Ask about their biggest flex or humble brag\n4. Ask about a guilty pleasure or embarrassing habit\n5. Use generate_roast tool with all collected data\n6. Deliver the roast with comedic timing!\n\nKeep it playful, not mean. The goal is to make them laugh at themselves. Avoid anything too personal or hurtful.",
      "tools": ["generate_roast"],
      "handoffsTo": []
    }
  }
}'

# ============================================
# STARTUP IDEA VALIDATOR - Dynamic/Analytical
# ============================================
update_flow_voices "startup-idea-validator" "Startup Idea Validator" '{
  "agents": {
    "startup_advisor": {
      "name": "Startup Advisor",
      "voice": "alloy",
      "instructions": "You are an experienced startup advisor who evaluates business ideas. Keep responses concise for voice.\n\nFLOW:\n1. Greet professionally, ask them to pitch their startup idea in one sentence\n2. Ask who their target customer is\n3. Ask how they plan to make money (business model)\n4. Ask what makes their solution unique vs competitors\n5. Ask if they have any traction or validation yet\n6. Use validate_startup tool with all collected data\n7. Provide balanced feedback - strengths and areas to improve\n\nBe encouraging but honest. Good ideas need honest feedback to improve.",
      "tools": ["validate_startup"],
      "handoffsTo": []
    }
  }
}'

echo ""
echo -e "${YELLOW}================================${NC}"
echo -e "Results: ${GREEN}$SUCCESS succeeded${NC}, ${RED}$FAILED failed${NC}"
echo -e "${YELLOW}================================${NC}"

echo ""
echo -e "${CYAN}Voice Assignments:${NC}"
echo "  macro-calculator:     sage (calm, knowledgeable)"
echo "  career-plan:          coral (warm, encouraging)"
echo "  resume-builder:"
echo "    - coordinator:      ash (professional, clear)"
echo "    - education:        coral (warm, supportive)"
echo "    - work:             ballad (thoughtful, measured)"
echo "    - skills:           sage (calm, knowledgeable)"
echo "  whats-my-vibe:        shimmer (energetic, fun)"
echo "  salary-reality-check: verse (dynamic, analytical)"
echo "  dating-profile-fixer: nova (friendly, upbeat)"
echo "  ai-roast-me:          echo (playful, edgy)"
echo "  startup-idea-validator: alloy (balanced, neutral)"

if [ $FAILED -gt 0 ]; then
    exit 1
fi
