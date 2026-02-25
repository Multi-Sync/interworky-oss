import { createElement } from '../baseMethods';
import { voiceIconSVG } from '../../../styles/icons';
import { startGenAICustomerAssistantVoice } from '../../modes/customerAssistant/voiceCustomerAssistant';
import ariaUtils from '../../../utils/aria';

export function createVoiceButton() {
  const voiceButton = createElement(
    'button',
    {
      display: 'block',
      width: '24px',
      height: '24px',
      backgroundColor: 'transparent',
      border: 'none',
      padding: '0',
    },
    {
      innerHTML: voiceIconSVG,
    }
  );
  voiceButton.style.marginLeft = '8px';
  voiceButton.style.cursor = 'pointer';

  // Add ARIA attributes for voice button
  ariaUtils.setAttributes(voiceButton, {
    role: 'button',
    'aria-label': 'Start voice conversation',
    'aria-pressed': 'false',
  });

  voiceButton.addEventListener('click', () => {
    voiceButton.setAttribute('aria-pressed', 'true');
    voiceButton.setAttribute(
      'aria-label',
      'Voice mode active. Click to switch to text mode.'
    );
    startGenAICustomerAssistantVoice();
  });

  return voiceButton;
}
