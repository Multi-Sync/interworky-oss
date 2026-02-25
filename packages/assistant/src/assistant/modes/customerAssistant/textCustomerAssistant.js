import { createAssistantMessage } from '../../ui/messages/builder';
import { askForUserInfoEmailOnly } from '../../ui/userFlows';
import { InterworkyRTAgent } from '../../utils/InterworkyRTAgent';
import { getAssistantInfo, getPatient } from '../../utils/state';
import { firstMessageAlreadyShown, setFirstMessageAlreadyShown } from './index';
import { handleMessage } from '../../handlers/common/handleMessage';
import { handleConnectionError } from '../../handlers/common/handleConnectionError';
import { handleConnectionClose } from '../../handlers/common/handleConnectionClose';
import { getRealtimeClient, setRealtimeClient } from '../../utils/text-state';
import { promptAndSend } from '../../ui/text/promptAndSend';
import { getInstructions } from '../../utils/knowledge-utils';
import logger from '../../../utils/logger';

export const startCustomerAssistantTextMode = async () => {
  const assistantInfoFirstMessage = getAssistantInfo().first_message;
  const welcomeMessage = assistantInfoFirstMessage || 'How can I help you?';
  runRealtimeConnection();

  if (firstMessageAlreadyShown) {
    askForUserInfoIfNeeded();
  } else {
    createAssistantMessage(
      welcomeMessage,
      false,
      false,
      () => {
        askForUserInfoIfNeeded();
      },
      false,
      getRealtimeClient()
    );
    setFirstMessageAlreadyShown(true);
  }
};

const askForUserInfoIfNeeded = () => {
  const patient = getPatient();
  const contactInfoRequired = getAssistantInfo().contact_info_required;
  if (contactInfoRequired && !patient.email) {
    askForUserInfoEmailOnly(promptAndSend);
  } else {
    promptAndSend();
  }
};

async function runRealtimeConnection() {
  // 1) instantiate InterworkyRTAgent in text-only mode
  setRealtimeClient(
    new InterworkyRTAgent({
      model: process.env.AI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17',
      textOnly: true, // Enable text-only mode
    })
  );

  // 2) listen to events
  getRealtimeClient().addEventListener('open', () => {
    logger.info('IW032', 'Interworky RT Agent connected');
  });

  getRealtimeClient().addEventListener('message', (e) => {
    handleMessage(e.detail, getRealtimeClient(), 'text');
  });

  getRealtimeClient().addEventListener('error', (e) => {
    logger.error('IW036', '⚠️ Interworky RT Agent Error:', e);
    handleConnectionError(e);
  });

  getRealtimeClient().addEventListener('close', () => {
    logger.warn('IW037', 'Interworky RT Agent closed');
    handleConnectionClose();
  });

  // 3) connect with instructions
  await getRealtimeClient().connect(null, getInstructions());
}
