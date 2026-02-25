/**
 * Tool definition for capturing user email during voice conversations
 * This tool allows the OpenAI agent to request and capture user email
 */
export const captureEmailTool = {
  type: 'function',
  description:
    "Capture the user's email address for contact purposes. Use this when you need to collect the user's email address.",
  name: 'capture_email',
  parameters: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: "The user's email address",
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
    },
    required: ['email'],
  },
};
