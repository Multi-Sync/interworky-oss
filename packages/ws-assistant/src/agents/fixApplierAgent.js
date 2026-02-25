/**
 * Fix Applier Agent
 * Tier 3 fallback: Uses AI to apply fixes when line-based and string search fail
 */

const { Agent } = require("@openai/agents");
const { z } = require("zod");

const fixApplierSchema = z.object({
  fixedContent: z.string().describe("Complete fixed file content"),
  changesMade: z.string().describe("Brief description of changes applied"),
});

const fixApplierInstructions = `You are a code fix applier. Your job is to apply a specific fix to a file.

You will receive:
1. The original file content
2. The intended fix (oldCode to find, newCode to replace with)
3. Context about what the fix does

Your task:
- Find where the oldCode (or similar code) exists in the file
- Replace it with the newCode
- Return the COMPLETE fixed file content
- Preserve ALL other code exactly as-is (formatting, comments, etc.)

Rules:
- Apply ONLY the specified fix
- Do NOT add, remove, or modify any other code
- Do NOT add comments explaining the fix
- Do NOT change formatting of unrelated code
- The oldCode might have slight whitespace differences - find the closest match
- Return the entire file content, not just the changed part`;

function createFixApplierAgent() {
  console.log("[FixApplierAgent] Creating AI fix applier agent");
  return new Agent({
    name: "FixApplierAgent",
    instructions: fixApplierInstructions,
    model: process.env.AI_FAST_MODEL || "gpt-4o-mini",
    outputType: fixApplierSchema,
  });
}

function buildFixApplierPrompt({
  originalContent,
  oldCode,
  newCode,
  description,
}) {
  return `Apply this fix to the file:

## Fix Details
**Description:** ${description || "Replace old code with new code"}
**Old Code to Find:**
\`\`\`
${oldCode}
\`\`\`

**New Code to Replace With:**
\`\`\`
${newCode}
\`\`\`

## Original File Content
\`\`\`
${originalContent}
\`\`\`

Return the complete fixed file content.`;
}

module.exports = {
  createFixApplierAgent,
  buildFixApplierPrompt,
  fixApplierSchema,
};
