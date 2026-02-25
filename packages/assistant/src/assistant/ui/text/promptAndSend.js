import logger from '../../../utils/logger';
import { getRealtimeClient } from '../../utils/text-state';
import { createInputField, createUserMessage } from '../messages/builder';

export function promptAndSend() {
  createInputField('Type a message…', async (userText) => {
    createUserMessage(userText, async () => {
      const conversationItemCreateEvent = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: userText.trim() }],
        },
      };

      // Wait for connection to be ready before sending
      const client = getRealtimeClient();
      if (client && client.isConnected()) {
        client.send(conversationItemCreateEvent);
      } else {
        logger.warn(
          'IW038',
          'Interworky Error 1038: please report to hello@interworky.com'
        );
        // Wait for connection to be ready
        const checkConnection = () => {
          if (client && client.isConnected()) {
            client.send(conversationItemCreateEvent);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      }
    });
  });
}
