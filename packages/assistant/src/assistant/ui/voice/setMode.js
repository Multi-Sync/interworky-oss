import { getVoiceChatContainer } from '../../utils/state';
import {
  getIsMinimized,
  getWaveform,
  setCurrentMode,
} from '../../utils/voice-state';
import { renderListeningMode } from './renderListeningMode';
import { renderReadyMode } from './renderReadyMode';
import { renderSpeakingMode } from './renderSpeakingMode';
import { updateMinimizedStatus } from './updateMinimizedStatus';

export function setMode(mode) {
  setCurrentMode(mode);
  const container = getVoiceChatContainer();
  if (container) {
    container.setAttribute('data-mode', mode);
  }

  // Don't re-render if minimized
  if (getIsMinimized()) {
    updateMinimizedStatus(mode);
    return;
  }

  if (container && container.children) {
    const children = Array.from(container.children).filter(
      (child) =>
        child.id !== 'close-button' &&
        child.id !== 'minimize-button' &&
        child.id !== 'waveform-visualizer'
    );
    children.forEach((child) => child.remove());
  }

  switch (mode) {
    case 'MODE_1':
      renderSpeakingMode(container);
      if (getWaveform()) getWaveform().startSpeaking();
      setTimeout(() => {
        const statusIndicator = container.querySelector('#status-indicator');
        if (statusIndicator) statusIndicator.innerText = 'Agent Speaking';
      }, 100);

      // Announce to screen readers and AI agents
      const speakingStatus = document.getElementById('voice-status');
      if (speakingStatus) {
        speakingStatus.textContent = 'Assistant is speaking. Please wait.';
      }
      break;
    case 'MODE_2':
      renderListeningMode(container);
      if (getWaveform()) getWaveform().startListening();
      setTimeout(() => {
        const statusIndicator = container.querySelector('#status-indicator');
        if (statusIndicator) statusIndicator.innerText = 'Agent Listening';
      }, 100);

      // Announce to screen readers and AI agents
      const listeningStatus = document.getElementById('voice-status');
      if (listeningStatus) {
        listeningStatus.textContent = 'Listening. Speak your message.';
      }
      break;
    case 'READY':
      renderReadyMode(container);

      // Announce to screen readers and AI agents
      const readyStatus = document.getElementById('voice-status');
      if (readyStatus) {
        readyStatus.textContent =
          'Voice assistant ready. Press the button to start talking.';
      }
      break;
  }
}
