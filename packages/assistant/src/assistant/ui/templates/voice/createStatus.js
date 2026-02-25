import { statusTextStyles } from '../../../../styles/styles';
import { getVoiceChatContainer } from '../../../utils/state';
import { createElement } from '../../baseMethods';

// Function to create the status text
export function createStatus(text) {
  return createElement('div', statusTextStyles, {
    id: 'status',
    innerText: text,
  });
}

export function clearStatus() {
  const status = document.getElementById('statusElement');
  if (status) {
    status.innerHTML = '';
  }
}

export function updateStatus(newStatus) {
  const status = document.getElementById('statusElement');
  if (status) {
    status.innerHTML = newStatus;
  }
}

function createModeBadge(container) {
  if (!container) return null;

  // Try to find an existing badge
  let badge = container.querySelector('.mode-badge');
  if (badge) return badge;

  // Otherwise, create it
  badge = createElement('div', statusTextStyles, {});
  badge.className = 'mode-badge';
  badge.style.pointerEvents = 'none'; // ensure clicks pass through
  container.appendChild(badge);

  return badge;
}

/**
 * Update the badge’s text and background color.
 * Example usage:
 *   updateModeBadge('Speaking', '#E53E3E');   // red badge
 *   updateModeBadge('Listening', '#2F855A');  // green badge
 */
export function updateModeBadge(text, backgroundColor) {
  const container = getVoiceChatContainer();
  if (!container) return;

  const badge = createModeBadge(container);
  if (!badge) return;

  badge.innerText = text;
  badge.style.backgroundColor = backgroundColor;
}

/**
 * Hide (or remove) the badge completely.
 */
export function clearModeBadge() {
  const container = getVoiceChatContainer();
  if (!container) return;
  const badge = container.querySelector('.mode-badge');
  if (badge) badge.remove();
}
