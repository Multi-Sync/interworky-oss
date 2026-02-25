import {
  assistantIconStyle,
  assistantIdentityStyle,
  assistantInfoStyle,
  assistantNameStyle,
  headerButtonStyle,
  headerStyle,
  liveIndicatorStyle,
  xButtonStyle,
} from '../../../styles/styles';
import { appendChild, createElement } from '../baseMethods';

import { svgCloseIcon } from '../../../styles/icons';
import {
  detectDarkTheme,
  setAssistantIcon,
} from '../../../styles/themeManager';
import { getAssistantInfo } from '../../utils/state';
import { closeChatButtonClickHandler } from '../handlers/closeChatButtonClickHandler';
import { headerOptionsMenu } from './headerOptionsMenu';
import ariaUtils from '../../../utils/aria';

const isDarkTheme = detectDarkTheme();
export const createChatHeader = (chatPopupClosedViewButton) => {
  const header = createElement('div', headerStyle, { id: 'assistant-header' });

  // Add ARIA role for header banner
  ariaUtils.setAttributes(header, {
    role: 'banner',
    'aria-label': 'Chat header',
  });

  const assistantIdentityContainer = createElement(
    'div',
    assistantIdentityStyle
  );

  const assistantName = createElement('p', assistantNameStyle, {
    innerText: getAssistantInfo().assistant_name,
    id: 'assistant-name',
  });
  assistantName.style.setProperty(
    'color',
    isDarkTheme ? '#000' : '#fff',
    'important'
  );

  const assistantInfo = createElement('div', assistantInfoStyle);

  const assistantIcon = createElement('div', assistantIconStyle, {});

  setAssistantIcon(getAssistantInfo().assistant_image_url, assistantIcon);

  const liveIndicator = createElement('span', liveIndicatorStyle, {});

  const optionsMenu = headerOptionsMenu();

  const headerButtonsContainer = createElement('div', headerButtonStyle);

  const mobileXButton = createElement('div', {
    ...xButtonStyle,
    position: 'relative',
    left: 'auto',
    top: 'auto',
    transform: 'none',
  });

  mobileXButton.innerHTML = svgCloseIcon;

  // Add ARIA attributes for close button
  ariaUtils.setAttributes(mobileXButton, {
    role: 'button',
    'aria-label': 'Close chat',
    tabindex: '0',
  });

  mobileXButton.addEventListener('click', (e) =>
    closeChatButtonClickHandler(e, chatPopupClosedViewButton)
  );

  // Add keyboard support for close button
  mobileXButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeChatButtonClickHandler(e, chatPopupClosedViewButton);
    }
  });

  const handleResponsiveDisplay = () => {
    if (window.innerWidth <= 480) {
      mobileXButton.style.display = 'flex';
    } else {
      mobileXButton.style.display = 'none';
    }
  };

  handleResponsiveDisplay();
  window.addEventListener('resize', handleResponsiveDisplay);

  appendChild(assistantIdentityContainer, liveIndicator);
  appendChild(assistantIdentityContainer, assistantIcon);
  appendChild(assistantInfo, assistantName);
  appendChild(assistantIdentityContainer, assistantInfo);
  appendChild(header, assistantIdentityContainer);
  appendChild(headerButtonsContainer, optionsMenu);
  appendChild(headerButtonsContainer, mobileXButton);
  appendChild(header, headerButtonsContainer);

  return header;
};
