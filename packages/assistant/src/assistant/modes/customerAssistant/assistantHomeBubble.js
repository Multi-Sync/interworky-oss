import {
  bubbleContainerStyle,
  bubbleStyle,
  teaserStatmentTitleStyle,
  iconsRowContainerStyle,
  iconLabelStyle,
  iconContainerStyle,
  badgeIconStyle,
  badgeTextStyle,
  badgeVoiceIconStyle,
  onlineIndicatorStyle,
  onlineDotStyle,
  responseTimeBadgeStyle,
  rotatingMessageStyle,
} from '../../../styles/styles';
import { createElement } from '../../ui/baseMethods';
import {
  getAssistantInfo,
  setAssistantInfo,
  setIsHomeBubbleVisible,
} from '../../utils/state';
import { createVoiceButton } from '../../ui/templates/voiceButton';
import { textIconSVG, minimizeIconSVG } from '../../../styles/icons';
import { startGenAICustomerAssistantVoice } from './voiceCustomerAssistant';
import { getClosedViewStyleByType } from '../../../utils/common';

/**
 * Converts the closed view button to badge view
 * @param {HTMLElement} closedViewButton - The closed view button element
 * @param {Function} openChatContainer - Function to open chat
 */
function convertToBadgeView(closedViewButton, openChatContainer) {
  if (!closedViewButton) return;

  // Clear existing content and background
  closedViewButton.innerHTML = '';
  closedViewButton.style.backgroundImage = '';
  closedViewButton.style.backgroundSize = '';
  closedViewButton.style.backgroundPosition = '';

  // Apply badge view styles
  const badgeViewStyle = getClosedViewStyleByType('badge');
  Object.assign(closedViewButton.style, badgeViewStyle);

  // Create chat icon
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

  // Create text
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

  // Append in order: chat icon, text
  closedViewButton.appendChild(badgeIcon);
  closedViewButton.appendChild(badgeText);

  // Create voice icon if enabled
  const voiceModeEnabled = getAssistantInfo().voice_enabled ?? true;
  if (voiceModeEnabled) {
    const badgeVoiceIcon = createElement('div', badgeVoiceIconStyle, {}, false);
    badgeVoiceIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" x2="12" y1="19" y2="22"></line>
      </svg>
    `;
    badgeVoiceIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      startGenAICustomerAssistantVoice();
    });
    badgeVoiceIcon.addEventListener('mouseenter', () => {
      badgeVoiceIcon.style.transform = 'scale(1.1)';
    });
    badgeVoiceIcon.addEventListener('mouseleave', () => {
      badgeVoiceIcon.style.transform = 'scale(1)';
    });

    closedViewButton.appendChild(badgeVoiceIcon);
  }

  // Add hover effects
  closedViewButton.addEventListener('mouseenter', () => {
    closedViewButton.style.width = '55px';
    closedViewButton.style.boxShadow = '-4px 0 15px rgba(0, 0, 0, 0.3)';
  });
  closedViewButton.addEventListener('mouseleave', () => {
    closedViewButton.style.width = '50px';
    closedViewButton.style.boxShadow = '-2px 0 10px rgba(0, 0, 0, 0.2)';
  });
}

// Default rotating messages for engagement
const defaultRotatingMessages = [
  'Hi! Need help with anything?',
  'Have a question? Ask me!',
  'I can help you get started',
  'Looking for something specific?',
];

export function createAssistantHomeBubble(openChatContainer, closedViewButton) {
  const bubbleContainer = createElement('div', bubbleContainerStyle);
  let messageRotationInterval = null;

  const updateBubblePosition = () => {
    if (!closedViewButton) return;
    const buttonRect = closedViewButton.getBoundingClientRect();
    const bubbleWidth = bubbleContainer.offsetWidth || 250; // fallback width
    bubbleContainer.style.left = `${buttonRect.left - bubbleWidth}px`;
  };

  window.addEventListener('resize', updateBubblePosition);
  setTimeout(updateBubblePosition, 100); // after DOM is ready

  const bubble = createElement('div', bubbleStyle);

  // Override conflicting styles from bubbleStyle
  bubble.style.position = 'relative';
  bubble.style.top = 'auto';
  bubble.style.right = 'auto';

  // Check view type - only create minimize button if NOT in badge view
  const assistantInfo = getAssistantInfo();
  const viewType = assistantInfo?.view_type || 'normal';
  const isBadgeView = viewType === 'badge';

  // Create minimize button positioned above the closed view button (agent picture)
  // Only create if not in badge view
  let minimizeButton = null;

  if (!isBadgeView) {
    minimizeButton = createElement('button', {
      position: 'fixed',
      width: '40px',
      height: '40px',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(10px) saturate(150%) brightness(120%)',
      WebkitBackdropFilter: 'blur(10px) saturate(150%) brightness(120%)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      zIndex: '999999',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    });
    minimizeButton.innerHTML = minimizeIconSVG;
    minimizeButton.id = 'interworky-minimize-button';

    // Position minimize button above the closed view button dynamically
    const positionMinimizeButton = () => {
      if (!closedViewButton) return;
      const buttonRect = closedViewButton.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Position 10px above the closed view button
      const bottomPosition = windowHeight - buttonRect.top + 10;
      minimizeButton.style.bottom = `${bottomPosition}px`;

      // Align horizontally with the closed view button center
      const buttonCenter = buttonRect.left + buttonRect.width / 2;
      const minimizeButtonWidth = 40;
      minimizeButton.style.left = `${buttonCenter - minimizeButtonWidth / 2}px`;
    };

    // Position on load and window resize
    setTimeout(positionMinimizeButton, 100);
    window.addEventListener('resize', positionMinimizeButton);

    // Style the SVG inside the minimize button
    const minimizeSvg = minimizeButton.querySelector('svg');
    if (minimizeSvg) {
      minimizeSvg.style.width = '20px';
      minimizeSvg.style.height = '20px';
      minimizeSvg.style.display = 'block';
      minimizeSvg.setAttribute('stroke', '#ffffff');
      minimizeSvg.setAttribute('fill', 'none');
    }

    // Add hover effect for minimize button
    minimizeButton.addEventListener('mouseenter', () => {
      minimizeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
      minimizeButton.style.transform = 'scale(1.1)';
      minimizeButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
    });

    minimizeButton.addEventListener('mouseleave', () => {
      minimizeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
      minimizeButton.style.transform = 'scale(1)';
      minimizeButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    // Minimize button click handler
    minimizeButton.addEventListener('click', (e) => {
      e.stopPropagation();

      // 1. Update view type to badge
      const assistantInfo = getAssistantInfo();
      setAssistantInfo({
        ...assistantInfo,
        view_type: 'badge',
      });

      // 2. Immediately remove minimize button from DOM by ID
      const minimizeBtn = document.getElementById('interworky-minimize-button');
      if (minimizeBtn && minimizeBtn.parentNode) {
        minimizeBtn.parentNode.removeChild(minimizeBtn);
      }

      // 3. Remove bubble from DOM
      if (bubbleContainer && bubbleContainer.parentNode) {
        bubbleContainer.parentNode.removeChild(bubbleContainer);
      }

      // 4. Update visibility state
      setIsHomeBubbleVisible(false);

      // 5. Show the new badge view
      const chatPopupClosedViewButton = document.getElementById(
        'interworky-customer-assistant-popup'
      );
      if (chatPopupClosedViewButton) {
        // Convert to badge view (re-render with badge elements)
        convertToBadgeView(chatPopupClosedViewButton, openChatContainer);
        // Show the badge button
        chatPopupClosedViewButton.style.display = 'flex';
      }
    });
  }

  const content = document.createElement('div');
  content.style.flex = '1';

  // Create online indicator (social proof)
  const onlineIndicator = createElement('div', onlineIndicatorStyle);
  const onlineDot = createElement('span', onlineDotStyle);
  const onlineText = document.createElement('span');
  onlineText.textContent = 'Online now';
  onlineIndicator.appendChild(onlineDot);
  onlineIndicator.appendChild(onlineText);

  // Create rotating message container
  const teaserStatmentTitle = createElement('p', {
    ...teaserStatmentTitleStyle,
    ...rotatingMessageStyle,
  });
  const openingStatement = getAssistantInfo().opening_statement;
  const customMessages = openingStatement ? [openingStatement.trim()] : null;
  const messages = customMessages || defaultRotatingMessages;
  let currentMessageIndex = 0;

  // Set initial message
  teaserStatmentTitle.textContent = messages[0];
  teaserStatmentTitle.style.animation = 'fadeRotate 4s ease-in-out infinite';

  // Only rotate if we have multiple messages
  if (messages.length > 1) {
    messageRotationInterval = setInterval(() => {
      currentMessageIndex = (currentMessageIndex + 1) % messages.length;
      teaserStatmentTitle.style.animation = 'none';
      // Force reflow
      void teaserStatmentTitle.offsetWidth;
      teaserStatmentTitle.textContent = messages[currentMessageIndex];
      teaserStatmentTitle.style.animation = 'fadeRotate 4s ease-in-out infinite';
    }, 4000);
  }

  // Create response time badge (social proof)
  const responseTimeBadge = createElement('div', responseTimeBadgeStyle);
  const clockIcon = document.createElement('span');
  clockIcon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>`;
  clockIcon.style.display = 'flex';
  clockIcon.style.alignItems = 'center';
  const responseText = document.createElement('span');
  responseText.textContent = 'Usually responds instantly';
  responseTimeBadge.appendChild(clockIcon);
  responseTimeBadge.appendChild(responseText);

  const iconsContainer = createElement('div', iconsRowContainerStyle);

  const textButton = createElement('button', {
    display: 'block',
    width: '24px',
    height: '24px',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '0',
  });
  textButton.innerHTML = textIconSVG;

  // Helper function for hover effects
  const addHoverEffect = (el) => {
    const applyOn = () => {
      el.style.transform = 'scale(1.05)';
      el.style.transition = 'all 0.2s ease';
      el.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
      el.style.borderRadius = '8px';
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    };
    const applyOff = () => {
      el.style.transform = 'scale(1)';
      el.style.backgroundColor = 'transparent';
      el.style.boxShadow = 'none';
    };

    el.addEventListener('mouseenter', applyOn);
    el.addEventListener('mouseleave', applyOff);

    // unified mouse/touch in modern browsers
    el.addEventListener('pointerenter', applyOn);
    el.addEventListener('pointerleave', applyOff);

    // Touch-only fallback
    el.addEventListener('touchstart', applyOn);
    el.addEventListener('touchend', applyOff);
    el.addEventListener('touchcancel', applyOff);
  };

  const textButtonContainer = createElement('div', iconContainerStyle);
  textButtonContainer.addEventListener('click', () => {
    bubbleContainer.style.display = 'none';
    openChatContainer();
  });

  addHoverEffect(textButtonContainer);

  const textLabel = createElement('span', iconLabelStyle);
  textLabel.textContent = 'Text';

  textButtonContainer.appendChild(textButton);
  textButtonContainer.appendChild(textLabel);

  const voiceButton = createVoiceButton();

  const voiceModeEnabled = getAssistantInfo().voice_enabled ?? true;
  if (!voiceModeEnabled) {
    voiceButton.disabled = true;
    voiceButton.style.opacity = '0.5';
    voiceButton.style.cursor = 'not-allowed';
  }

  const voiceButtonContainer = createElement('div', iconContainerStyle);

  const voiceLabel = createElement('span', iconLabelStyle);
  voiceLabel.textContent = 'Voice';

  if (voiceModeEnabled) {
    voiceButtonContainer.addEventListener('click', () => {
      bubbleContainer.style.display = 'none';
      startGenAICustomerAssistantVoice();
    });

    addHoverEffect(voiceButtonContainer);
  } else {
    voiceLabel.style.opacity = '0.5';
    voiceLabel.style.cursor = 'not-allowed';
  }

  voiceButtonContainer.appendChild(voiceButton);
  voiceButtonContainer.appendChild(voiceLabel);

  iconsContainer.appendChild(textButtonContainer);
  iconsContainer.appendChild(voiceButtonContainer);

  bubble.addEventListener('mouseenter', () => {
    bubble.style.transform = 'scale(1.02)';
    bubble.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.25)';
  });

  bubble.addEventListener('mouseleave', () => {
    bubble.style.transform = 'scale(1)';
    bubble.style.boxShadow = '0 4px 15px rgba(94, 122, 104, 0.2)';
  });

  content.appendChild(onlineIndicator);
  content.appendChild(teaserStatmentTitle);
  content.appendChild(responseTimeBadge);
  content.appendChild(iconsContainer);
  bubble.appendChild(content);
  bubbleContainer.appendChild(bubble);

  // Cleanup function for interval
  bubbleContainer.cleanup = () => {
    if (messageRotationInterval) {
      clearInterval(messageRotationInterval);
      messageRotationInterval = null;
    }
  };

  // Append minimize button to body (separate from bubble) - only if it was created
  if (minimizeButton) {
    document.body.appendChild(minimizeButton);
  }

  if (!teaserStatmentTitle.textContent) {
    bubbleContainer.style.display = 'none';
    if (minimizeButton) {
      minimizeButton.style.display = 'none';
    }
  }

  return {
    bubbleContainer,
    minimizeButton,
  };
}
