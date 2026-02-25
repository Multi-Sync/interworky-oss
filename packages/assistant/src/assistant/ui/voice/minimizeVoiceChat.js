import { muteIconSVG, svgCloseIcon, svgMicIcon } from '../../../styles/icons';
import {
  assistantImagestyle,
  minimizedContainerStyle,
  minimizedInfoTextStyle,
  muteButtonStyles,
  statusContainerstyle,
} from '../../../styles/styles';
import { setVisualizerBackground } from '../../../styles/themeManager';
import { getAssistantInfo, getVoiceChatContainer } from '../../utils/state';
import {
  getCurrentMode,
  getIsMinimized,
  getIsMuted,
  setIsMinimized,
} from '../../utils/voice-state';
import { appendChild, createElement } from '../baseMethods';
import { closeChatButtonClickHandler } from '../handlers/closeChatButtonClickHandler';
import { addWaveformAnimations } from './addWaveformAnimations';
import { toggleMuteUI } from './toggleMuteUI';
import { updateMinimizedStatus } from './updateMinimizedStatus';
import ariaUtils from '../../../utils/aria';

export function minimizeVoiceChat() {
  setIsMinimized(true);
  const oldFullScreen = document.getElementById('full-screen-voice-chat');
  if (oldFullScreen) oldFullScreen.remove();
  const container = getVoiceChatContainer();
  if (container) container.style.display = 'none';
  const chatPopupClosedViewButton = document.getElementById(
    'interworky-customer-assistant-popup'
  );
  chatPopupClosedViewButton.style.display = 'none';
  const isSmallScreen = window.innerWidth <= 480;
  const responsiveContainerStyle = {
    ...minimizedContainerStyle,
    width: isSmallScreen ? 'calc(100% - 40px)' : '430px',
    left: isSmallScreen ? '20px' : 'auto',
    padding: isSmallScreen ? '0 15px' : '0 20px',
    height: isSmallScreen ? '70px' : '80px',
  };

  const minimizedContainer = createElement('div', responsiveContainerStyle, {
    id: 'minimized-voice-chat',
  });

  // Add ARIA attributes for minimized container
  ariaUtils.setAttributes(minimizedContainer, {
    role: 'application',
    'aria-label': 'Minimized Voice Assistant',
  });

  // Microphone button
  const micButton = createElement(
    'div',
    {
      ...muteButtonStyles,
      marginRight: isSmallScreen ? '5px' : '10px',
      backgroundColor: 'white',
    },
    {
      id: 'minimized-mic-button',
    }
  );

  // Update mic button based on mute state
  const isMuted = getIsMuted();
  if (isMuted) {
    micButton.innerHTML = muteIconSVG;
    micButton.style.color = '#666';
  } else {
    micButton.innerHTML = svgMicIcon;
    micButton.style.color = '#333';
  }

  // Add ARIA attributes for mic button
  ariaUtils.setAttributes(micButton, {
    role: 'button',
    'aria-label': isMuted ? 'Unmute microphone' : 'Mute microphone',
    'aria-pressed': isMuted.toString(),
    tabindex: '0',
  });

  // Use unified toggle function
  micButton.onclick = toggleMuteUI;

  // Add keyboard support
  micButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMuteUI();
    }
  });

  // Assistant image
  const assistantImage = createElement('div', {
    ...assistantImagestyle,
    width: isSmallScreen ? '40px' : '50px',
    height: isSmallScreen ? '40px' : '50px',
    minWidth: isSmallScreen ? '40px' : '50px',
    minHeight: isSmallScreen ? '40px' : '50px',
  });

  setVisualizerBackground(
    getAssistantInfo().assistant_image_url,
    assistantImage
  );

  // Name and status container
  const responsiveInfoStyle = {
    ...minimizedInfoTextStyle,
    gap: isSmallScreen ? '5px' : '10px',
  };

  const infoContainer = createElement('div', responsiveInfoStyle);

  const assistantName = createElement(
    'div',
    {
      fontSize: '18px',
      fontWeight: 'bold',
    },
    {
      innerText: getAssistantInfo().assistant_name || 'Carla',
    }
  );

  // Status with waveform
  const responsiveStatusStyle = {
    ...statusContainerstyle,
    padding: isSmallScreen ? '4px 10px' : '5px 15px',
    fontSize: isSmallScreen ? '12px' : '14px',
  };
  const statusContainer = createElement('div', responsiveStatusStyle);

  const statusText = createElement(
    'span',
    {
      marginRight: isSmallScreen ? '5px' : '10px',
    },
    {
      innerText: 'Speaking',
      id: 'minimized-status-text',
    }
  );

  // Mini waveform visualization (decorative, hide from screen readers and AI agents)
  const miniWaveform = createElement('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  });
  miniWaveform.setAttribute('aria-hidden', 'true');

  // Create animated bars for waveform
  const barCount = isSmallScreen ? 5 : 8;
  for (let i = 0; i < barCount; i++) {
    const bar = createElement(
      'div',
      {
        width: isSmallScreen ? '2px' : '3px',
        height: isSmallScreen ? '10px' : '12px',
        backgroundColor: '#20B2AA',
        borderRadius: '2px',
        animationDelay: `${i * 0.1}s`,
      },
      {
        id: `waveform-bar-${i}`,
      }
    );
    appendChild(miniWaveform, bar);
  }

  appendChild(statusContainer, statusText);
  appendChild(statusContainer, miniWaveform);
  appendChild(infoContainer, assistantName);
  appendChild(infoContainer, statusContainer);

  const xButton = createElement('div', {
    ...muteButtonStyles,
    marginLeft: '15px',
    backgroundColor: 'white',
  });
  xButton.innerHTML = svgCloseIcon;

  // Add ARIA attributes for close button
  ariaUtils.setAttributes(xButton, {
    role: 'button',
    'aria-label': 'Close voice assistant',
    tabindex: '0',
  });

  xButton.onclick = () => {
    closeChatButtonClickHandler();
  };

  // Add keyboard support
  xButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeChatButtonClickHandler();
    }
  });

  appendChild(minimizedContainer, micButton);
  appendChild(minimizedContainer, assistantImage);
  appendChild(minimizedContainer, infoContainer);
  appendChild(minimizedContainer, xButton);

  // Append to body instead of container
  document.body.appendChild(minimizedContainer);

  addWaveformAnimations();

  // Update status based on current mode
  updateMinimizedStatus(getCurrentMode());

  // Add resize listener to handle screen size changes
  const handleResize = () => {
    const currentContainer = document.getElementById('minimized-voice-chat');
    if (currentContainer && getIsMinimized()) {
      // Re-create the minimized chat with updated responsive settings
      currentContainer.remove();
      minimizeVoiceChat();
    }
  };
  if (window.minimizedChatResizeHandler) {
    window.removeEventListener('resize', window.minimizedChatResizeHandler);
  }

  window.minimizedChatResizeHandler = handleResize;
  window.addEventListener('resize', handleResize);
}
