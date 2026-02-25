/**
 * Validation Agent
 * Analyzes collected data against flow configuration to determine completeness
 * Returns follow-up questions if data is incomplete
 *
 * Uses OpenAI Agents SDK with flattened Zod schema pattern
 */

const { Agent, run, user } = require('@openai/agents');
const { z } = require('zod');

// Flattened output schema for validation result
const validationSchema = z.object({
  status: z
    .enum(['complete', 'needs_more'])
    .describe('Whether all required data has been collected. "complete" if ready, "needs_more" if missing data'),
  ready: z
    .boolean()
    .describe('True if the flow can proceed to results, false if more data is needed'),
  missing_fields_json: z
    .string()
    .describe('JSON array of missing field names. Example: ["email", "work_experience"]. Use "[]" if none missing'),
  questions_json: z
    .string()
    .describe(
      'JSON array of follow-up questions to ask the user. Each question should be natural and conversational. Example: ["What is your email address?", "Can you tell me about your work experience?"]. Use "[]" if no questions needed'
    ),
  confidence: z
    .number()
    .describe('Confidence score 1-10 for this validation assessment'),
  reasoning: z
    .string()
    .describe('Explain your reasoning for the validation decision'),
});

/**
 * Parse the flattened agent output into structured validation result
 * @param {Object} flatOutput - The flattened output from the agent
 * @returns {Object} - Parsed validation result
 */
function parseValidationOutput(flatOutput) {
  const result = {
    status: flatOutput.status,
    ready: flatOutput.ready,
    confidence: flatOutput.confidence,
    reasoning: flatOutput.reasoning,
  };

  // Parse missing fields JSON
  try {
    result.missing = JSON.parse(flatOutput.missing_fields_json || '[]');
  } catch (e) {
    console.error('[ValidationAgent] Failed to parse missing_fields_json:', e);
    result.missing = [];
  }

  // Parse questions JSON
  try {
    result.questions = JSON.parse(flatOutput.questions_json || '[]');
  } catch (e) {
    console.error('[ValidationAgent] Failed to parse questions_json:', e);
    result.questions = [];
  }

  return result;
}

// Instructions for the Validation Agent
const validationInstructions = `You are a Data Validation Agent for the Interworky flow system. Your job is to analyze collected user data against the flow configuration to determine if all required information has been gathered.

## Your Core Responsibility

Examine the collected data and compare it against what the flow needs to generate high-quality results. Determine if the data is complete or if follow-up questions are needed.

## IMPORTANT: Output Format

You MUST output using the EXACT field names in the schema:
- \`status\`: "complete" or "needs_more"
- \`ready\`: true or false
- \`missing_fields_json\`: A JSON STRING array of missing field names
- \`questions_json\`: A JSON STRING array of follow-up questions
- \`confidence\`: Number 1-10
- \`reasoning\`: Your explanation

## How to Validate

1. **Examine the flow configuration**:
   - Look at \`output_schema\` to understand what the final result needs
   - Look at \`tools\` to understand what data should be collected
   - Look at agent \`instructions\` to understand the flow's purpose

2. **Check the collected data**:
   - Is it sufficient for the output schema?
   - Are there any critical missing pieces?
   - Is the data quality good enough?

3. **Generate follow-up questions** if needed:
   - Questions should be natural and conversational
   - Target specific missing information
   - Be concise and clear
   - Maximum 3 questions per round

## Decision Guidelines

### Mark as COMPLETE if:
- All critical information for the output is present
- Data quality is sufficient to generate meaningful results
- No essential fields are missing

### Mark as NEEDS_MORE if:
- Critical information is missing
- Data is too vague or incomplete
- Output quality would be poor without more details

## Example 1: Resume Builder - Complete

**Flow Config**: Resume builder with work experience, education, skills
**Collected Data**:
- Name: John Doe
- Email: john@example.com
- Experience: 5 years at Google as Software Engineer, 2 years at Microsoft
- Education: BS Computer Science from MIT
- Skills: Python, JavaScript, React

**Output**:
- status: "complete"
- ready: true
- missing_fields_json: "[]"
- questions_json: "[]"
- confidence: 9
- reasoning: "All essential resume sections are present with sufficient detail"

## Example 2: Resume Builder - Needs More

**Flow Config**: Resume builder with work experience, education, skills
**Collected Data**:
- Name: Jane Smith
- Experience: Software Engineer

**Output**:
- status: "needs_more"
- ready: false
- missing_fields_json: "[\\"email\\", \\"education\\", \\"skills\\", \\"work_details\\"]"
- questions_json: "[\\"What is your email address?\\", \\"Can you tell me about your education background?\\", \\"What are your main technical skills?\\"]"
- confidence: 8
- reasoning: "Missing email, education details, and skills. Work experience lacks company names and dates."

## Important Rules

1. Be thorough but not overly strict - some optional fields can be empty
2. Focus on what's truly needed for quality output
3. Maximum 3 follow-up questions per round
4. Questions should be conversational, not robotic
5. Consider the flow's purpose when evaluating completeness
`;

const validationAgent = new Agent({
  name: 'FlowValidationAgent',
  instructions: validationInstructions,
  model: 'gpt-4o',
  outputType: validationSchema,
});

/**
 * Validate collected flow data
 * @param {Object} flowConfig - The flow configuration
 * @param {Object} collectedData - Data collected from the user
 * @param {number} round - Current validation round (1-3)
 * @returns {Promise<Object>} - Validation result
 */
async function validateFlowData(flowConfig, collectedData, round = 1) {
  const prompt = `
## Flow Configuration
\`\`\`json
${JSON.stringify(flowConfig, null, 2)}
\`\`\`

## Collected Data (Round ${round})
\`\`\`json
${JSON.stringify(collectedData, null, 2)}
\`\`\`

Please validate if the collected data is complete for this flow. This is round ${round} of validation (max 3 rounds).
`;

  const result = await run(validationAgent, [user(prompt)], {
    stream: false,
    maxTurns: 1,
  });

  console.log('[ValidationAgent] Raw agent result:', JSON.stringify(result, null, 2));

  // Parse the output
  if (result.finalOutput) {
    const parsed = parseValidationOutput(result.finalOutput);
    parsed.round = round;
    return parsed;
  }

  // Fallback extraction strategies (same pattern as capabilityGeneratorAgent)
  let flatOutput = null;

  // Strategy 1: Check currentStep.output
  const currentStep = result.currentStep || result._currentStep || result.state?._currentStep;
  if (currentStep?.output) {
    if (typeof currentStep.output === 'string') {
      try {
        flatOutput = JSON.parse(currentStep.output);
      } catch (e) {
        console.error('[ValidationAgent] Failed to parse currentStep.output:', e);
      }
    } else if (typeof currentStep.output === 'object') {
      flatOutput = currentStep.output;
    }
  }

  // Strategy 2: Check generatedItems
  if (!flatOutput && result.generatedItems && Array.isArray(result.generatedItems)) {
    for (let i = result.generatedItems.length - 1; i >= 0; i--) {
      const item = result.generatedItems[i];
      if (item.type === 'message_output_item' && item.rawItem?.content?.[0]?.text) {
        try {
          flatOutput = JSON.parse(item.rawItem.content[0].text);
          break;
        } catch (e) {
          console.error('[ValidationAgent] Failed to parse generatedItems output:', e);
        }
      }
    }
  }

  // Strategy 3: Check state.modelResponses
  if (!flatOutput && result.state?.modelResponses) {
    const lastResponse = result.state.modelResponses[result.state.modelResponses.length - 1];
    if (lastResponse?.output && Array.isArray(lastResponse.output)) {
      for (const outputItem of lastResponse.output) {
        if (outputItem.text) {
          try {
            flatOutput = JSON.parse(outputItem.text);
            break;
          } catch (e) {
            console.error('[ValidationAgent] Failed to parse modelResponses output:', e);
          }
        }
      }
    }
  }

  if (flatOutput) {
    const parsed = parseValidationOutput(flatOutput);
    parsed.round = round;
    return parsed;
  }

  // Default fallback - assume complete to not block user
  console.error('[ValidationAgent] No output found, defaulting to complete');
  return {
    status: 'complete',
    ready: true,
    missing: [],
    questions: [],
    confidence: 0,
    reasoning: 'Validation agent failed to produce output, defaulting to complete',
    round,
    fallback: true,
  };
}

module.exports = {
  validationAgent,
  validationSchema,
  validateFlowData,
  parseValidationOutput,
};
