import { UserSpeakingSVG } from '../../../styles/icons';
import {
  controlsContainerStyle,
  indicatorsStyle,
  statusIndicatorStyle,
  textChatModeStyle,
} from '../../../styles/styles';
import { setVisualizerBackground } from '../../../styles/themeManager';
import { startCustomerAssistantTextMode } from '../../modes/customerAssistant/textCustomerAssistant';
import { getAssistantInfo, getIsVoiceChatActive } from '../../utils/state';
import { getRealtimeClient } from '../../utils/voice-state';
import { appendChild, createElement } from '../baseMethods';
import { createVisualizer } from '../templates/visualizer';
import { createExitButton } from './createExitButton';
import { createMuteButton } from './createMuteButton';
import { createPoweredByContent } from './createPoweredByContent';
import { exitVoiceChat } from './exitVoiceChat';

export async function renderSpeakingMode(container) {
  if (!getIsVoiceChatActive()) {
    return;
  }
  const visualizerWrapper = createVisualizer(false);
  visualizerWrapper.style.textAlign = 'center';
  appendChild(container, visualizerWrapper);

  const indicators = createElement('div', indicatorsStyle, {
    id: 'indicators',
  });

  const user = createElement(
    'div',
    { opacity: '0.5', width: '48px', height: '48px' },
    {}
  );
  user.id = 'user';
  user.innerHTML = UserSpeakingSVG;
  appendChild(indicators, user);

  const assistant = createElement(
    'div',
    { width: '48px', height: '48px', borderRadius: '50%' },
    {}
  );
  assistant.id = 'assistant';
  setVisualizerBackground(getAssistantInfo().assistant_image_url, assistant);

  // Initialize visualizer for MODE_1 as well
  if (window.sharedAudioVisualizer && !indicators.querySelector('canvas')) {
    appendChild(indicators, window.sharedAudioVisualizer.element);
    window.sharedAudioVisualizer.start();
  }

  appendChild(indicators, assistant);

  appendChild(container, indicators);

  // Add status indicator below the indicators
  const statusIndicator = createElement('div', statusIndicatorStyle, {
    innerText: 'Agent Speaking',
    id: 'status-indicator',
  });

  appendChild(container, statusIndicator);

  const textChatMode = createElement('button', textChatModeStyle, {
    innerText: 'Switch to Text',
  });
  textChatMode.onclick = () => {
    const poweredByContainer = document.querySelector('#powered-by-container');
    if (poweredByContainer) {
      poweredByContainer.style.opacity = '1';
    }
    exitVoiceChat();
    startCustomerAssistantTextMode();
  };
  // appendChild(container, textChatMode);

  const controlsContainer = createElement('div', controlsContainerStyle, {});
  appendChild(container, controlsContainer);

  if (getRealtimeClient().micStream.getAudioTracks().length === 0) {
    console.error('Interworky Error: No audio tracks found in mic stream');
    return;
  }
  createMuteButton(controlsContainer);
  createPoweredByContent(controlsContainer);
  createExitButton(controlsContainer);
}
