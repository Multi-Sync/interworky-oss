import { startCustomerAssistantTextMode } from '../../modes/customerAssistant/textCustomerAssistant';
import { createExitButton } from './createExitButton';
import { createMuteButton } from './createMuteButton';
import { createPoweredByContent } from './createPoweredByContent';
import { getRealtimeClient } from '../../utils/voice-state';
import { appendChild, createElement } from '../baseMethods';
import { setVisualizerBackground } from '../../../styles/themeManager';
import { getAssistantInfo, getIsVoiceChatActive } from '../../utils/state';
import { createAudioVisualizer } from '../components/audioVisualizer';
import { exitVoiceChat } from './exitVoiceChat';
import { createVisualizer } from '../templates/visualizer';
import {
  controlsContainerStyle,
  indicatorsStyle,
  statusIndicatorStyle,
  textChatModeStyle,
} from '../../../styles/styles';
import { UserSpeakingSVG } from '../../../styles/icons';

export function renderListeningMode(container) {
  if (!getIsVoiceChatActive()) {
    return;
  }
  const visualizerWrapper = createVisualizer(false);
  visualizerWrapper.style.textAlign = 'center';
  appendChild(container, visualizerWrapper);
  if (!getRealtimeClient() || !getRealtimeClient().micStream) {
    console.error('Interworky client or mic stream is not available');
    return;
  }

  const indicators = createElement('div', indicatorsStyle, {
    id: 'indicators',
  });

  const user = createElement('div', { width: '48px', height: '48px' }, {});
  user.id = 'user';
  user.innerHTML = UserSpeakingSVG;
  appendChild(indicators, user);

  // Create shared audio visualizer that will be maintained across modes
  if (
    !window.sharedAudioVisualizer &&
    getRealtimeClient().audioCtx &&
    getRealtimeClient().micStream
  ) {
    window.sharedAudioVisualizer = createAudioVisualizer(
      getRealtimeClient().audioCtx,
      getRealtimeClient().micStream
    );
  }

  const initializeVisualizer = () => {
    if (window.sharedAudioVisualizer && !indicators.querySelector('canvas')) {
      appendChild(indicators, window.sharedAudioVisualizer.element);
      window.sharedAudioVisualizer.start();
    }
  };

  // Try to initialize immediately
  initializeVisualizer();

  // Retry initialization after a short delay if not ready
  if (!window.sharedAudioVisualizer || !indicators.querySelector('canvas')) {
    setTimeout(() => {
      initializeVisualizer();
    }, 1000);
  }

  const assistant = createElement(
    'div',
    { opacity: '0.5', width: '48px', height: '48px', borderRadius: '50%' },
    {}
  );

  assistant.id = 'assistant';

  setVisualizerBackground(getAssistantInfo().assistant_image_url, assistant);
  appendChild(indicators, assistant);

  appendChild(container, indicators);

  // status indicator
  const statusIndicator = createElement('div', statusIndicatorStyle, {
    innerText: 'Agent Listening',
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
