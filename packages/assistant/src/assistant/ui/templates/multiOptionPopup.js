import { appendChild, createElement } from '../baseMethods';
import {
  assistantMessageStyle,
  optionStyle,
  optionTextStyle,
} from '../../../styles/styles';
import { getAssistantInfo } from '../../utils/state';
import ariaUtils from '../../../utils/aria';

/**
 * Renders a multiple option popup with icon, text, and callback for each option.
 *
 * @param {Option[]} options - An array of Option objects containing the icon URL, text, and callback function.
 */
export function createMultipleOptionPopUp(options) {
  const chatContainer = document.querySelector('#chat-container');
  if (!chatContainer) return;
  const messageContainer = createElement('div', {
    ...assistantMessageStyle,
    padding: '0',
  });

  // Create a container for the options list
  const optionsContainer = createElement('div', {
    display: 'flex',
    flexDirection: 'column',
  });

  // Add ARIA attributes for options group
  const groupId = `options-group-${Date.now()}`;
  ariaUtils.setAttributes(optionsContainer, {
    role: 'group',
    'aria-labelledby': groupId,
  });

  // Create a hidden label for the group
  const groupLabel = document.createElement('div');
  groupLabel.id = groupId;
  groupLabel.className = 'sr-only';
  groupLabel.textContent = 'Choose an option:';
  optionsContainer.appendChild(groupLabel);

  let selectedOption = null;

  options.forEach((option, index) => {
    const optionStyleClone = { ...optionStyle };
    if (index === options.length - 1) {
      optionStyleClone.borderBottom = 'none';
    }

    const optionElement = createElement('div', optionStyleClone);

    // Add ARIA attributes for option button
    ariaUtils.setAttributes(optionElement, {
      role: 'button',
      'aria-label': option.text,
      tabindex: '0',
    });

    const iconElement = createElement('div', {}, { innerHTML: option.iconSVG });
    // Mark icon as decorative
    iconElement.setAttribute('aria-hidden', 'true');

    const textElement = createElement('span', optionTextStyle, {
      innerText: option.text,
    });

    appendChild(optionElement, iconElement);
    appendChild(optionElement, textElement);

    // Add hover effect
    optionElement.addEventListener('mouseover', () => {
      if (selectedOption === null) {
        optionElement.style.backgroundColor =
          getAssistantInfo().secondary_color;
      }
    });

    optionElement.addEventListener('mouseout', () => {
      if (optionElement !== selectedOption) {
        optionElement.style.backgroundColor = '';
      }
    });

    // Add click behavior
    const handleSelect = (e) => {
      if (selectedOption !== null) {
        return;
      }
      optionElement.style.backgroundColor = getAssistantInfo().secondary_color;
      selectedOption = optionElement;

      // Update ARIA pressed state
      optionElement.setAttribute('aria-pressed', 'true');

      optionsContainer
        .querySelectorAll('div[role="button"]')
        .forEach((element) => {
          if (element !== optionElement) {
            element.style.cursor = 'not-allowed';
            element.style.opacity = '0.7';
            element.setAttribute('aria-disabled', 'true');

            element.removeEventListener('mouseover', element.onmouseover);
            element.removeEventListener('mouseout', element.onmouseout);
          }
        });

      option.callback(e);
    };

    optionElement.addEventListener('click', handleSelect);

    // Add keyboard support
    optionElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect(e);
      }
    });

    appendChild(optionsContainer, optionElement);
  });

  // Append the options container to the assistant message container
  appendChild(messageContainer, optionsContainer);

  chatContainer.appendChild(messageContainer);

  // Scroll the container to the bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
