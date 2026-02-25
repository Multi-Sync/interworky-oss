//src/assistant/modes/customerAssistant/index.js
import {
  assistantContainerStyle,
  chatContainerStyle,
  fullScreenContainerStyles,
  globalScrollbarStyle,
  notificationBadgeStyle,
  overlayStyle,
  badgeIconStyle,
  badgeTextStyle,
  badgeVoiceIconStyle,
} from '../../../styles/styles';
import { appendChild, createElement } from '../../ui/baseMethods';
import ariaUtils from '../../../utils/aria';
import { injectAccessibilityStyles } from '../../../styles/accessibilityStyles';
import {
  addHomeBubbleVisibilityListener,
  getAssistantInfo,
  getIsChatActive,
  getIsHomeBubbleVisible,
  getScriptTags,
  setChatPopUpClosedView,
  setIsChatActive,
  setIsHomeBubbleVisible,
} from '../../utils/state';

import { setChatClosedViewBackground } from '../../../styles/themeManager';
import { getClosedViewStyleByType } from '../../../utils/common';
import { createInterworkyBrandedTextChatCloseMenu } from '../../ui/templates/branding';
import { createChatHeader } from '../../ui/templates/chatHeader';
import { createChatInput } from '../../ui/templates/chatInput';
import { createAssistantHomeBubble } from './assistantHomeBubble';
import { startCustomerAssistantTextMode } from './textCustomerAssistant';
export let firstMessageAlreadyShown = false;

export const setFirstMessageAlreadyShown = (value) => {
  firstMessageAlreadyShown = value;
};

let chatPopupClosedViewButton;
let notification;
let assistantContainer;
let chatContainer;
let chatBox;
let homeBubbleInstance;
let minimizeButtonInstance;

function renderHomeBubble() {
  // Remove any existing bubble and minimize button
  if (homeBubbleInstance && homeBubbleInstance.parentNode) {
    homeBubbleInstance.parentNode.removeChild(homeBubbleInstance);
    homeBubbleInstance = null;
  }
  if (minimizeButtonInstance && minimizeButtonInstance.parentNode) {
    minimizeButtonInstance.parentNode.removeChild(minimizeButtonInstance);
    minimizeButtonInstance = null;
  }
  if (getIsHomeBubbleVisible()) {
    const { bubbleContainer, minimizeButton } = createAssistantHomeBubble(
      openChatContainer,
      chatPopupClosedViewButton
    );
    homeBubbleInstance = bubbleContainer;
    minimizeButtonInstance = minimizeButton;
    document.body.appendChild(homeBubbleInstance);
  }
}

addHomeBubbleVisibilityListener(renderHomeBubble);

export function openChatContainer() {
  setIsChatActive(true);
  setIsHomeBubbleVisible(false);
  const header = createChatHeader(chatPopupClosedViewButton);
  const input = createChatInput();

  appendChild(assistantContainer, header);
  appendChild(assistantContainer, chatContainer);
  appendChild(assistantContainer, input);

  updateAssistantContainerSize();
  const closeChatBrandedUI = createInterworkyBrandedTextChatCloseMenu(
    chatPopupClosedViewButton
  );
  setChatPopUpClosedView(closeChatBrandedUI);
  chatPopupClosedViewButton.style.display = 'none';
  notification.style.display = 'none';
  assistantContainer.style.opacity = '1';

  // Clean up the bubble
  if (chatBox && chatBox.cleanup) {
    chatBox.cleanup();
  }
  if (chatBox && chatBox.parentNode) {
    chatBox.parentNode.removeChild(chatBox);
  }

  document.body.appendChild(closeChatBrandedUI);

  startCustomerAssistantTextMode();
}

export const startCustomerAssistantMode = async () => {
  // Inject accessibility styles for screen readers and AI agents
  injectAccessibilityStyles();

  // const usage = await getOrganizationUsage();
  // const limitReached = usage.limitReached;

  // Get view type from backend (assistant info) with fallback to script tags
  const viewType =
    getAssistantInfo().view_type || getScriptTags().viewType || 'normal';
  const isBadgeView = viewType === 'badge';
  const isNormalView = viewType === 'normal';

  // Get the appropriate style based on view type
  const closedViewStyle = getClosedViewStyleByType(viewType);

  chatPopupClosedViewButton = createElement('div', closedViewStyle, {}, false);
  chatPopupClosedViewButton.id = 'interworky-customer-assistant-popup';

  const overlay = createElement('div', overlayStyle, {});
  document.body.appendChild(overlay);

  notification = createElement('div', notificationBadgeStyle, {
    textContent: '1',
  });

  // Only add notification badge for normal view
  if (isNormalView) {
    chatPopupClosedViewButton.appendChild(notification);
  }

  const { bubbleContainer: chatBoxInstance } = createAssistantHomeBubble(
    openChatContainer,
    chatPopupClosedViewButton
  );
  chatBox = chatBoxInstance;
  // if (!limitReached) {
  // Don't show home bubble for badge view
  if (!isBadgeView) {
    setIsHomeBubbleVisible(true);
  }
  // }

  chatContainer = createElement(
    'div',
    { ...globalScrollbarStyle, ...chatContainerStyle },
    {
      id: 'chat-container',
    }
  );
  // Add ARIA attributes to chat container for accessibility and AI agent compatibility
  ariaUtils.setAttributes(chatContainer, {
    role: 'log',
    'aria-live': 'polite',
    'aria-atomic': 'false',
    'aria-relevant': 'additions',
    'aria-label': 'Conversation messages',
  });

  assistantContainer = createElement('div', assistantContainerStyle, {
    id: 'assistant-container',
  });
  // Add ARIA attributes to assistant container
  ariaUtils.setAttributes(assistantContainer, {
    role: 'region',
    'aria-label': 'Interworky AI Assistant',
    'aria-describedby': 'interworky-description',
  });

  // Add hidden description for screen readers and AI agents
  const description = document.createElement('span');
  description.id = 'interworky-description';
  description.className = 'sr-only';
  description.textContent =
    'AI-powered chat assistant. Ask questions, get help, and interact with the website.';
  assistantContainer.appendChild(description);

  // Set background image for normal view only
  if (isNormalView) {
    setChatClosedViewBackground(
      getAssistantInfo().assistant_image_url,
      chatPopupClosedViewButton
    );
  }

  // For badge view, add icon and text
  if (isBadgeView) {
    // Create text chat icon with click handler
    const badgeIcon = createElement('div', badgeIconStyle, {}, false);
    badgeIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    badgeIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      openChatContainer();
    });
    badgeIcon.addEventListener('mouseenter', () => {
      badgeIcon.style.transform = 'scale(1.1)';
    });
    badgeIcon.addEventListener('mouseleave', () => {
      badgeIcon.style.transform = 'scale(1)';
    });

    // Create text (don't mark for removal)
    const badgeText = createElement(
      'div',
      badgeTextStyle,
      {
        textContent: 'Chat',
      },
      false
    );
    badgeText.addEventListener('click', (e) => {
      e.stopPropagation();
      openChatContainer();
    });

    // Append in order: chat icon, text, voice icon
    chatPopupClosedViewButton.appendChild(badgeIcon);
    chatPopupClosedViewButton.appendChild(badgeText);

    // Create voice icon with click handler
    const voiceModeEnabled = getAssistantInfo().voice_enabled ?? true;
    if (voiceModeEnabled) {
      const badgeVoiceIcon = createElement(
        'div',
        badgeVoiceIconStyle,
        {},
        false
      );
      badgeVoiceIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" x2="12" y1="19" y2="22"></line>
        </svg>
      `;
      badgeVoiceIcon.addEventListener('click', async (e) => {
        e.stopPropagation();
        const { startGenAICustomerAssistantVoice } = await import(
          './voiceCustomerAssistant'
        );
        startGenAICustomerAssistantVoice();
      });
      badgeVoiceIcon.addEventListener('mouseenter', () => {
        badgeVoiceIcon.style.transform = 'scale(1.1)';
      });
      badgeVoiceIcon.addEventListener('mouseleave', () => {
        badgeVoiceIcon.style.transform = 'scale(1)';
      });

      chatPopupClosedViewButton.appendChild(badgeVoiceIcon);
    }

    // Add hover effect
    chatPopupClosedViewButton.addEventListener('mouseenter', () => {
      chatPopupClosedViewButton.style.width = '55px';
      chatPopupClosedViewButton.style.boxShadow =
        '-4px 0 15px rgba(0, 0, 0, 0.3)';
    });
    chatPopupClosedViewButton.addEventListener('mouseleave', () => {
      chatPopupClosedViewButton.style.width = '50px';
      chatPopupClosedViewButton.style.boxShadow =
        '-2px 0 10px rgba(0, 0, 0, 0.2)';
    });
  }

  document.body.appendChild(assistantContainer);

  window.addEventListener('resize', updateAssistantContainerSize);
  updateAssistantContainerSize();

  // if (limitReached) {
  // chatPopupClosedViewButton.style.opacity = '.6';
  // chatPopupClosedViewButton.style.cursor = 'not-allowed';
  // chatPopupClosedViewButton.style.pointerEvents = 'none';
  // }

  chatPopupClosedViewButton.addEventListener('click', (e) => {
    // if (limitReached) {
    //   return;
    // }
    if (e.target !== chatPopupClosedViewButton) return;
    // if (limitReached) return;
    openChatContainer();
  });

  // Add enhanced hover effects for normal view
  if (isNormalView) {
    chatPopupClosedViewButton.addEventListener('mouseenter', () => {
      chatPopupClosedViewButton.style.transform = 'scale(1.1)';
      chatPopupClosedViewButton.style.boxShadow =
        '0px 8px 30px rgba(0, 0, 0, 0.4), 0 0 25px 10px rgba(5, 138, 124, 0.35)';
    });
    chatPopupClosedViewButton.addEventListener('mouseleave', () => {
      chatPopupClosedViewButton.style.transform = 'scale(1)';
      // Let the glowPulse animation take over again
      chatPopupClosedViewButton.style.boxShadow = '';
    });
  }

  document.body.appendChild(chatPopupClosedViewButton);
  const dimScreen = getAssistantInfo().dim_screen;
  if (dimScreen) {
    overlay.style.display = 'block';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 2000);
  }
};

const updateAssistantContainerSize = () => {
  const assistantContainer = document.getElementById('assistant-container');

  if (!assistantContainer) return;

  const chatIsActive = getIsChatActive();
  if (chatIsActive) {
    if (window.innerWidth <= 480) {
      // For mobile screens: Center and full width
      assistantContainer.style.width = '100%';
      assistantContainer.style.right = '0';
      assistantContainer.style.left = '0';
      assistantContainer.style.top = '0';
      assistantContainer.style.height = '100%';
      assistantContainer.style.borderRadius = '0';
      assistantContainer.style.transform = 'none'; // No need for centering when full width
      fullScreenContainerStyles.width = '100%';
    } else {
      // For larger screens
      assistantContainer.style.width = '367px';
      assistantContainer.style.height = 'calc(100dvh - 200px)';
      assistantContainer.style.right = '20px';
      assistantContainer.style.top = '80px';
      assistantContainer.style.borderRadius = '10px';
      assistantContainer.style.left = 'auto'; // Reset left
      assistantContainer.style.transform = 'none'; // Reset transform
    }
  }
};
