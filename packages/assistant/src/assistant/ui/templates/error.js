import { getChatPopUpOpenView } from '../../utils/state';
import { appendChild, createElement } from '../baseMethods';
import ariaUtils from '../../../utils/aria';

// Function to show a floating error panel
export function showError(message) {
  const container = getChatPopUpOpenView();
  const errorPanel = createElement('div', {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '1em',
    zIndex: '1000',
    animation: 'fadeIn 0.5s ease',
  });
  errorPanel.innerText = message;

  // Add ARIA attributes for error alert
  ariaUtils.setAttributes(errorPanel, {
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': 'true',
  });

  appendChild(container, errorPanel);

  // Automatically remove the error panel after a few seconds
  setTimeout(() => {
    errorPanel.remove();
  }, 5000); // Display for 5 seconds
}
