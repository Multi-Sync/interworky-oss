import { minimizeIconSVG } from '../../../styles/icons';
import { minimizeButtonStyles } from '../../../styles/styles';
import { appendChild, createElement } from '../baseMethods';
import { minimizeVoiceChat } from './minimizeVoiceChat';
import ariaUtils from '../../../utils/aria';

export function createMinimizeButton(container) {
  const minimizeButton = createElement('div', minimizeButtonStyles);
  minimizeButton.id = 'minimize-button';
  minimizeButton.innerHTML = minimizeIconSVG;
  minimizeButton.title = 'Minimize';

  // Add ARIA attributes for minimize button
  ariaUtils.setAttributes(minimizeButton, {
    role: 'button',
    'aria-label': 'Minimize voice assistant',
    'aria-expanded': 'true',
    tabindex: '0',
  });

  minimizeButton.onclick = () => {
    minimizeVoiceChat();
  };

  // Add keyboard support
  minimizeButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      minimizeVoiceChat();
    }
  });

  appendChild(container, minimizeButton);
}
