/**
 * Capability Generator Agent
 * Converts natural language descriptions into structured capability definitions
 *
 * NOTE: The outputType schema is FLATTENED to avoid OpenAI Agents SDK issues with
 * deeply nested objects/arrays. Complex fields use JSON strings that are parsed afterward.
 * See CLAUDE.md for more details on this pattern.
 */

const { Agent, run, user } = require('@openai/agents');
const { z } = require('zod');

// FLATTENED Output schema for the generated capability
// Using JSON strings for nested structures to avoid OpenAI Agents SDK parsing issues
const capabilitySchema = z.object({
  capability_type: z
    .enum(['http', 'email'])
    .describe(
      'The type of capability: "http" for API endpoints, "email" for sending emails. Use "email" if the description mentions sending emails, notifications, or contacting someone. Use "http" if it mentions API calls, webhooks, or external services.',
    ),
  method_name: z
    .string()
    .describe('A descriptive name for the capability in snake_case (e.g., file_lawsuit_request, capture_contact_info)'),
  method_description: z.string().describe('A clear, concise description of what this capability does (1-2 sentences)'),
  method_instruction: z
    .string()
    .describe(
      'Instructions for when the AI assistant should use this capability. Start with "Use this when..." (e.g., "Use this when a user wants to file a lawsuit or legal complaint")',
    ),

  // HTTP-specific fields (only include if capability_type is 'http')
  method_verb: z
    .string()
    .describe(
      'HTTP method to use: GET, POST, PUT, DELETE, or PATCH. Required only if capability_type is "http". Default to POST for data creation. Leave empty string for email capabilities.',
    ),
  method_endpoint: z
    .string()
    .describe(
      'The full URL endpoint. Required only if capability_type is "http". Must be a valid URL (e.g., https://api.example.com/endpoint). Leave empty string for email capabilities.',
    ),

  // Email-specific fields as JSON string (only include if capability_type is 'email')
  email_config_json: z
    .string()
    .describe(
      'JSON string of email configuration. Required only if capability_type is "email", otherwise use empty string "". Format: {"to": "email@example.com", "subject": "Subject with {{user_name}}", "from_name": "Sender Name", "template_type": "simple|detailed"}',
    ),

  // Shared fields as JSON strings (work for both types)
  dynamic_params_json: z
    .string()
    .describe(
      'JSON string array of parameters to collect from user. Format: [{"field_name": "user_email", "field_type": "string|number", "field_description": "Description", "field_required": true}]',
    ),
  fixed_params_json: z
    .string()
    .describe(
      'JSON string array of fixed parameters (usually empty array "[]"). Format: [{"field_name": "name", "field_type": "string|number", "field_description": "Description", "field_value": "fixed_value", "field_required": true}]',
    ),

  reasoning: z
    .string()
    .describe('Explain your reasoning for the capability type choice, parameter selection, and overall structure'),
});

/**
 * Parse the flattened agent output into the full capability structure
 * @param {Object} flatOutput - The flattened output from the agent
 * @returns {Object} - The parsed capability with nested objects
 */
function parseAgentOutput(flatOutput) {
  const result = {
    capability_type: flatOutput.capability_type,
    method_name: flatOutput.method_name,
    method_description: flatOutput.method_description,
    method_instruction: flatOutput.method_instruction,
    reasoning: flatOutput.reasoning,
  };

  // Parse HTTP-specific fields
  if (flatOutput.capability_type === 'http') {
    result.method_verb = flatOutput.method_verb || 'POST';
    result.method_endpoint = flatOutput.method_endpoint || '';
  }

  // Parse email config JSON
  if (flatOutput.capability_type === 'email' && flatOutput.email_config_json) {
    try {
      const emailConfig = JSON.parse(flatOutput.email_config_json);
      result.email_config = {
        to: emailConfig.to || '',
        subject: emailConfig.subject || '',
        from_name: emailConfig.from_name || 'Interworky Assistant',
        template_type: emailConfig.template_type || 'simple',
      };
    } catch (e) {
      console.error('[CapabilityGenerator] Failed to parse email_config_json:', e);
      result.email_config = {
        to: '',
        subject: '',
        from_name: 'Interworky Assistant',
        template_type: 'simple',
      };
    }
  }

  // Parse dynamic params JSON
  try {
    result.dynamic_params = JSON.parse(flatOutput.dynamic_params_json || '[]');
  } catch (e) {
    console.error('[CapabilityGenerator] Failed to parse dynamic_params_json:', e);
    result.dynamic_params = [];
  }

  // Parse fixed params JSON
  try {
    result.fixed_params = JSON.parse(flatOutput.fixed_params_json || '[]');
  } catch (e) {
    console.error('[CapabilityGenerator] Failed to parse fixed_params_json:', e);
    result.fixed_params = [];
  }

  return result;
}

// Instructions for the Capability Generator Agent
const capabilityGeneratorInstructions = `You are an AI Capability Generator that converts natural language descriptions into structured capability definitions for an AI assistant platform called Interworky.

## Your Core Responsibility

Transform user descriptions of desired capabilities into well-structured configurations that can be executed by the Interworky platform.

## IMPORTANT: Output Format

You MUST output using the EXACT field names in the schema. Some fields require JSON strings:
- \`email_config_json\`: A JSON STRING (not object) for email configuration
- \`dynamic_params_json\`: A JSON STRING (not array) containing the array of parameters
- \`fixed_params_json\`: A JSON STRING (not array), usually "[]"

## Understanding Capability Types

### 1. EMAIL Capabilities
Use \`capability_type: "email"\` when the description mentions:
- Sending emails or notifications
- Contacting someone via email
- Notifying a team or person
- Email alerts or updates
- Examples: "send an email to the office", "notify the legal team", "email me when someone submits"

For email capabilities:
- Set \`method_verb\` to empty string ""
- Set \`method_endpoint\` to empty string ""
- Set \`email_config_json\` to a JSON string with: to, subject, from_name, template_type

### 2. HTTP Capabilities
Use \`capability_type: "http"\` when the description mentions:
- API endpoints or webhooks
- External services or integrations
- Database operations via API
- Third-party platform integration
- Examples: "call an API", "send data to our CRM", "integrate with Stripe"

For HTTP capabilities:
- Set \`method_verb\`: Usually "POST" for creating/sending data, "GET" for retrieving
- Set \`method_endpoint\`: Full URL (e.g., "https://api.example.com/appointments")
- Set \`email_config_json\` to empty string ""

## Identifying Dynamic Parameters

Dynamic parameters are pieces of information the AI assistant will collect from users during conversation.

**Good examples of dynamic parameters:**
- User contact info: email, phone, name, address
- Request details: description, date, time, reason
- Preferences: options, choices, selections
- Context: location, company, role

## Naming Conventions

### method_name
- Use snake_case
- Be descriptive but concise
- Examples: \`file_lawsuit_request\`, \`book_appointment\`, \`capture_lead_info\`

### field_name (for parameters)
- Use snake_case
- Be specific and clear
- Examples: \`user_email\`, \`phone_number\`, \`case_description\`, \`preferred_date\`

## Examples

### Example 1: Email Capability
**User Input:** "Capture user email, phone, and message, then send an email to support@company.com"

**Your Output:**
- capability_type: "email"
- method_name: "submit_support_request"
- method_description: "Captures support request and sends notification email"
- method_instruction: "Use this when a user wants to contact support or submit an inquiry"
- method_verb: ""
- method_endpoint: ""
- email_config_json: "{\\"to\\": \\"support@company.com\\", \\"subject\\": \\"New Support Request from {{user_name}}\\", \\"from_name\\": \\"Support Assistant\\", \\"template_type\\": \\"simple\\"}"
- dynamic_params_json: "[{\\"field_name\\": \\"user_name\\", \\"field_type\\": \\"string\\", \\"field_description\\": \\"User's full name\\", \\"field_required\\": true}, {\\"field_name\\": \\"user_email\\", \\"field_type\\": \\"string\\", \\"field_description\\": \\"User's email address\\", \\"field_required\\": true}, {\\"field_name\\": \\"phone\\", \\"field_type\\": \\"string\\", \\"field_description\\": \\"User's phone number\\", \\"field_required\\": true}, {\\"field_name\\": \\"message\\", \\"field_type\\": \\"string\\", \\"field_description\\": \\"The support message or inquiry\\", \\"field_required\\": true}]"
- fixed_params_json: "[]"
- reasoning: "Email capability because user wants to send an email to support@company.com"

### Example 2: HTTP Capability
**User Input:** "Create a capability to book appointments at https://api.calendar.com/appointments"

**Your Output:**
- capability_type: "http"
- method_name: "book_appointment"
- method_description: "Books an appointment in the calendar system"
- method_instruction: "Use this when a user wants to schedule or book an appointment"
- method_verb: "POST"
- method_endpoint: "https://api.calendar.com/appointments"
- email_config_json: ""
- dynamic_params_json: "[{\\"field_name\\": \\"user_name\\", \\"field_type\\": \\"string\\", \\"field_description\\": \\"Name of the person booking\\", \\"field_required\\": true}, {\\"field_name\\": \\"user_email\\", \\"field_type\\": \\"string\\", \\"field_description\\": \\"Email for confirmation\\", \\"field_required\\": true}, {\\"field_name\\": \\"appointment_date\\", \\"field_type\\": \\"string\\", \\"field_description\\": \\"Desired date (YYYY-MM-DD)\\", \\"field_required\\": true}]"
- fixed_params_json: "[]"
- reasoning: "HTTP capability because it integrates with an external API endpoint"

## Important Guidelines

1. **Always provide reasoning**: Explain why you chose the capability type
2. **Match user intent**: If they mention email/notification, use email type. If they mention API/integration, use HTTP
3. **Be comprehensive with parameters**: Include all fields needed to fulfill the capability
4. **JSON strings must be valid**: Ensure all JSON strings are properly escaped and valid JSON
5. **Keep field_required true**: Unless the parameter is clearly optional
`;

const capabilityGeneratorAgent = new Agent({
  name: 'CapabilityGeneratorAgent',
  instructions: capabilityGeneratorInstructions,
  model: 'gpt-4o', // Using GPT-4o for better reasoning and structured outputs
  outputType: capabilitySchema,
});

/**
 * Generate a capability from natural language description
 * @param {string} description - Natural language description of the capability
 * @returns {Promise<Object>} - Generated capability object
 */
async function generateCapability(description) {
  const result = await run(capabilityGeneratorAgent, [user(description)], {
    stream: false,
    maxTurns: 1, // Single turn for generation
  });

  console.log('[CapabilityGenerator] Raw agent result:', JSON.stringify(result, null, 2));

  // When using outputType with a Zod schema, the SDK returns flattened output
  // We need to parse the JSON string fields back into objects
  if (result.finalOutput) {
    console.log('[CapabilityGenerator] Flattened output received:', result.finalOutput);

    // Parse the flattened output into the expected nested structure
    const parsedCapability = parseAgentOutput(result.finalOutput);
    console.log('[CapabilityGenerator] Parsed capability:', parsedCapability);

    return parsedCapability;
  }

  // Fallback: Try to extract output from other locations (OpenAI Agents SDK quirk)
  let flatOutput = null;

  // Strategy 1: Check currentStep.output
  const currentStep = result.currentStep || result._currentStep || result.state?._currentStep;
  if (currentStep?.output) {
    if (typeof currentStep.output === 'string') {
      try {
        flatOutput = JSON.parse(currentStep.output);
      } catch (e) {
        console.error('[CapabilityGenerator] Failed to parse currentStep.output:', e);
      }
    } else if (typeof currentStep.output === 'object') {
      flatOutput = currentStep.output;
    }
  }

  // Strategy 2: Check generatedItems for message_output_item
  if (!flatOutput && result.generatedItems && Array.isArray(result.generatedItems)) {
    for (let i = result.generatedItems.length - 1; i >= 0; i--) {
      const item = result.generatedItems[i];
      if (item.type === 'message_output_item' && item.rawItem?.content?.[0]?.text) {
        try {
          flatOutput = JSON.parse(item.rawItem.content[0].text);
          break;
        } catch (e) {
          console.error('[CapabilityGenerator] Failed to parse generatedItems output:', e);
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
            console.error('[CapabilityGenerator] Failed to parse modelResponses output:', e);
          }
        }
      }
    }
  }

  if (flatOutput) {
    console.log('[CapabilityGenerator] Extracted flattened output via fallback:', flatOutput);
    const parsedCapability = parseAgentOutput(flatOutput);
    console.log('[CapabilityGenerator] Parsed capability:', parsedCapability);
    return parsedCapability;
  }

  // Final fallback error handling
  console.error('[CapabilityGenerator] No output found in result:', result);
  throw new Error(
    'No structured output returned from AI agent. The model may have failed to generate valid output matching the schema.',
  );
}

module.exports = { capabilityGeneratorAgent, capabilitySchema, generateCapability, parseAgentOutput };
