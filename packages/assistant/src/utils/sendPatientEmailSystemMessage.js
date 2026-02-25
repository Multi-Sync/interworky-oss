/**
 * Sends patient email as a system message to the agent without requiring a response
 * @param {Object} client - The realtime client (voice or text)
 * @param {string} email - The patient's email address
 */
export function sendPatientEmailSystemMessage(client, email) {
  if (!client || !client.isConnected()) {
    console.warn(
      'Cannot send patient email system message - client not connected'
    );
    return;
  }

  const systemMessage = {
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'system',
      content: [{ type: 'input_text', text: `Patient email: ${email}` }],
    },
  };

  client.send(systemMessage);
  // Note: NO response.create() - this is key to avoid triggering agent response
}
