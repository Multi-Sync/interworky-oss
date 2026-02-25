import { svgCloseIcon } from '../../../styles/icons';
import {
  chatPopupOpenViewStyle,
  poweredByContainerStyle,
  poweredByInterworkyLogoStyle,
  poweredByTextStyle,
  xButtonStyle,
} from '../../../styles/styles';
import { getAssistantInfo, setChatPopUpOpenView } from '../../utils/state';
import { appendChild, createElement } from '../baseMethods';
import { closeChatButtonClickHandler } from '../handlers/closeChatButtonClickHandler';

const isMobileScreen = () => window.innerWidth <= 480;

const createPoweredByContent = (container) => {
  const poweredByText = createElement('span', poweredByTextStyle, {
    innerText: 'Powered by ',
  });

  const interworkyLogo = createElement(
    'img',
    { ...poweredByInterworkyLogoStyle },
    {
      src: 'https://storage.googleapis.com/multisync/interworky/interworky-assistant-ui/interworky.png',
      alt: 'Interworky Logo',
    }
  );

  interworkyLogo.addEventListener('click', () => {
    window.open('https://interworky.com', '_blank');
  });

  appendChild(container, poweredByText);
  appendChild(container, interworkyLogo);
};

const createPoweredByContainer = (isPremium) => {
  const container = createElement('div', {
    ...poweredByContainerStyle,
  });

  if (!isPremium) {
    createPoweredByContent(container);
  }

  return container;
};

export const createBranding = () => {
  const isPremium = getAssistantInfo().premium;

  if (!isPremium) {
    const poweredByContainer = createPoweredByContainer(isPremium);

    const handleScreenSizeChange = () => {
      poweredByContainer.style.display = isMobileScreen() ? 'flex' : 'none';
    };

    handleScreenSizeChange();
    window.addEventListener('resize', handleScreenSizeChange);

    return poweredByContainer;
  }

  return null;
};

export function createInterworkyBrandedTextChatCloseMenu(
  chatPopupClosedViewButton
) {
  const isPremium = getAssistantInfo().premium;

  // Open view with "X" button and text
  const chatPopupOpenViewContainer = createElement(
    'div',
    {
      ...chatPopupOpenViewStyle,
      width: isPremium ? '55px' : '250px',
      height: isPremium ? '55px' : '50px',
    },
    {
      id: 'powered-by-container',
    }
  );
  setChatPopUpOpenView(chatPopupOpenViewContainer);

  const poweredByContainer = createPoweredByContainer(isPremium);

  const xButton = createElement('div', {
    ...xButtonStyle,
    right: isPremium ? '13px' : '7px',
    top: isPremium ? '27px' : '26px',
  });
  xButton.innerHTML = svgCloseIcon;

  // Function to handle responsive display
  const handleResponsiveDisplay = () => {
    if (isMobileScreen()) {
      chatPopupOpenViewContainer.style.display = 'none';
    } else {
      xButton.style.display = 'flex';
      chatPopupOpenViewContainer.style.display = 'block';
    }
  };
  handleResponsiveDisplay();
  window.addEventListener('resize', handleResponsiveDisplay);

  appendChild(poweredByContainer, xButton);
  appendChild(chatPopupOpenViewContainer, poweredByContainer);

  xButton.addEventListener('click', (e) =>
    closeChatButtonClickHandler(e, chatPopupClosedViewButton)
  );

  return chatPopupOpenViewContainer;
}
