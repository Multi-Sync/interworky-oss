import {
  blurOverlayStyle,
  disclaimerCloseBtnStyle,
  disclaimerModalStyle,
  disclaimerTextStyle,
} from '../../../styles/styles';
import { appendChild, createElement } from '../baseMethods';
import ariaUtils from '../../../utils/aria';

export const DisclaimerModal = () => {
  const assistantContainer = document.getElementById('assistant-container');

  const blurOverlay = createElement(
    'div',
    {
      ...blurOverlayStyle,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    },
    {
      id: 'assistant-blur-overlay',
    }
  );

  // Updated disclaimer modal with liquid glass styling
  const disclaimerModal = createElement(
    'div',
    {
      ...disclaimerModalStyle,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(25px) saturate(180%)',
      WebkitBackdropFilter: 'blur(25px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
      borderRadius: '16px',
      padding: '0',
      maxWidth: '400px',
    },
    {
      id: 'assistant-disclaimer-modal',
    }
  );

  // Add ARIA attributes for disclaimer dialog
  ariaUtils.setAttributes(disclaimerModal, {
    role: 'dialog',
    'aria-labelledby': 'disclaimer-title',
    'aria-describedby': 'assistant-disclaimer-text',
    'aria-modal': 'true',
  });

  // Header container
  const headerContainer = createElement('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  });

  const disclaimerTitle = createElement(
    'h2',
    {
      margin: '0',
      fontSize: '18px',
      fontWeight: '600',
      color: '#2c3e50',
      letterSpacing: '0.5px',
    },
    {
      innerText: 'AI Disclaimer',
      id: 'disclaimer-title',
    }
  );

  // Updated close button with glass styling
  const closeDisclaimerButton = createElement(
    'button',
    {
      ...disclaimerCloseBtnStyle,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '16px',
      transition: 'all 0.2s ease',
      color: '#2c3e50',
      fontSize: '18px',
    },
    {
      id: 'assistant-disclaimer-close-btn',
      innerText: '×',
    }
  );

  // Add ARIA attributes for close button
  ariaUtils.setAttributes(closeDisclaimerButton, {
    'aria-label': 'Close AI disclaimer',
    role: 'button',
  });

  // Add hover effect to close button
  closeDisclaimerButton.addEventListener('mouseenter', () => {
    closeDisclaimerButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    closeDisclaimerButton.style.transform = 'scale(1.05)';
  });
  closeDisclaimerButton.addEventListener('mouseleave', () => {
    closeDisclaimerButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    closeDisclaimerButton.style.transform = 'scale(1)';
  });

  // Updated disclaimer text with better styling
  const disclaimerText = createElement(
    'p',
    {
      ...disclaimerTextStyle,
      padding: '20px 24px',
      margin: '0',
      fontSize: '14px',
      lineHeight: '1.6',
      color: '#34495e',
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
      borderRadius: '0 0 16px 16px',
    },
    {
      id: 'assistant-disclaimer-text',
      innerText:
        'This Chatbot uses a Large Language Model (LLM) trained on content provided by our team. While we strive for accuracy, responses are generated to assist and are not legally binding or a substitute for professional advice. Please verify important information independently.',
    }
  );

  // Add ARIA role for informational content
  disclaimerText.setAttribute('role', 'note');

  closeDisclaimerButton.addEventListener('click', () => {
    disclaimerModal.style.display = 'none';
    blurOverlay.style.display = 'none';
  });

  appendChild(headerContainer, disclaimerTitle);
  appendChild(headerContainer, closeDisclaimerButton);
  appendChild(disclaimerModal, headerContainer);
  appendChild(disclaimerModal, disclaimerText);

  // Add blur overlay to assistant container first
  assistantContainer.appendChild(blurOverlay);
  assistantContainer.appendChild(disclaimerModal);

  blurOverlay.addEventListener('click', (e) => {
    if (e.target === blurOverlay) {
      disclaimerModal.style.display = 'none';
      blurOverlay.style.display = 'none';
    }
  });

  return { disclaimerModal, blurOverlay };
};

export const showDisclaimerModal = () => {
  const { disclaimerModal, blurOverlay } = DisclaimerModal();
  disclaimerModal.style.display = 'block';
  blurOverlay.style.display = 'block';
};
