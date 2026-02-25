/**
 * Tool definition for retrieving current client information
 * This tool allows the OpenAI agent to understand what client data is already collected
 */
export const getClientInfoTool = {
  type: 'function',
  description:
    'Get current client information to understand what data is already collected',
  name: 'get_client_info',
  parameters: {
    type: 'object',
    properties: {},
  },
};
