import { fullScreenContainerStyles } from '../../../styles/styles';
import { createElement } from '../baseMethods';
import ariaUtils from '../../../utils/aria';

// Function to create the full-screen container
export function createFullScreenContainer() {
  const container = createElement('div', fullScreenContainerStyles, {
    id: 'fullscreen-assistant-container',
  });

  // Add ARIA attributes for voice assistant application
  ariaUtils.setAttributes(container, {
    role: 'application',
    'aria-label': 'Voice Assistant',
    'aria-describedby': 'voice-status',
  });

  // Create hidden status announcer for screen readers and AI agents
  const statusAnnouncer = document.createElement('div');
  statusAnnouncer.id = 'voice-status';
  statusAnnouncer.setAttribute('role', 'status');
  statusAnnouncer.setAttribute('aria-live', 'assertive');
  statusAnnouncer.setAttribute('aria-atomic', 'true');
  statusAnnouncer.className = 'sr-only';
  container.appendChild(statusAnnouncer);

  return container;
}
