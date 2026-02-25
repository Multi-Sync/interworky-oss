//src/assistant/ui/baseMethods.js

/**
 * Creates a DOM element with the specified tag, styles, and attributes.
 *
 * @param {string} tag - The tag name of the element to create (e.g., 'div', 'span').
 * @param {Object} [styles={}] - An object containing CSS styles to apply to the element.
 * @param {Object} [attributes={}] - An object containing attributes to apply to the element (e.g., `innerHTML`, `className`).
 * @returns {HTMLElement} - The newly created DOM element.
 */
export function createElement(
  tag,
  styles = {},
  attributes = {},
  assignDataChatElementForRemoval = true
) {
  const element = document.createElement(tag);

  // Apply styles
  Object.assign(element.style, styles);

  // Apply attributes
  Object.keys(attributes).forEach((attr) => {
    element[attr] = attributes[attr];
  });

  if (styles[':hover']) {
    element.addEventListener('mouseenter', () => {
      Object.assign(element.style, styles[':hover']);
    });
    element.addEventListener('mouseleave', () => {
      Object.assign(element.style, styles);
    });
  }

  if (assignDataChatElementForRemoval) {
    // Add a data attribute to mark this as a chat element
    element.setAttribute('data-chat-element', 'true');
  }

  return element;
}

/**
 * Appends a child element to a parent element.
 *
 * @param {HTMLElement} parent - The parent element to append the child to.
 * @param {HTMLElement} child - The child element to append.
 * @returns {HTMLElement} - The appended child element.
 */
export function appendChild(parent, child) {
  parent.appendChild(child);
  return child;
}

export function removeAllChatElements() {
  // Handle chat container separately
  const assistantContainer = document.getElementById('assistant-container');
  if (assistantContainer) {
    assistantContainer.style.width = '0px';
    assistantContainer.style.height = '0px';
  }

  // Remove other chat elements immediately
  const chatElements = document.querySelectorAll(
    '[data-chat-element="true"]:not(#assistant-container)'
  );
  chatElements.forEach((element) => element.remove());
}
