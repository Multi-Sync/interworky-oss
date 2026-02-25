/**
 * Creator Agent
 * Generates structured results and HTML from collected flow data
 * Part of the dual-agent result generation system (Creator + Judge)
 *
 * Uses OpenAI Agents SDK with flattened Zod schema pattern
 */

const { Agent, run, user } = require('@openai/agents');
const { z } = require('zod');

// Flattened output schema for generated result
const creatorSchema = z.object({
  title: z
    .string()
    .describe('A title for the result (e.g., "John Doe - Software Engineer Resume")'),
  summary: z
    .string()
    .describe('A brief summary of the generated result (1-2 sentences)'),
  result_json: z
    .string()
    .describe(
      'JSON string containing the structured result data. Structure depends on the flow type. Example for resume: {"name": "John", "experience": [...], "education": [...], "skills": [...]}'
    ),
  html_content: z
    .string()
    .describe(
      'Well-formatted HTML content for displaying the result. Use semantic HTML with proper structure. Include inline styles for formatting.'
    ),
  confidence: z
    .number()
    .describe('Confidence score 1-10 for the quality of this result'),
  notes: z
    .string()
    .describe('Any notes about the generation process, limitations, or assumptions made'),
});

/**
 * Parse the flattened agent output into structured result
 * @param {Object} flatOutput - The flattened output from the agent
 * @returns {Object} - Parsed result
 */
function parseCreatorOutput(flatOutput) {
  const result = {
    title: flatOutput.title,
    summary: flatOutput.summary,
    html: flatOutput.html_content,
    confidence: flatOutput.confidence,
    notes: flatOutput.notes,
  };

  // Parse result JSON
  try {
    result.data = JSON.parse(flatOutput.result_json || '{}');
  } catch (e) {
    console.error('[CreatorAgent] Failed to parse result_json:', e);
    result.data = {};
  }

  return result;
}

// Instructions for the Creator Agent
const creatorInstructions = `You are a Result Creator Agent for the Interworky flow system. Your job is to generate high-quality, structured results and beautiful HTML output from collected user data.

## Your Core Responsibility

Transform raw collected data into polished, professional results that match the flow's output schema. Generate both structured data and HTML for display.

## IMPORTANT: Output Format

You MUST output using the EXACT field names in the schema:
- \`title\`: A descriptive title for the result
- \`summary\`: Brief 1-2 sentence summary
- \`result_json\`: JSON STRING containing structured data
- \`html_content\`: Well-formatted HTML with inline styles
- \`confidence\`: Number 1-10
- \`notes\`: Any notes about the generation

## How to Generate Results

1. **Analyze the flow configuration**:
   - Understand the \`output_schema\` structure
   - Know what type of result is expected (resume, report, analysis, etc.)
   - Follow the flow's intended purpose

2. **Process collected data**:
   - Extract all relevant information
   - Organize it according to the output schema
   - Fill in reasonable defaults for optional fields
   - DO NOT hallucinate data that wasn't collected

3. **Generate HTML**:
   - Use semantic HTML (h1, h2, section, ul, etc.)
   - Include inline CSS for styling
   - Make it visually appealing and professional
   - Ensure readability and structure

## HTML Styling Guidelines

Use these inline styles for consistency:
- Font: \`font-family: system-ui, -apple-system, sans-serif\`
- Headings: Use appropriate sizes and weights
- Sections: Add proper spacing with margin/padding
- Lists: Well-formatted bullets or numbers
- Colors: Professional, readable colors

## Example: Resume Generation

**Collected Data**:
- Name: John Doe
- Email: john@example.com
- Experience: Software Engineer at Google (2019-2023), Developer at Startup (2017-2019)
- Education: BS Computer Science, MIT, 2017
- Skills: Python, JavaScript, React, Node.js

**Output**:
- title: "John Doe - Software Engineer"
- summary: "Professional resume for John Doe, an experienced software engineer with 6+ years in the industry"
- result_json: "{\\"name\\": \\"John Doe\\", \\"email\\": \\"john@example.com\\", \\"experience\\": [{\\"company\\": \\"Google\\", ...}], ...}"
- html_content: "<div style=\\"font-family: system-ui...\\"><h1>John Doe</h1>..."
- confidence: 9
- notes: "Generated complete resume with all provided information"

## Handling Judge Feedback

If you receive feedback from the Judge Agent, incorporate it:
- Address specific issues mentioned
- Improve areas marked as weak
- Maintain accuracy with the original data
- Don't add information that wasn't collected

## Important Rules

1. NEVER hallucinate or make up data not provided
2. Use only the information from collected_data
3. Follow the output_schema structure closely
4. Generate professional, polished HTML
5. Be honest about confidence level
6. Note any assumptions or limitations
`;

const creatorAgent = new Agent({
  name: 'ResultCreatorAgent',
  instructions: creatorInstructions,
  model: 'gpt-4o',
  outputType: creatorSchema,
});

/**
 * Generate result from collected flow data
 * @param {Object} flowConfig - The flow configuration
 * @param {Object} collectedData - Data collected from the user
 * @param {string|null} judgeFeedback - Feedback from the judge agent (for iterations)
 * @param {number} iteration - Current iteration (1-3)
 * @returns {Promise<Object>} - Generated result
 */
async function generateResult(flowConfig, collectedData, judgeFeedback = null, iteration = 1) {
  let prompt = `
## Flow Configuration
\`\`\`json
${JSON.stringify(flowConfig, null, 2)}
\`\`\`

## Collected Data
\`\`\`json
${JSON.stringify(collectedData, null, 2)}
\`\`\`
`;

  if (judgeFeedback) {
    prompt += `
## Judge Feedback (Iteration ${iteration})
The following feedback was provided by the quality judge. Please address these issues:
${judgeFeedback}

Please improve your result based on this feedback while maintaining accuracy with the collected data.
`;
  } else {
    prompt += `
Please generate a high-quality result for this flow. This is iteration ${iteration}.
`;
  }

  const result = await run(creatorAgent, [user(prompt)], {
    stream: false,
    maxTurns: 1,
  });

  console.log('[CreatorAgent] Raw agent result:', JSON.stringify(result, null, 2));

  // Parse the output
  if (result.finalOutput) {
    const parsed = parseCreatorOutput(result.finalOutput);
    parsed.iteration = iteration;
    return parsed;
  }

  // Fallback extraction strategies
  let flatOutput = null;

  const currentStep = result.currentStep || result._currentStep || result.state?._currentStep;
  if (currentStep?.output) {
    if (typeof currentStep.output === 'string') {
      try {
        flatOutput = JSON.parse(currentStep.output);
      } catch (e) {
        console.error('[CreatorAgent] Failed to parse currentStep.output:', e);
      }
    } else if (typeof currentStep.output === 'object') {
      flatOutput = currentStep.output;
    }
  }

  if (!flatOutput && result.generatedItems && Array.isArray(result.generatedItems)) {
    for (let i = result.generatedItems.length - 1; i >= 0; i--) {
      const item = result.generatedItems[i];
      if (item.type === 'message_output_item' && item.rawItem?.content?.[0]?.text) {
        try {
          flatOutput = JSON.parse(item.rawItem.content[0].text);
          break;
        } catch (e) {
          console.error('[CreatorAgent] Failed to parse generatedItems output:', e);
        }
      }
    }
  }

  if (!flatOutput && result.state?.modelResponses) {
    const lastResponse = result.state.modelResponses[result.state.modelResponses.length - 1];
    if (lastResponse?.output && Array.isArray(lastResponse.output)) {
      for (const outputItem of lastResponse.output) {
        if (outputItem.text) {
          try {
            flatOutput = JSON.parse(outputItem.text);
            break;
          } catch (e) {
            console.error('[CreatorAgent] Failed to parse modelResponses output:', e);
          }
        }
      }
    }
  }

  if (flatOutput) {
    const parsed = parseCreatorOutput(flatOutput);
    parsed.iteration = iteration;
    return parsed;
  }

  // Error fallback
  console.error('[CreatorAgent] No output found in result');
  throw new Error('Creator agent failed to generate result');
}

module.exports = {
  creatorAgent,
  creatorSchema,
  generateResult,
  parseCreatorOutput,
};
