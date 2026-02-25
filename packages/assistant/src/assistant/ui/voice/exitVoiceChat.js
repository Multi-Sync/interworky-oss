import { startCustomerAssistantTextMode } from '../../modes/customerAssistant/textCustomerAssistant';
import { getVoiceChatContainer, setIsVoiceChatActive } from '../../utils/state';
import {
  getAudioElement,
  getRealtimeClient,
  getWaveform,
  setWaveform,
} from '../../utils/voice-state';
import { clearModeBadge } from '../templates/voice/createStatus';

export function exitVoiceChat() {
  clearModeBadge();
  if (getWaveform()) {
    getWaveform().stop();
    setWaveform(null);
  }
  const assistantContainer = document.querySelector('#assistant-container');
  assistantContainer.style.width = '367px';
  assistantContainer.style.height = 'calc(100dvh - 200px)';
  setIsVoiceChatActive(false);
  // Stop all mic tracks to release microphone permissions
  if (getRealtimeClient() && getRealtimeClient().micStream) {
    getRealtimeClient()
      .micStream.getTracks()
      .forEach((track) => track.stop());
  }
  // Release audio element resources (stop playback and clear srcObject)
  if (getAudioElement()) {
    getAudioElement().pause();
    getAudioElement().srcObject = null;
  }
  getRealtimeClient().close();
  const fullScreenContainer = getVoiceChatContainer();
  fullScreenContainer.remove();

  // Remove minimized container if it exists
  const minimizedContainer = document.getElementById('minimized-voice-chat');
  if (minimizedContainer) {
    minimizedContainer.remove();
  }

  startCustomerAssistantTextMode();
  // Wait a short moment for the UI to reset
  setTimeout(() => {
    // Enable the input field in text mode
    const inputField = document.querySelector('#interworky-input-field');
    if (inputField) {
      inputField.disabled = false;
      inputField.style.cursor = 'auto';
      inputField.setAttribute('aria-disabled', false);
    }

    // Enable the submit button
    const submitButton = document.querySelector('#submit-button');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.style.cursor = 'pointer';
      submitButton.setAttribute('aria-disabled', false);
    }
  }, 300);
}
