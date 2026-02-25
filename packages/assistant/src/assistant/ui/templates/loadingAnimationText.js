import { getAssistantInfo } from '../../utils/state';
import { appendChild, createElement } from '../baseMethods';

// Function to create a loading animation
export function createLoadingAnimation(parentContainer = null) {
  const container =
    parentContainer || document.querySelector('#chat-container');
  if (!container) return;

  const loadingContainer = createElement('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '14px',
    width: 'fit-content',
    borderRadius: '0 10px 10px ',
  });
  loadingContainer.id = 'loading-animation';

  // Create three dots
  for (let i = 0; i < 3; i++) {
    const dot = createElement('div', {
      width: '8px',
      height: '8px',
      backgroundColor: getAssistantInfo().text_primary_color || '#666',
      borderRadius: '50%',
      animation: `waveDot 1.2s infinite ease-in-out ${i * 0.15}s`,
      opacity: 0.8,
    });

    // Add keyframe animation style if it doesn't exist
    if (!document.querySelector('#wave-animation')) {
      const style = document.createElement('style');
      style.id = 'wave-animation';
      style.textContent = `
        @keyframes waveDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.8; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    appendChild(loadingContainer, dot);
  }

  if (!parentContainer) {
    container.appendChild(loadingContainer);
    // Only scroll if user is not actively typing
    const activeElement = document.activeElement;
    const inputElement = document.querySelector('#interworky-input-field');
    if (
      !(
        activeElement === inputElement &&
        inputElement &&
        !inputElement.disabled
      )
    ) {
      container.scrollTop = container.scrollHeight;
    }
  }

  return loadingContainer;
}

// Function to hide the loading animation
export function hideLoadingAnimation() {
  const loadingContainer = document.querySelector('#loading-animation');
  if (loadingContainer) {
    loadingContainer.remove();
  }
}
