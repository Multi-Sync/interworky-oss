// src/modules/flow_action/flow_action.service.js
const { getAIProvider } = require('@interworky/providers');
const openai = getAIProvider().getClient();

/**
 * Process a flow action - fully modular based on flow configuration
 *
 * Everything is configurable per flow:
 * - analysis_prompt: System prompt for analyzing data
 * - prompt_template: User prompt template
 * - render_instructions: How to generate HTML
 * - ai_config: Model, temperature, max_tokens
 */
async function processFlowAction({ action, prompt, collectedData, flowId, completionAction }) {
  console.log(`[FlowAction] Processing action: ${action} for flow: ${flowId}`);

  // Get AI config from flow, with defaults
  const aiConfig = {
    model: completionAction?.ai_config?.model || 'gpt-4o',
    temperature: completionAction?.ai_config?.temperature ?? 0.7,
    max_tokens: completionAction?.ai_config?.max_tokens || 4096,
  };

  try {
    // Step 1: Analyze data using analysis_prompt from flow config
    const analysisResult = await analyzeData(
      prompt,
      collectedData,
      completionAction?.analysis_prompt,
      aiConfig
    );

    // Step 2: Generate HTML - always generate, use render_instructions if provided
    let html = null;
    if (completionAction?.render_instructions) {
      // Use custom render instructions from flow config
      html = await generateHTML(
        collectedData,
        analysisResult,
        completionAction.render_instructions,
        aiConfig
      );
    } else {
      // Generate default HTML from analysis result
      html = await generateDefaultHTML(
        collectedData,
        analysisResult,
        aiConfig
      );
    }

    return {
      success: true,
      data: analysisResult,
      html: html,
    };
  } catch (error) {
    console.error('[FlowAction] Error:', error.message);
    return {
      success: false,
      error: error.message,
      data: null,
      html: generateErrorHTML(error.message),
    };
  }
}

/**
 * Analyze collected data using the analysis_prompt from flow config
 * If no analysis_prompt provided, uses a generic default
 */
async function analyzeData(prompt, collectedData, analysisPrompt, aiConfig) {
  const dataString = JSON.stringify(collectedData, null, 2);

  // Use flow-provided analysis_prompt or fall back to generic
  const systemPrompt = analysisPrompt || `You are a helpful assistant. Analyze the provided data and return structured insights as JSON.

The data was collected through a voice conversation. Extract key information and provide useful analysis.

Return your response as valid JSON with relevant keys based on the data provided.`;

  const response = await openai.chat.completions.create({
    model: aiConfig.model,
    messages: [
      { role: 'system', content: systemPrompt + '\n\nRespond ONLY with valid JSON.' },
      { role: 'user', content: prompt || `Analyze this collected data:\n${dataString}` },
    ],
    response_format: { type: 'json_object' },
    temperature: aiConfig.temperature,
    max_tokens: aiConfig.max_tokens,
  });

  const content = response.choices[0]?.message?.content;
  return JSON.parse(content);
}

/**
 * Generate HTML based on render_instructions from the flow config
 */
async function generateHTML(collectedData, analysisResult, renderInstructions, aiConfig) {
  const combinedData = {
    collected: collectedData,
    analysis: analysisResult,
  };

  const systemPrompt = `You are an expert UI designer. Generate clean, modern HTML based on the provided data and instructions.

REQUIREMENTS:
1. Return ONLY valid HTML - no markdown, no code blocks, no explanation
2. Use inline styles for all styling (no external CSS)
3. Use a modern, clean design with good typography and spacing
4. Make it responsive and mobile-friendly
5. Use semantic HTML elements
6. Follow the render instructions exactly

DO NOT include <html>, <head>, or <body> tags - just the content HTML.
DO NOT wrap in code blocks or markdown.
Return pure HTML only.`;

  const response = await openai.chat.completions.create({
    model: aiConfig.model,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Generate HTML for this data:

DATA:
${JSON.stringify(combinedData, null, 2)}

RENDER INSTRUCTIONS:
${renderInstructions}`,
      },
    ],
    temperature: 0.5, // Lower temperature for more consistent HTML output
    max_tokens: aiConfig.max_tokens,
  });

  let html = response.choices[0]?.message?.content || '';

  // Clean up any markdown code blocks if present
  html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

  return html;
}

/**
 * Generate default HTML when no render_instructions provided
 * Creates a clean, professional display of the analysis result
 */
async function generateDefaultHTML(collectedData, analysisResult, aiConfig) {
  const combinedData = {
    collected: collectedData,
    analysis: analysisResult,
  };

  const systemPrompt = `You are an expert UI designer. Generate clean, professional HTML to display the provided data.

REQUIREMENTS:
1. Return ONLY valid HTML - no markdown, no code blocks, no explanation
2. Use inline styles for all styling (no external CSS)
3. Use a modern, clean design with:
   - Font: system-ui, -apple-system, sans-serif
   - Colors: stone/gray palette (#292524 for headings, #57534e for text, #f5f5f4 for backgrounds)
   - Good spacing and typography
4. Make it responsive and mobile-friendly
5. Use semantic HTML elements (section, article, h1-h4, p, ul, etc.)
6. Organize the data logically with clear sections
7. For arrays, display as lists or cards
8. For nested objects, create subsections

DO NOT include <html>, <head>, or <body> tags - just the content HTML.
DO NOT wrap in code blocks or markdown.
Return pure HTML only.

Create a beautiful, readable presentation of all the data provided.`;

  const response = await openai.chat.completions.create({
    model: aiConfig.model,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Generate a beautiful HTML display for this data:\n\n${JSON.stringify(combinedData, null, 2)}`,
      },
    ],
    temperature: 0.5,
    max_tokens: aiConfig.max_tokens,
  });

  let html = response.choices[0]?.message?.content || '';

  // Clean up any markdown code blocks if present
  html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

  return html;
}

/**
 * Generate error HTML
 */
function generateErrorHTML(errorMessage) {
  return `
<div style="padding: 24px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
  <h2 style="font-size: 20px; color: #ef4444; margin: 0 0 8px 0;">Something went wrong</h2>
  <p style="font-size: 14px; color: #6b7280; margin: 0;">${errorMessage}</p>
</div>
  `.trim();
}

module.exports = { processFlowAction };
