/**
 * Personalization Generator Agent
 * Takes a personalization prompt and page schema (personalizationObj),
 * then generates specific DOM variations for personalization.
 */

const { Agent } = require("@openai/agents");
const { z } = require("zod");

// Personalization variation output schema
// Uses flattened structure with JSON strings per CLAUDE.md guidelines
const personalizationVariationSchema = z.object({
  variationId: z
    .string()
    .describe("Unique identifier for this variation (use format: vis_{visitorId}_{timestamp})"),

  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score 0-1 for this personalization"),

  layoutChanges: z
    .string()
    .describe(
      "JSON array of section reordering: [{sectionId: string, currentPriority: number, newPriority: number, reason: string}]"
    ),

  contentVariations: z
    .string()
    .describe(
      "JSON array of text changes: [{selector: string, elementType: string, originalText: string, newText: string, reason: string}]"
    ),

  ctaVariations: z
    .string()
    .describe(
      "JSON array of CTA changes: [{selector: string, originalText: string, newText: string, newHref?: string, reason: string}]"
    ),

  styleEmphasis: z
    .string()
    .describe(
      "JSON array of style emphasis: [{selector: string, action: 'highlight'|'fade'|'none', reason: string}]"
    ),

  cacheDuration: z
    .number()
    .describe("Seconds to cache this variation (3600=1h, 86400=24h)"),

  reasoning: z
    .string()
    .describe("Brief explanation of the personalization strategy and expected impact"),
});

const personalizationGeneratorInstructions = `You are a Personalization Generator Agent. Your job is to take a personalization prompt and a page schema, then generate specific, actionable DOM variations.

## INPUT FORMAT

You will receive:
1. **Personalization Prompt**: Detailed instructions from the Intent Extractor Agent describing:
   - What to emphasize/de-emphasize
   - Tone adjustments
   - Specific rewrite suggestions
   - Visitor context

2. **personalizationObj**: Schema of the page with sections and elements:
   - sections: Array of detected page sections with:
     - sectionId: Identifier
     - selector: CSS selector
     - position: {index, isAboveFold, top}
     - elements: Array of {type, tag, selector, currentText, charCount}
     - importance: Score
   - globalElements: Important elements outside sections

## OUTPUT REQUIREMENTS

### layoutChanges (JSON string)
Reorder sections by priority. Lower priority = higher on page.
\`\`\`json
[
  {"sectionId": "api-integration-section", "currentPriority": 4, "newPriority": 1, "reason": "High interest from hover behavior"},
  {"sectionId": "voice-section", "currentPriority": 2, "newPriority": 5, "reason": "No interest shown, move down"}
]
\`\`\`

### contentVariations (JSON string)
Text replacements. MUST use exact selectors from personalizationObj.
\`\`\`json
[
  {
    "selector": "section.hero > h1",
    "elementType": "headline",
    "originalText": "Grow Your Business",
    "newText": "Build Faster with Our API",
    "reason": "Visitor is a developer, technical framing resonates better"
  },
  {
    "selector": "section.features > p.description",
    "elementType": "description",
    "originalText": "Our platform helps you succeed",
    "newText": "Integrate in minutes with our developer-friendly API",
    "reason": "Technical visitor wants specifics, not vague promises"
  }
]
\`\`\`

### ctaVariations (JSON string)
Button/link text and optional href changes.
\`\`\`json
[
  {
    "selector": "a.hero-cta",
    "originalText": "Get Started",
    "newText": "View API Docs",
    "newHref": "/docs/api",
    "reason": "Developer segment - lead with documentation"
  }
]
\`\`\`

### styleEmphasis (JSON string)
Visual emphasis without changing content.
\`\`\`json
[
  {"selector": "[data-section='api']", "action": "highlight", "reason": "Primary interest area"},
  {"selector": "[data-section='voice']", "action": "fade", "reason": "No interest shown"}
]
\`\`\`

## CONTENT REWRITING RULES

### 1. Preserve Core Meaning
- New text must convey the same value proposition
- Don't change the product/feature being described
- Adjust angle/framing, not substance

### 2. Match Length (±30%)
- If original is 50 chars, new should be 35-65 chars
- Prevents layout breaks and visual jarring
- Count characters before finalizing

### 3. Maintain Brand Voice
- Keep professional tone unless prompt specifies otherwise
- Don't use slang or overly casual language
- Match the existing style of the page

### 4. Be Specific, Not Generic
BAD: "Our product helps you" → "Our product helps your business"
GOOD: "Our product helps you" → "Ship code 10x faster with our API"

### 5. Valid Selectors Only
- ONLY use selectors that exist in personalizationObj
- Don't invent selectors
- If unsure, skip that element

### 6. Don't Over-Personalize
- Focus on 3-5 high-impact changes
- Not everything needs to change
- Subtle > drastic

## CONFIDENCE SCORING

| Score | Criteria |
|-------|----------|
| 0.9-1.0 | Clear interest signal, obvious personalization, high-impact |
| 0.7-0.9 | Good signals, reasonable inference, medium impact |
| 0.5-0.7 | Some signals, educated guess, subtle changes |
| 0.3-0.5 | Weak signals, conservative approach |
| <0.3 | Insufficient data, minimal personalization |

## CACHE DURATION GUIDELINES

| Confidence | Duration | Reason |
|------------|----------|--------|
| >0.8 | 86400 (24h) | High confidence, stable personalization |
| 0.6-0.8 | 43200 (12h) | Good confidence, may need refresh |
| 0.4-0.6 | 14400 (4h) | Medium confidence, shorter cache |
| <0.4 | 3600 (1h) | Low confidence, frequent refresh |

## EXAMPLE TRANSFORMATION

**Personalization Prompt:**
"Personalize for a developer interested in API integration. Move API section to top, use technical language, change CTAs to focus on documentation."

**personalizationObj (excerpt):**
\`\`\`json
{
  "sections": [
    {
      "sectionId": "hero-section",
      "selector": "section.hero",
      "elements": [
        {"type": "headline", "selector": "section.hero > h1", "currentText": "Grow Your Business Faster"},
        {"type": "cta", "selector": "section.hero > a.cta", "currentText": "Get Started Free"}
      ]
    },
    {
      "sectionId": "api-integration-section",
      "selector": "section.api",
      "position": {"index": 3},
      "elements": [
        {"type": "headline", "selector": "section.api > h2", "currentText": "Powerful API"},
        {"type": "description", "selector": "section.api > p", "currentText": "Connect with ease"}
      ]
    }
  ]
}
\`\`\`

**Output:**
\`\`\`json
{
  "variationId": "vis_abc123_1702345678",
  "confidence": 0.85,
  "layoutChanges": "[{\\"sectionId\\": \\"api-integration-section\\", \\"currentPriority\\": 3, \\"newPriority\\": 1, \\"reason\\": \\"Developer showed high interest in API features\\"}]",
  "contentVariations": "[{\\"selector\\": \\"section.hero > h1\\", \\"elementType\\": \\"headline\\", \\"originalText\\": \\"Grow Your Business Faster\\", \\"newText\\": \\"Ship Code Faster with Our API\\", \\"reason\\": \\"Developer-focused framing\\"},{\\"selector\\": \\"section.api > p\\", \\"elementType\\": \\"description\\", \\"originalText\\": \\"Connect with ease\\", \\"newText\\": \\"RESTful API with full TypeScript support\\", \\"reason\\": \\"Technical specifics for developer audience\\"}]",
  "ctaVariations": "[{\\"selector\\": \\"section.hero > a.cta\\", \\"originalText\\": \\"Get Started Free\\", \\"newText\\": \\"View API Docs\\", \\"newHref\\": \\"/docs/api\\", \\"reason\\": \\"Developers prefer documentation first\\"}]",
  "styleEmphasis": "[{\\"selector\\": \\"section.api\\", \\"action\\": \\"highlight\\", \\"reason\\": \\"Primary interest area\\"}]",
  "cacheDuration": 43200,
  "reasoning": "Visitor shows clear developer intent with API interest. Personalization focuses on technical value: leading with API content, using specific technical language, and directing to documentation. High confidence due to clear signals. 12-hour cache as behavior may evolve."
}
\`\`\`

## CRITICAL RULES

1. **Use exact selectors**: Only use selectors from personalizationObj
2. **Preserve meaning**: Reframe, don't misrepresent
3. **Match length**: ±30% character count
4. **Focus on impact**: 3-5 changes max, not everything
5. **Valid JSON**: All array fields must be valid JSON strings
6. **No invention**: Don't add elements that don't exist in the schema
7. **Be conservative**: When unsure, make smaller changes
`;

/**
 * Create personalization generator agent
 * @returns {Agent} Configured personalization generator agent
 */
function createPersonalizationGeneratorAgent() {
  console.log("[PersonalizationGeneratorAgent] Creating personalization generator agent");

  const agent = new Agent({
    name: "PersonalizationGeneratorAgent",
    instructions: personalizationGeneratorInstructions,
    model: process.env.AI_MODEL || "gpt-4o",
    outputType: personalizationVariationSchema,
  });

  console.log("[PersonalizationGeneratorAgent] Agent created successfully");
  return agent;
}

/**
 * Generate personalization variations
 * @param {string} personalizationPrompt - From intent extractor
 * @param {Object} personalizationObj - From DOM scanner
 * @param {string} visitorId - Visitor identifier
 * @returns {Promise<Object>} Parsed variation with layout/content/cta changes
 */
async function generatePersonalization(personalizationPrompt, personalizationObj, visitorId) {
  const { Runner } = require("@openai/agents");

  console.log("[PersonalizationGeneratorAgent] Starting personalization generation");
  console.log("[PersonalizationGeneratorAgent] Page URL:", personalizationObj.pageUrl);
  console.log("[PersonalizationGeneratorAgent] Sections count:", personalizationObj.sections?.length || 0);

  const agent = createPersonalizationGeneratorAgent();
  const runner = new Runner();

  const prompt = `Generate personalization variations based on:

## PERSONALIZATION PROMPT
${personalizationPrompt}

## PAGE SCHEMA (personalizationObj)
${JSON.stringify(personalizationObj, null, 2)}

## VISITOR ID
${visitorId}

Generate specific, actionable variations for this page. Use exact selectors from the schema.`;

  try {
    const rawResult = await runner.run(agent, prompt, { stream: false });

    // Parse output using multiple fallback strategies
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
      throw new Error("Failed to generate personalization from agent output");
    }

    // Parse JSON string fields back to objects
    const parsed = {
      variationId: result.variationId || `vis_${visitorId}_${Date.now()}`,
      confidence: result.confidence,
      layoutChanges: typeof result.layoutChanges === 'string'
        ? JSON.parse(result.layoutChanges)
        : result.layoutChanges || [],
      contentVariations: typeof result.contentVariations === 'string'
        ? JSON.parse(result.contentVariations)
        : result.contentVariations || [],
      ctaVariations: typeof result.ctaVariations === 'string'
        ? JSON.parse(result.ctaVariations)
        : result.ctaVariations || [],
      styleEmphasis: typeof result.styleEmphasis === 'string'
        ? JSON.parse(result.styleEmphasis)
        : result.styleEmphasis || [],
      cacheDuration: result.cacheDuration || 43200,
      reasoning: result.reasoning,
    };

    console.log("[PersonalizationGeneratorAgent] Personalization generated successfully");
    console.log("[PersonalizationGeneratorAgent] Variation ID:", parsed.variationId);
    console.log("[PersonalizationGeneratorAgent] Confidence:", parsed.confidence);
    console.log("[PersonalizationGeneratorAgent] Layout changes:", parsed.layoutChanges.length);
    console.log("[PersonalizationGeneratorAgent] Content variations:", parsed.contentVariations.length);
    console.log("[PersonalizationGeneratorAgent] CTA variations:", parsed.ctaVariations.length);

    return parsed;
  } catch (error) {
    console.error("[PersonalizationGeneratorAgent] Error generating personalization:", error);
    throw error;
  }
}

/**
 * Generate personalization with judge feedback loop
 * Iterates up to maxTurns times until judge approves
 * @param {string} personalizationPrompt - From intent extractor
 * @param {Object} personalizationObj - From DOM scanner
 * @param {string} visitorId - Visitor identifier
 * @param {string} originalWebsiteContent - Original website content for brand alignment
 * @param {number} maxTurns - Maximum iteration attempts (default 3)
 * @returns {Promise<Object>} Best variation (parsed)
 */
async function generatePersonalizationWithJudge(
  personalizationPrompt,
  personalizationObj,
  visitorId,
  originalWebsiteContent,
  maxTurns = 3
) {
  const { judgePersonalization } = require("./personalizationJudgeAgent");

  console.log("[PersonalizationGenerator] Starting generation with judge loop");
  console.log("[PersonalizationGenerator] Max turns:", maxTurns);
  console.log("[PersonalizationGenerator] Has original content:", !!originalWebsiteContent);

  let currentVariation = null;
  let conversationHistory = [];
  let bestVariation = null;
  let bestScore = 0;

  for (let turn = 0; turn < maxTurns; turn++) {
    console.log(`[PersonalizationGenerator] === Turn ${turn + 1}/${maxTurns} ===`);

    try {
      // Step 1: Build prompt with context
      const enhancedPrompt = buildEnhancedPrompt(
        personalizationPrompt,
        personalizationObj,
        visitorId,
        originalWebsiteContent,
        conversationHistory
      );

      // Step 2: Generate personalization
      currentVariation = await generatePersonalization(
        enhancedPrompt,
        personalizationObj,
        visitorId
      );

      // Track best variation by confidence
      const currentScore = currentVariation.confidence || 0;
      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestVariation = currentVariation;
      }

      // Step 3: Judge the output
      console.log("[PersonalizationGenerator] Sending to judge...");
      const judgment = await judgePersonalization(
        currentVariation,
        originalWebsiteContent,
        personalizationObj
      );

      // Step 4: Check if passed
      if (judgment.score === "pass") {
        console.log(`[PersonalizationGenerator] PASSED on turn ${turn + 1}`);
        return {
          ...currentVariation,
          judgeTurns: turn + 1,
          judgeScore: judgment.score,
          brandAlignmentScore: judgment.brandAlignmentScore,
          textQualityScore: judgment.textQualityScore,
        };
      }

      // Step 5: Handle failure
      if (judgment.score === "fail") {
        console.log(`[PersonalizationGenerator] FAILED on turn ${turn + 1}: ${judgment.feedback}`);
        // Don't add fail feedback to history - might confuse the model
        // Just try again with fresh context
        continue;
      }

      // Step 6: Needs improvement - add feedback for next iteration
      console.log(`[PersonalizationGenerator] NEEDS_IMPROVEMENT on turn ${turn + 1}`);
      conversationHistory.push({
        turn: turn + 1,
        feedback: judgment.feedback,
        issues: judgment.issues,
        brandAlignmentScore: judgment.brandAlignmentScore,
        textQualityScore: judgment.textQualityScore,
      });

    } catch (error) {
      console.error(`[PersonalizationGenerator] Error on turn ${turn + 1}:`, error.message);
      // Continue to next turn on error
    }
  }

  // Return best variation after max turns
  console.log(`[PersonalizationGenerator] Max turns reached, returning best variation`);
  return {
    ...(bestVariation || currentVariation),
    judgeTurns: maxTurns,
    judgeScore: "max_turns_reached",
  };
}

/**
 * Build enhanced prompt with original content and feedback
 * @param {string} personalizationPrompt - Original prompt
 * @param {Object} personalizationObj - Page schema
 * @param {string} visitorId - Visitor ID
 * @param {string} originalWebsiteContent - Original content for context
 * @param {Array} conversationHistory - Previous feedback
 * @returns {string} Enhanced prompt
 */
function buildEnhancedPrompt(
  personalizationPrompt,
  personalizationObj,
  visitorId,
  originalWebsiteContent,
  conversationHistory
) {
  let prompt = `Generate personalization variations based on:

## PERSONALIZATION PROMPT
${personalizationPrompt}

## PAGE SCHEMA (personalizationObj)
${JSON.stringify(personalizationObj, null, 2)}

## VISITOR ID
${visitorId}`;

  // Add original content context if available
  if (originalWebsiteContent) {
    // Truncate to avoid token limits but keep meaningful content
    const truncatedContent = originalWebsiteContent.substring(0, 6000);
    prompt += `

## ORIGINAL WEBSITE CONTENT (maintain this brand voice and messaging)
${truncatedContent}

IMPORTANT: Your personalized text MUST align with the original website's:
- Professional tone and brand voice
- Factual claims about the product/service
- Value propositions and messaging
Do NOT contradict or misrepresent the original content.`;
  }

  // Add previous feedback if this is a retry
  if (conversationHistory.length > 0) {
    prompt += `

## PREVIOUS FEEDBACK (improve based on this)
`;
    conversationHistory.forEach((entry) => {
      prompt += `
### Turn ${entry.turn} Feedback:
- Brand Alignment Score: ${entry.brandAlignmentScore}
- Text Quality Score: ${entry.textQualityScore}
- Feedback: ${entry.feedback}
- Issues to fix: ${JSON.stringify(entry.issues)}
`;
    });

    prompt += `
Please address the above feedback in your new variation. Focus on fixing the identified issues while maintaining personalization intent.`;
  }

  prompt += `

Generate specific, actionable variations for this page. Use exact selectors from the schema.`;

  return prompt;
}

module.exports = {
  createPersonalizationGeneratorAgent,
  generatePersonalization,
  generatePersonalizationWithJudge,
  personalizationVariationSchema,
};
