// voiceCustomerAssistant.js
import { createElement } from '../../ui/baseMethods.js';
import { InterworkyRTAgent } from '../../utils/InterworkyRTAgent.js';
import {
  clearVoiceChatMessages,
  getIsVoiceChatActive,
  setIsVoiceChatActive,
} from '../../utils/state';
import {
  getIsMuted,
  getAudioElement,
  getRealtimeClient,
  setAudioElement,
  setRealtimeClient,
} from '../../utils/voice-state.js';
import { handleMessage } from '../../handlers/common/handleMessage.js';
import { handleConnectionError } from '../../handlers/common/handleConnectionError.js';
import { handleConnectionClose } from '../../handlers/common/handleConnectionClose.js';
import { minimizeVoiceChat } from '../../ui/voice/minimizeVoiceChat.js';
import { toggleMuteUI } from '../../ui/voice/toggleMuteUI.js';
import { getInstructions } from '../../utils/knowledge-utils.js';
import logger from '../../../utils/logger.js';

function forceMute() {
  if (!getIsMuted()) {
    toggleMuteUI();
  }
}

const onChatInBackground = () => {
  if (!getRealtimeClient()) return;

  // Force mute when going to background
  forceMute();
  // Suspend audio context
  if (
    getRealtimeClient().audioCtx &&
    getRealtimeClient().audioCtx.state === 'running'
  ) {
    getRealtimeClient().audioCtx.suspend().catch(console.error);
  }
};

const onChatInForeground = () => {
  if (!getRealtimeClient()) return;
  // Resume audio context if not manually muted
  if (!getIsMuted() && getRealtimeClient().audioCtx?.state === 'suspended') {
    getRealtimeClient().audioCtx.resume().catch(console.error);
  }
};

// Add event listeners for auto-mute
window.addEventListener('blur', onChatInBackground);
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    onChatInBackground();
  } else if (document.visibilityState === 'visible') {
    onChatInForeground();
  }
});

export async function startGenAICustomerAssistantVoice() {
  // Check if voice chat is already active to prevent duplicate conversations
  if (getIsVoiceChatActive()) {
    logger.warn(
      'Voice chat is already active, ignoring duplicate start request'
    );
    return;
  }

  // Check if there's already a connected client
  const existingClient = getRealtimeClient();
  if (
    existingClient &&
    existingClient.isConnected &&
    existingClient.isConnected()
  ) {
    logger.warn(
      'Voice client is already connected, ignoring duplicate start request'
    );
    return;
  }

  // Clean up any existing connection before starting new one
  if (existingClient) {
    logger.info('Cleaning up existing voice connection');
    // Stop microphone tracks if they exist
    if (existingClient.micStream && existingClient.micStream.getTracks) {
      existingClient.micStream.getTracks().forEach((track) => track.stop());
    }
    existingClient.close();
    setRealtimeClient(null);
  }

  // Clean up existing audio element
  const existingAudioElement = getAudioElement();
  if (existingAudioElement) {
    existingAudioElement.pause();
    existingAudioElement.srcObject = null;
  }

  setIsVoiceChatActive(true);
  setAudioElement(createElement('audio', {}, {}));
  runRealtimeConnection();

  clearVoiceChatMessages();
  minimizeVoiceChat();
}

async function runRealtimeConnection() {
  // 1) instantiate
  setRealtimeClient(
    new InterworkyRTAgent({
      model: process.env.AI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17',
      iceServers: [],
    })
  );

  // 2) listen to events
  getRealtimeClient().addEventListener('open', () => {
    logger.info('IW033', 'Interworky connected');
  });

  getRealtimeClient().addEventListener('message', (e) => {
    handleMessage(e.detail, getRealtimeClient(), 'voice');
  });

  getRealtimeClient().addEventListener('error', (e) => {
    logger.error('IW034', '⚠️ Interworky RTC Error:', e);
    handleConnectionError(e);
  });

  getRealtimeClient().addEventListener('close', () => {
    logger.warn('IW035', 'Interworky DC closed');
    handleConnectionClose();
  });
  await getRealtimeClient().connect(getAudioElement(), getInstructions());
}
