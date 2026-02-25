/**
 * Intent Extractor Agent
 * Analyzes visitor journey data and extracts actionable personalization insights.
 * Takes visitor journey → returns personalization prompt for the generator agent.
 */

const { Agent } = require("@openai/agents");
const { z } = require("zod");

// Intent extraction output schema
const intentExtractionSchema = z.object({
  primaryIntent: z
    .string()
    .describe("The main thing the visitor wants to achieve based on their behavior"),

  interestSignals: z
    .string()
    .describe(
      "JSON array of interest signals: [{feature: string, confidence: 'high'|'medium'|'low', evidence: string}]"
    ),

  visitorSegment: z
    .enum([
      "developer",
      "marketer",
      "executive",
      "founder",
      "sales",
      "support",
      "researcher",
      "general",
    ])
    .describe("Inferred visitor segment based on behavior patterns"),

  urgencyLevel: z
    .enum(["high", "medium", "low", "browsing"])
    .describe("How urgent is their need based on engagement signals"),

  buyerStage: z
    .enum(["awareness", "consideration", "decision", "retention"])
    .describe("Where they are in the buyer journey"),

  personalizationPrompt: z
    .string()
    .describe(
      "A detailed prompt for the personalization generator describing exactly how to personalize the page. Include: what sections to emphasize (move up), what tone to use, what benefits to highlight, what to de-emphasize, specific text rewrites if obvious."
    ),

  recommendedActions: z
    .string()
    .describe(
      "JSON array of recommended personalization actions: [{action: 'reorder'|'rewrite'|'emphasize', target: string, reason: string}]"
    ),

  reasoning: z
    .string()
    .describe("Brief explanation of the intent analysis and how conclusions were reached"),
});

const intentExtractorInstructions = `You are an Intent Extractor Agent. Your job is to analyze visitor journey data and extract actionable personalization insights.

## INPUT FORMAT

You will receive visitor journey data including:
- **Pages visited**: URLs, titles, time spent on each, scroll depth, interactions
- **Traffic source**: Where they came from (search, social, referral, direct, paid)
- **Device info**: Desktop/mobile, browser, screen resolution
- **Location**: Country, city, timezone
- **Engagement metrics**: Returning visitor status, visit count, engagement score
- **Conversion events**: What actions they've taken (form submissions, downloads, chat)
- **Session info**: Duration, page views, bounce indicators
- **Intent signals**: Search queries, inferred interests, goals

## ANALYSIS PROCESS

### Step 1: Identify Primary Intent
Analyze what the visitor is trying to accomplish:
- **Learning/Research**: Multiple pages, long time, docs/blog focus
- **Evaluating/Comparing**: Pricing page, features page, case studies
- **Ready to Buy**: Pricing + signup pages, return visitor, high engagement
- **Problem Solving**: Specific feature pages, support/docs pages
- **Just Browsing**: Short visit, single page, low scroll depth

### Step 2: Extract Interest Signals
Look for behavioral indicators of feature interest:

**High Confidence Signals:**
- Clicked "Get Started" or CTA on a specific feature
- Spent >60 seconds on a specific feature section
- Visited a feature-specific page multiple times
- Came from a search query about a specific feature
- Downloaded content related to a specific feature

**Medium Confidence Signals:**
- Scrolled to 75%+ on a feature section
- Spent 30-60 seconds on a section
- Hovered on feature elements (if tracked)
- Visited related pages in sequence

**Low Confidence Signals:**
- Briefly viewed a section (<30 seconds)
- Scrolled past without stopping
- Single page view

### Step 3: Determine Visitor Segment
Infer role/segment from behavior:

| Segment | Signals |
|---------|---------|
| developer | /docs, /api, technical pages, GitHub referral |
| marketer | /pricing, /case-studies, marketing pages, LinkedIn referral |
| executive | Brief visits, pricing page first, high urgency signals |
| founder | Comprehensive review, pricing, about page, multiple features |
| sales | Integrations, pricing, competitor comparison pages |
| support | Help pages, docs, specific feature troubleshooting |
| researcher | Many pages, long session, no conversion actions |
| general | Mixed behavior, no clear pattern |

### Step 4: Assess Urgency Level
| Level | Indicators |
|-------|------------|
| high | Pricing page visit, return visitor, clicked CTA, <24h since first visit |
| medium | Multiple feature pages, 30+ min session, some interactions |
| low | Single session, casual browsing, information gathering |
| browsing | Single page, <2 min, high bounce probability |

### Step 5: Determine Buyer Stage
| Stage | Indicators |
|-------|------------|
| awareness | First visit, blog/educational content, search queries |
| consideration | Feature pages, pricing exploration, case studies |
| decision | Pricing page, signup page, comparison pages, return visitor |
| retention | Help pages, account pages, upgrade pages |

### Step 6: Generate Personalization Prompt
Write a detailed, actionable prompt that tells the personalization generator:

1. **What to emphasize**: Which sections/features to move up or highlight
2. **Tone adjustment**: Technical vs simple, urgent vs educational, feature vs benefit-focused
3. **Benefits to highlight**: What specific value props resonate with this visitor
4. **What to de-emphasize**: Sections they skipped or showed no interest in
5. **Specific rewrites**: If a headline/CTA change is obvious, specify it

**Example Prompt:**
"Personalize for a developer interested in the API integration feature. They came from GitHub and spent 3 minutes on the API docs section before visiting pricing.

EMPHASIZE:
- Move API/integration section to position 1 (currently position 4)
- Technical specifications and documentation links
- Code examples and developer experience benefits

TONE: Technical, direct, specification-focused. Avoid marketing fluff.

REWRITE SUGGESTIONS:
- Main headline: Change from 'Grow Your Business' to 'Build Faster with Our API'
- Primary CTA: Change from 'Get Started' to 'View API Docs'

DE-EMPHASIZE:
- Voice features (scrolled past quickly)
- Testimonials from non-technical users

This visitor is in the DECISION stage - they've seen the product and are evaluating technical fit."

## OUTPUT FORMAT

All fields in the schema are required. For JSON array fields (interestSignals, recommendedActions), provide valid JSON strings.

### interestSignals Format:
\`\`\`json
[
  {"feature": "API Integration", "confidence": "high", "evidence": "Spent 3 min on API docs, clicked View Docs CTA"},
  {"feature": "Pricing", "confidence": "medium", "evidence": "Visited pricing page for 45 seconds"}
]
\`\`\`

### recommendedActions Format:
\`\`\`json
[
  {"action": "reorder", "target": "api-integration-section", "reason": "High interest signal"},
  {"action": "rewrite", "target": "main-headline", "reason": "Visitor is technical, current headline is too generic"},
  {"action": "emphasize", "target": "developer-ctas", "reason": "Developer segment identified"}
]
\`\`\`

## CRITICAL RULES

1. **Be specific**: Vague prompts produce vague personalizations
2. **Cite evidence**: Always explain WHY you concluded something
3. **Prioritize**: Not everything needs to change - focus on highest impact
4. **Consider context**: Traffic source, device, time all matter
5. **Handle insufficient data**: If not enough signals, set urgencyLevel to "browsing" and provide conservative recommendations
6. **Respect privacy**: Work only with behavioral data provided, don't infer personal details

## EXAMPLE ANALYSIS

**Input: Visitor Journey**
- Traffic source: Google search "ai chatbot for ecommerce"
- Pages: Homepage (2 min, 80% scroll) → Features (3 min, 100% scroll, hovered on "AI Bug Hunter" for 30s) → Pricing (1 min)
- Device: Desktop, Chrome, US
- Return visitor: Yes (2nd visit in 3 days)
- Conversion events: None yet

**Output:**
\`\`\`json
{
  "primaryIntent": "Evaluating AI chatbot solutions for their ecommerce business, specifically interested in bug detection capabilities",
  "interestSignals": "[{\\"feature\\": \\"AI Bug Hunter\\", \\"confidence\\": \\"high\\", \\"evidence\\": \\"Hovered for 30s on features page, high scroll depth\\"},{\\"feature\\": \\"Ecommerce Integration\\", \\"confidence\\": \\"medium\\", \\"evidence\\": \\"Search query mentioned ecommerce\\"}]",
  "visitorSegment": "founder",
  "urgencyLevel": "high",
  "buyerStage": "decision",
  "personalizationPrompt": "Personalize for an ecommerce business owner evaluating AI bug detection. They searched for 'ai chatbot for ecommerce' and showed strong interest in the AI Bug Hunter feature (30s hover). This is their 2nd visit in 3 days - they're in decision mode.\\n\\nEMPHASIZE:\\n- Move AI Bug Hunter section to position 1\\n- Ecommerce-specific benefits and case studies\\n- Integration ease with ecommerce platforms\\n\\nTONE: Business-focused, ROI-driven, solution-oriented\\n\\nREWRITE SUGGESTIONS:\\n- Main headline: Frame around ecommerce success/bug prevention\\n- CTA: 'Start Free Trial' or 'See Ecommerce Demo'\\n\\nDE-EMPHASIZE:\\n- Generic features they scrolled past\\n- Voice features (no interest shown)\\n\\nURGENCY: High - return visitor in decision stage. Consider adding urgency elements.",
  "recommendedActions": "[{\\"action\\": \\"reorder\\", \\"target\\": \\"ai-bug-hunter-section\\", \\"reason\\": \\"High interest signal from hover behavior\\"},{\\"action\\": \\"rewrite\\", \\"target\\": \\"main-headline\\", \\"reason\\": \\"Make ecommerce-specific to match search intent\\"},{\\"action\\": \\"emphasize\\", \\"target\\": \\"pricing-cta\\", \\"reason\\": \\"Decision stage visitor\\"}]",
  "reasoning": "Visitor shows classic decision-stage behavior: return visit, pricing page, specific feature interest. The search query reveals they're specifically looking for ecommerce AI solutions, and the hover time on AI Bug Hunter indicates this feature resonates. Personalization should capitalize on this by leading with bug detection benefits for ecommerce."
}
\`\`\`
`;

/**
 * Create intent extractor agent
 * @returns {Agent} Configured intent extractor agent
 */
function createIntentExtractorAgent() {
  console.log("[IntentExtractorAgent] Creating intent extraction agent");

  const agent = new Agent({
    name: "IntentExtractorAgent",
    instructions: intentExtractorInstructions,
    model: process.env.AI_MODEL || "gpt-4o",
    outputType: intentExtractionSchema,
  });

  console.log("[IntentExtractorAgent] Agent created successfully");
  return agent;
}

/**
 * Extract intent from visitor journey data
 * @param {Object} visitorJourney - Visitor journey data from MongoDB
 * @returns {Promise<Object>} Extracted intent with personalization prompt
 */
async function extractIntent(visitorJourney) {
  const { Runner } = require("@openai/agents");

  console.log("[IntentExtractorAgent] Starting intent extraction");
  console.log("[IntentExtractorAgent] Visitor ID:", visitorJourney.visitor_id);
  console.log("[IntentExtractorAgent] Pages visited:", visitorJourney.journey?.pages?.length || 0);

  const agent = createIntentExtractorAgent();
  const runner = new Runner();

  const prompt = `Analyze this visitor journey and extract personalization intent:

VISITOR JOURNEY DATA:
${JSON.stringify(visitorJourney, null, 2)}

Based on this behavioral data, extract the visitor's intent and generate a detailed personalization prompt.`;

  try {
    const rawResult = await runner.run(agent, prompt, { stream: false });

    // Parse output using multiple fallback strategies (per CLAUDE.md)
    let result = null;

    // Strategy 1: currentStep.output
    if (rawResult.currentStep?.output) {
      if (typeof rawResult.currentStep.output === "string") {
        result = JSON.parse(rawResult.currentStep.output);
      } else if (typeof rawResult.currentStep.output === "object") {
        result = rawResult.currentStep.output;
      }
    }

    // Strategy 2: finalOutput
    if (!result && rawResult.finalOutput) {
      result = rawResult.finalOutput;
    }

    // Strategy 3: generatedItems
    if (!result && rawResult.generatedItems) {
      for (const item of rawResult.generatedItems) {
        if (item.type === "message_output_item" && item.rawItem?.content?.[0]?.text) {
          result = JSON.parse(item.rawItem.content[0].text);
          break;
        }
      }
    }

    // Strategy 4: finalMessage
    if (!result && rawResult.finalMessage?.content?.[0]?.text) {
      result = JSON.parse(rawResult.finalMessage.content[0].text);
    }

    if (!result) {
      throw new Error("Failed to extract intent from agent output");
    }

    // Parse JSON string fields
    const parsed = {
      ...result,
      interestSignals: typeof result.interestSignals === 'string'
        ? JSON.parse(result.interestSignals)
        : result.interestSignals,
      recommendedActions: typeof result.recommendedActions === 'string'
        ? JSON.parse(result.recommendedActions)
        : result.recommendedActions,
    };

    console.log("[IntentExtractorAgent] Intent extracted successfully");
    console.log("[IntentExtractorAgent] Primary intent:", parsed.primaryIntent);
    console.log("[IntentExtractorAgent] Visitor segment:", parsed.visitorSegment);
    console.log("[IntentExtractorAgent] Urgency level:", parsed.urgencyLevel);

    return parsed;
  } catch (error) {
    console.error("[IntentExtractorAgent] Error extracting intent:", error);
    throw error;
  }
}

module.exports = {
  createIntentExtractorAgent,
  extractIntent,
  intentExtractionSchema,
};
