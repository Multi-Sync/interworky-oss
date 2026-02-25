/**
 * Fix Judge Agent
 * Validates that applied fixes match the intended fix
 * Uses LLM-as-a-judge pattern to catch corrupted fixes
 */

const { Agent } = require("@openai/agents");
const { z } = require("zod");

// Judge evaluation schema
const fixJudgeSchema = z.object({
  score: z
    .enum(["pass", "fail"])
    .describe("Whether the applied fix correctly implements the intended fix"),
  issues: z
    .array(z.string())
    .describe("List of specific issues found (empty if pass)"),
  feedback: z.string().describe("Detailed feedback explaining the evaluation"),
});

const fixJudgeInstructions = `You are a code fix validator. Your job is to verify that an applied fix correctly implements the intended fix.

## What You'll Receive

1. **Original File Content**: The file before any changes
2. **Intended Fix**: What the fix should do (oldCode, newCode, lineStart, lineEnd)
3. **Applied Result**: The actual content after fix was applied

## Evaluation Criteria

### Score "pass" if:
- The newCode is correctly applied at the right location
- The oldCode was properly replaced
- No unrelated code was modified or deleted
- Formatting differences are acceptable (whitespace, indentation)

### Score "fail" if:
- Wrong lines were modified (fix applied at incorrect location)
- The oldCode doesn't exist at lineStart-lineEnd in original
- Unrelated code was deleted or modified
- The fix logic was changed or corrupted
- Critical code structure was broken

## Common Issues to Catch

1. **Line Number Mismatch**: oldCode says "console.log(x)" but line 6 has "function foo()"
2. **Code Deletion**: A function or block was accidentally removed
3. **Corrupted Fix**: Formatters changed the fix logic (not just whitespace)
4. **Wrong Replacement**: Different code was replaced than intended

## Output Format

Provide:
- **score**: "pass" or "fail"
- **issues**: Array of specific problems found (empty array if pass)
- **feedback**: Explanation of your evaluation

Be strict about line accuracy but lenient about formatting differences.`;

/**
 * Create fix judge agent
 * @returns {Agent} Configured fix judge agent
 */
function createFixJudgeAgent() {
  console.log("[FixJudgeAgent] Creating fix validation agent");

  const agent = new Agent({
    name: "FixJudgeAgent",
    instructions: fixJudgeInstructions,
    model: process.env.AI_FAST_MODEL || "gpt-4o-mini", // Fast and cheap for validation
    outputType: fixJudgeSchema,
  });

  console.log("[FixJudgeAgent] Agent created successfully");
  return agent;
}

/**
 * Build prompt for fix judge evaluation
 * @param {Object} params - Evaluation parameters
 * @param {string} params.originalContent - Original file content
 * @param {Object} params.suggestedFix - The intended fix (oldCode, newCode, lineStart, lineEnd)
 * @param {string} params.appliedContent - Content after fix was applied
 * @param {string} params.previousFeedback - Feedback from previous turn (if any)
 * @returns {string} Formatted prompt for judge
 */
function buildJudgePrompt({
  originalContent,
  suggestedFix,
  appliedContent,
  previousFeedback = "",
}) {
  const { oldCode, newCode, lineStart, lineEnd, filePath } = suggestedFix;

  // Extract relevant lines from original for context
  const originalLines = originalContent.split("\n");
  const contextStart = Math.max(0, lineStart - 5);
  const contextEnd = Math.min(originalLines.length, lineEnd + 5);
  const originalContext = originalLines
    .slice(contextStart, contextEnd)
    .map((line, i) => `${contextStart + i + 1}: ${line}`)
    .join("\n");

  // Extract same region from applied content
  const appliedLines = appliedContent.split("\n");
  const appliedContext = appliedLines
    .slice(contextStart, contextEnd)
    .map((line, i) => `${contextStart + i + 1}: ${line}`)
    .join("\n");

  return `# Fix Validation Request

## File: ${filePath}

## Intended Fix

**Lines to change:** ${lineStart}-${lineEnd}

**Old Code (should be replaced):**
\`\`\`
${oldCode}
\`\`\`

**New Code (should be applied):**
\`\`\`
${newCode}
\`\`\`

## Original File Context (lines ${contextStart + 1}-${contextEnd})

\`\`\`
${originalContext}
\`\`\`

## Applied Result Context (lines ${contextStart + 1}-${contextEnd})

\`\`\`
${appliedContext}
\`\`\`

${previousFeedback ? `## Previous Feedback\n\n${previousFeedback}\n` : ""}

## Your Task

Verify the fix was applied correctly. Check that:
1. The oldCode at lines ${lineStart}-${lineEnd} was replaced with newCode
2. No unrelated code was modified or deleted
3. The fix logic is preserved (formatting differences are OK)

Provide your evaluation with score, issues, and feedback.`;
}

module.exports = {
  createFixJudgeAgent,
  buildJudgePrompt,
};
