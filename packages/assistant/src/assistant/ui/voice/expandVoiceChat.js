import { setVoiceChatContainer } from '../../utils/state';
import { getCurrentMode, setIsMinimized } from '../../utils/voice-state';
import { createFullScreenContainer } from '../templates/fullScreenContainer';
import { createMinimizeButton } from './createMinimizeButton';
import { setMode } from './setMode';

export function expandVoiceChat() {
  setIsMinimized(false);
  // Remove minimized container from body
  const minimizedContainer = document.getElementById('minimized-voice-chat');
  if (minimizedContainer) {
    minimizedContainer.remove();
  }
  // Create and show the full screen container
  let fullScreenContainer = document.getElementById('full-screen-voice-chat');
  if (!fullScreenContainer) {
    fullScreenContainer = createFullScreenContainer();
    fullScreenContainer.id = 'full-screen-voice-chat';
    document.body.appendChild(fullScreenContainer);
    setVoiceChatContainer(fullScreenContainer);
    // Render current mode
    setMode(getCurrentMode());
  }
  fullScreenContainer.style.display = 'flex';

  createMinimizeButton(fullScreenContainer);
}
