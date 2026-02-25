import { svgCloseIcon } from '../../../styles/icons';
import { closeButtonVoiceMode } from '../../../styles/styles';
import { setIsVoiceChatActive } from '../../utils/state';
import { getAudioElement, getRealtimeClient } from '../../utils/voice-state';
import { appendChild, createElement } from '../baseMethods';
import { closeChatButtonClickHandler } from '../handlers/closeChatButtonClickHandler';
import ariaUtils from '../../../utils/aria';

export function createExitButton(container) {
  const exitButton = createElement('div', {}, {});
  Object.assign(exitButton.style, closeButtonVoiceMode, {
    backgroundColor: 'white',
    borderRadius: '50%',
    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 8px',
  });
  exitButton.innerHTML = svgCloseIcon;

  // Add ARIA attributes for exit button
  ariaUtils.setAttributes(exitButton, {
    role: 'button',
    'aria-label': 'Exit voice mode and return to text chat',
    tabindex: '0',
  });

  const handleExit = (e) => {
    setIsVoiceChatActive(false);
    closeChatButtonClickHandler(e);
    // Stop all mic tracks to release microphone permissions
    if (getRealtimeClient().micStream) {
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
  };

  exitButton.onclick = handleExit;

  // Add keyboard support
  exitButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleExit(e);
    }
  });

  appendChild(container, exitButton);
}
