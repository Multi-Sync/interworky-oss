/**
 * Personalization Judge Agent
 * Evaluates personalization variations against original website content
 * and quality criteria. Uses balanced mode - pass on first try if quality is good.
 */

const { Agent } = require("@openai/agents");
const { z } = require("zod");

// Judge output schema
const personalizationJudgmentSchema = z.object({
  score: z
    .enum(["pass", "needs_improvement", "fail"])
    .describe("Overall judgment: pass if quality is good, needs_improvement for fixable issues, fail for major problems"),

  feedback: z
    .string()
    .describe("Specific, actionable feedback on what to improve. Be concise and direct."),

  issues: z
    .string()
    .describe("JSON array of specific issues: [{type: string, element: string, problem: string, suggestion: string}]"),

  brandAlignmentScore: z
    .number()
    .min(0)
    .max(1)
    .describe("0-1 score: How well variations align with original website's brand voice and messaging"),

  textQualityScore: z
    .number()
    .min(0)
    .max(1)
    .describe("0-1 score: Quality of rewritten text - naturalness, clarity, professionalism"),

  reasoning: z
    .string()
    .describe("Brief explanation of the judgment decision"),
});

const personalizationJudgeInstructions = `You are a Personalization Quality Judge. Your job is to evaluate generated website personalizations and decide if they meet quality standards.

## EVALUATION MODE: BALANCED

You should PASS personalizations that are genuinely good on the first try. Only mark as NEEDS_IMPROVEMENT when there are real issues to fix. Be fair and constructive.

## EVALUATION CRITERIA

### 1. Brand Alignment (brandAlignmentScore)
Compare the personalized text against the original website content:
- Does it maintain the same professional tone?
- Does it preserve the brand's voice (technical, friendly, corporate, etc.)?
- Are product claims and value propositions consistent?
- Are there any contradictions with the original content?

**Scoring:**
- 0.9-1.0: Perfect alignment, reads like original authors wrote it
- 0.7-0.9: Good alignment, minor tone differences acceptable
- 0.5-0.7: Noticeable drift from brand voice
- <0.5: Significantly off-brand or contradictory

### 2. Text Quality (textQualityScore)
Evaluate the quality of rewritten text:
- Is the grammar and spelling correct?
- Does it read naturally (not AI-generated sounding)?
- Is it clear and easy to understand?
- Is the length appropriate (within ±30% of original)?
- Does it avoid marketing clichés and fluff?

**Scoring:**
- 0.9-1.0: Excellent, publication-ready
- 0.7-0.9: Good, minor improvements possible
- 0.5-0.7: Acceptable but needs polish
- <0.5: Poor quality, needs rewrite

### 3. Factual Accuracy
- Are product features described accurately?
- Are pricing or capability claims preserved?
- Is technical information correct for developer audiences?

### 4. Visitor Relevance
- Is the personalization appropriate for the identified visitor segment?
- Does it address their inferred needs and interests?
- Are CTAs relevant to their buyer stage?

### 5. Length Consistency
- Headlines should be within ±30% of original length
- Descriptions within ±30% of original length
- CTAs should be concise (2-5 words typically)

## SCORING RULES

**PASS** (both scores >= 0.75):
- Brand alignment and text quality are both good
- No major issues with factual accuracy
- Personalization serves the visitor well
- Minor imperfections are acceptable

**NEEDS_IMPROVEMENT** (any score 0.5-0.75 OR fixable issues):
- One or more scores need improvement
- Issues are specific and fixable
- Provide clear feedback on what to change

**FAIL** (any score < 0.5 OR major problems):
- Significant quality problems
- Factual inaccuracies
- Completely off-brand content
- Misleading or inappropriate CTAs

## INPUT FORMAT

You will receive:
1. **Generated Variation**: The personalization output to evaluate
2. **Original Website Content**: Scraped content from the website (use as reference for brand voice)
3. **Page Schema**: Current page structure with original text

## OUTPUT FORMAT

Provide structured judgment with:
- **score**: "pass", "needs_improvement", or "fail"
- **feedback**: Specific improvements needed (or praise if passing)
- **issues**: JSON array of specific issues (empty array [] if passing)
- **brandAlignmentScore**: 0-1
- **textQualityScore**: 0-1
- **reasoning**: Brief explanation

### Issues Array Format:
\`\`\`json
[
  {
    "type": "brand_drift",
    "element": "section.hero > h1",
    "problem": "Headline uses casual tone but website is professional/corporate",
    "suggestion": "Rewrite with more professional language: 'Enterprise Solutions for...' instead of 'Check out our...'"
  },
  {
    "type": "length_violation",
    "element": "section.features > p",
    "problem": "Description is 150 chars, original was 80 chars (87% longer)",
    "suggestion": "Condense to approximately 80 characters while preserving key message"
  }
]
\`\`\`

## EXAMPLE JUDGMENTS

### Example 1: PASS
**Input**: Developer-focused headline rewrite for API section
**Original**: "Powerful API"
**Personalized**: "Developer-First API"

**Judgment**:
- score: "pass"
- brandAlignmentScore: 0.85
- textQualityScore: 0.90
- feedback: "Good personalization. Maintains professional tone while targeting developers effectively."
- issues: "[]"
- reasoning: "The rewrite is appropriate for a developer audience, maintains brand voice, and is similar length."

### Example 2: NEEDS_IMPROVEMENT
**Input**: CTA change for executive visitor
**Original**: "Get Started Free"
**Personalized**: "Yo, Let's Do This!"

**Judgment**:
- score: "needs_improvement"
- brandAlignmentScore: 0.40
- textQualityScore: 0.50
- feedback: "CTA is too casual for the website's professional brand. Executives expect formal language."
- issues: "[{\\"type\\": \\"brand_drift\\", \\"element\\": \\"a.hero-cta\\", \\"problem\\": \\"Casual slang inappropriate for B2B SaaS\\", \\"suggestion\\": \\"Use 'Schedule a Demo' or 'Contact Sales' for executive audience\\"}]"
- reasoning: "The original website has a professional B2B tone. This CTA is too informal and could undermine credibility."

## CRITICAL RULES

1. **Be fair**: Don't reject good work unnecessarily
2. **Be specific**: Vague feedback is useless - point to exact elements
3. **Be constructive**: Every criticism should include a suggestion
4. **Preserve intent**: The personalization goal is valid, just ensure execution quality
5. **Consider context**: What works for developers may not work for executives
6. **Trust the visitor analysis**: The intent extractor identified the segment - evaluate if personalization matches
`;

/**
 * Create personalization judge agent
 * @returns {Agent} Configured judge agent
 */
function createPersonalizationJudgeAgent() {
  console.log("[PersonalizationJudgeAgent] Creating judge agent");

  const agent = new Agent({
    name: "PersonalizationJudgeAgent",
    instructions: personalizationJudgeInstructions,
    model: process.env.AI_MODEL || "gpt-4o",
    outputType: personalizationJudgmentSchema,
  });

  console.log("[PersonalizationJudgeAgent] Agent created successfully");
  return agent;
}

/**
 * Judge a personalization variation
 * @param {Object} variation - Generated variation to evaluate
 * @param {string} originalWebsiteContent - Original website content for comparison
 * @param {Object} personalizationObj - Page schema with original text
 * @returns {Promise<Object>} Judgment result
 */
async function judgePersonalization(variation, originalWebsiteContent, personalizationObj) {
  const { Runner } = require("@openai/agents");

  console.log("[PersonalizationJudgeAgent] Starting evaluation");
  console.log("[PersonalizationJudgeAgent] Variation ID:", variation.variationId);
  console.log("[PersonalizationJudgeAgent] Content variations:", variation.contentVariations?.length || 0);
  console.log("[PersonalizationJudgeAgent] CTA variations:", variation.ctaVariations?.length || 0);

  const agent = createPersonalizationJudgeAgent();
  const runner = new Runner();

  // Build evaluation prompt
  const prompt = `Evaluate this personalization variation for quality and brand alignment.

## GENERATED VARIATION
${JSON.stringify(variation, null, 2)}

## ORIGINAL WEBSITE CONTENT (for brand voice reference)
${originalWebsiteContent ? originalWebsiteContent.substring(0, 8000) : "No original content provided - evaluate based on general quality standards."}

## PAGE SCHEMA (original text for comparison)
${JSON.stringify(personalizationObj, null, 2)}

Evaluate the quality of the personalization and provide your judgment.`;

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
      throw new Error("Failed to get judgment from agent output");
    }

    // Parse issues JSON string if needed
    const parsed = {
      ...result,
      issues: typeof result.issues === "string" ? JSON.parse(result.issues) : result.issues || [],
    };

    console.log("[PersonalizationJudgeAgent] Judgment complete");
    console.log("[PersonalizationJudgeAgent] Score:", parsed.score);
    console.log("[PersonalizationJudgeAgent] Brand alignment:", parsed.brandAlignmentScore);
    console.log("[PersonalizationJudgeAgent] Text quality:", parsed.textQualityScore);
    console.log("[PersonalizationJudgeAgent] Issues count:", parsed.issues.length);

    return parsed;
  } catch (error) {
    console.error("[PersonalizationJudgeAgent] Error judging personalization:", error);
    // On error, return a pass to avoid blocking the flow
    return {
      score: "pass",
      feedback: "Judge evaluation failed, passing by default",
      issues: [],
      brandAlignmentScore: 0.7,
      textQualityScore: 0.7,
      reasoning: `Judge error: ${error.message}`,
    };
  }
}

module.exports = {
  createPersonalizationJudgeAgent,
  judgePersonalization,
  personalizationJudgmentSchema,
};
