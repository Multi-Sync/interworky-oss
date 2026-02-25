import { thumbsDownIconSVG, thumbsUpIconSVG } from '../../../styles/icons';
import {
  assistantMessageStyle,
  cursorStyle,
  messagesTextStyle,
  reactionButtonStyle,
  reactionContainerStyle,
  receiptStyle,
  userMessageStyle,
} from '../../../styles/styles';
import {
  saveMessage,
  updateMessageReaction,
} from '../../../utils/api/conversationApi';
import { sendReport } from '../../../utils/api/sendReportApi';
import {
  getAssistantInfo,
  getIsChatActive,
  getLastElementBottomPosition,
  getMessagesAnimationDelayInMilliSeconds,
  getMessagesPadding,
  getOrganization,
  getOrganizationEmail,
  getPatient,
  setLastElementBottomPosition,
} from '../../utils/state';
import { appendChild, createElement } from '../baseMethods';
import ariaUtils from '../../../utils/aria';
import {
  createLoadingAnimation,
  hideLoadingAnimation,
} from '../templates/loadingAnimationText';

// Add notification sound
const notificationSound = new Audio(
  'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
);

let isTogglingTitle = false;
let originalTitle = document.title;
let newMessageTitle = 'New message';
let titleInterval;

const activeReceipts = new Set();

// Debounced scroll function to prevent rapid scroll calls
let scrollTimeout = null;
export function scrollToBottom() {
  const chatContainer = document.querySelector('#chat-container');
  if (chatContainer) {
    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // Debounce scroll operation
    scrollTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    }, 10); // Small delay to batch scroll operations
  }
}

// Function to preserve input state
function preserveInputState() {
  const inputElement = document.querySelector('#interworky-input-field');
  if (!inputElement) return null;

  return {
    value: inputElement.value,
    selectionStart: inputElement.selectionStart,
    selectionEnd: inputElement.selectionEnd,
    hasFocus: document.activeElement === inputElement,
  };
}

// Function to restore input state
function restoreInputState(state) {
  if (!state) return;

  const inputElement = document.querySelector('#interworky-input-field');
  if (!inputElement) return;

  inputElement.value = state.value;
  inputElement.selectionStart = state.selectionStart;
  inputElement.selectionEnd = state.selectionEnd;

  if (state.hasFocus) {
    inputElement.focus();
  }
}
function createReadReceipt(messageContainer) {
  const loadingContainer = createLoadingAnimation();
  loadingContainer.style.backgroundColor = 'transparent';
  loadingContainer.style.position = 'absolute';
  loadingContainer.style.bottom = '-30px';
  loadingContainer.style.right = '0px';
  appendChild(messageContainer, loadingContainer);

  const receipt = createElement('div', receiptStyle, { 'aria-hidden': 'true' });

  const checkIcon = createElement('span', {}, { innerText: '✔✔' });
  appendChild(receipt, checkIcon);

  setTimeout(() => {
    if (loadingContainer.parentNode) {
      loadingContainer.parentNode.removeChild(loadingContainer);
    }

    appendChild(messageContainer, receipt);
    activeReceipts.add(receipt);

    setTimeout(() => {
      receipt.style.opacity = '1';
      receipt.style.transform = 'translateY(0)';
    }, 100);
  }, 800);

  return receipt;
}

// Rwmove Received Check Marks
function removeAllReadReceipts() {
  activeReceipts.forEach((receipt) => {
    // Animate fade out
    receipt.style.opacity = '0';
    receipt.style.transform = 'translateY(-5px)';

    // Remove from DOM after animation completes
    setTimeout(() => {
      if (receipt.parentNode) {
        receipt.parentNode.removeChild(receipt);
      }
      activeReceipts.delete(receipt);
    }, 300);
  });
}

function notifyNewMessage() {
  if (!getIsChatActive() || document.hidden) {
    if (!isTogglingTitle) {
      isTogglingTitle = true;
      toggleTitle();
    }

    // Play notification sound
    notificationSound.play().catch((err) => {
      console.error('Unable to play sound:', err);
    });
  }
}

function toggleTitle() {
  let showNewMessage = true;
  titleInterval = setInterval(() => {
    document.title = showNewMessage ? newMessageTitle : originalTitle;
    showNewMessage = !showNewMessage;
  }, 1000);
}

function resetNotifications() {
  if (getIsChatActive() && !document.hidden) {
    isTogglingTitle = false;
    clearInterval(titleInterval);
    document.title = originalTitle;
  }
}

document.addEventListener('visibilitychange', resetNotifications);
window.addEventListener('focus', resetNotifications);

/**
 * Removes text enclosed in special brackets like 【】
 * @param {string} str - The input text to clean
 * @returns {string} - Text with the bracketed content removed
 */
function removeCitations(str) {
  return str.replace(/【[^】]*】|/g, '');
}

/**
 * Animates text typing character by character with a blinking cursor
 * @param {HTMLElement} element - The element to animate text in
 * @param {string} text - The text to animate
 * @param {number} speed - Speed of typing in milliseconds
 * @returns {Promise} - Promise that resolves when animation is complete
 */
function typeText(element, text, speed = 30) {
  const cursor = createElement('span', cursorStyle, { textContent: '|' });
  appendChild(element, cursor);

  return new Promise((resolve) => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        if (text[i] === '\n') {
          element.innerHTML += '<br>'; // Replace newlines with <br> tags
        } else {
          element.innerHTML =
            text.substring(0, i + 1) +
            '<span style="display: inline-block; width: 2px;"></span>';
        }
        i++;
      } else {
        clearInterval(interval);
        if (cursor.parentNode) {
          cursor.parentNode.removeChild(cursor);
        }
        element.innerHTML = text;
        resolve();
      }

      // Only scroll to bottom if user is not actively typing

      scrollToBottom();
      cursor.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, speed);

    // Cleanup function in case we need to stop the animation
    element.typeTextCleanup = () => {
      clearInterval(interval);
      if (cursor.parentNode) {
        cursor.parentNode.removeChild(cursor);
      }
      element.innerHTML = text;

      scrollToBottom();

      resolve();
    };
  });
}

/**
 * Creates an assistant message with optional emoji animation.
 * Calls a callback function when the message animation completes.
 *
 * @param {string} message - The text content of the assistant message.
 * @param {boolean} [showLoading=false] - If true, shows a loading animation before the message.
 * @param {function} [callback=null] - Optional callback to be executed after the message animation completes.
 */
export async function createAssistantMessage(
  message,
  showLoading = false,
  isHTML = false,
  callback = null,
  skipReactions = false,
  realtimeClient = null,
  skipCache = false
) {
  removeAllReadReceipts();
  function stripHtmlTags(str) {
    return str.replace(/<[^>]*>/g, '');
  }

  function decodeHtmlEntities(str) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  }

  const assistantInfoFirstMessage = getAssistantInfo().first_message;
  const isAssistantFirstMessage = message === assistantInfoFirstMessage;
  message = removeCitations(message);
  message = decodeHtmlEntities(message);
  // Remove HTML tags if isHTML is true and remove special brackets
  let sanitizedMessage = isHTML ? stripHtmlTags(message) : message;
  let displayMessage = sanitizedMessage;

  let messageId;
  try {
    if (!skipCache) {
      const response = await saveMessage(sanitizedMessage, 'assistant');
      // Get the ID of the last message added
      messageId = response?.messages[response.messages.length - 1].id;
    }
  } catch (error) {
    console.error('Error saving assistant message:', error);
    return; // Don't continue if we couldn't get the message ID
  }

  const chatContainer = document.querySelector('#chat-container');
  if (!chatContainer) return;
  if (!getIsChatActive()) {
    console.error('Chat is closed, not creating the message.');
    return;
  }

  const containsCode = message.includes('<code>');

  // Get current timestamp for ARIA label
  const timestamp = new Date().toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const messageContainer = createElement(
    'div',
    {
      ...assistantMessageStyle,
      wordBreak: containsCode ? 'break-all' : 'break-word',
    },
    { 'data-message-id': messageId }
  );

  // Add ARIA attributes for accessibility and AI agent compatibility
  ariaUtils.setAttributes(messageContainer, {
    role: 'article',
    'aria-label': `Assistant message received at ${timestamp}`,
  });

  const assistantContainer = createElement('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
  });

  // Create reaction container
  const reactionContainer = createElement('div', reactionContainerStyle);

  // Create thumbs up button
  const thumbsUpButton = createElement('button', reactionButtonStyle);
  thumbsUpButton.setAttribute('data-message-id', messageId);
  thumbsUpButton.innerHTML = thumbsUpIconSVG;
  ariaUtils.setAttributes(thumbsUpButton, {
    'aria-label': 'Mark this response as helpful',
    role: 'button',
  });

  // Create thumbs down button
  const thumbsDownButton = createElement('button', reactionButtonStyle);
  thumbsDownButton.setAttribute('data-message-id', messageId);
  thumbsDownButton.innerHTML = thumbsDownIconSVG;
  ariaUtils.setAttributes(thumbsDownButton, {
    'aria-label': 'Mark this response as not helpful',
    role: 'button',
  });

  // Modular hover effect function for cross-platform compatibility
  const addReactionButtonHoverEffect = (button) => {
    const applyHoverState = () => {
      button.style.transform = 'scale(1.1)';
      button.style.transition = 'all 0.2s ease';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      button.style.borderColor = '#4CAF50'; // Green for thumbs up, will be overridden for thumbs down
      button.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    };

    const removeHoverState = () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = 'none';
      button.style.borderColor = '#666';
      button.style.backgroundColor = 'transparent';
    };

    // Desktop events
    button.addEventListener('mouseenter', applyHoverState);
    button.addEventListener('mouseleave', removeHoverState);

    // Touch events for mobile
    button.addEventListener('touchstart', applyHoverState);
    button.addEventListener('touchend', removeHoverState);
    button.addEventListener('touchcancel', removeHoverState);

    // Pointer events for modern browsers (unified mouse/touch)
    button.addEventListener('pointerenter', applyHoverState);
    button.addEventListener('pointerleave', removeHoverState);

    // Prevent default touch behavior to avoid conflicts
    button.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );
  };

  // Apply hover effects
  addReactionButtonHoverEffect(thumbsUpButton);
  addReactionButtonHoverEffect(thumbsDownButton);

  // Override border color for thumbs down button
  thumbsDownButton.addEventListener('mouseenter', () => {
    thumbsDownButton.style.borderColor = '#f44336'; // Red for thumbs down
    thumbsDownButton.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
  });
  thumbsDownButton.addEventListener('pointerenter', () => {
    thumbsDownButton.style.borderColor = '#f44336';
    thumbsDownButton.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
  });
  thumbsDownButton.addEventListener('touchstart', () => {
    thumbsDownButton.style.borderColor = '#f44336';
    thumbsDownButton.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
  });

  // Add click handlers with debug logging
  thumbsUpButton.addEventListener('click', async () => {
    const msgContainer = thumbsDownButton.parentNode.parentNode;
    const msgId = thumbsUpButton.getAttribute('data-message-id');
    if (!msgId) {
      console.error('No message ID found on thumbs up button');
      return;
    }
    try {
      await updateMessageReaction(1, msgId); // 1 for like
      thumbsUpButton.style.opacity = '1';
      thumbsDownButton.style.opacity = '0.3';
      thumbsUpButton.style.pointerEvents = 'none';
      thumbsDownButton.style.pointerEvents = 'none';
      const msgText = msgContainer.querySelector(
        '#assistant-message-text'
      ).innerText;
      sendReport(
        `👏 Positive 💃 Feedback to plugin response\n✉️*Response*: ${msgText}\n🌐*Website*: ${getOrganization().organization_website}
        \n📨*Organization Email*: ${getOrganizationEmail()}\n 👤*User Email*: ${getPatient().email}`
      );
    } catch (error) {
      console.error('Error saving thumbs up reaction:', error);
    }
  });

  thumbsDownButton.addEventListener('click', async () => {
    const msgContainer = thumbsDownButton.parentNode.parentNode;
    const msgId = thumbsDownButton.getAttribute('data-message-id');
    if (!msgId) {
      console.error('No message ID found on thumbs down button');
      return;
    }
    if (!realtimeClient) {
      console.error(
        'Realtime client is not available for thumbs down reaction'
      );
      return;
    }
    try {
      await updateMessageReaction(2, msgId); // 2 for dislike

      thumbsDownButton.style.opacity = '1';
      thumbsUpButton.style.opacity = '0.3';
      thumbsUpButton.style.pointerEvents = 'none';
      thumbsDownButton.style.pointerEvents = 'none';

      const msgText = msgContainer.querySelector(
        '#assistant-message-text'
      ).innerText;
      sendReport(
        `🥺 Negative 😔 Feedback to plugin response\n✉️*Response*: ${msgText}\n🌐*Website*: ${getOrganization().organization_website}
        \n📨*Organization Email*: ${getOrganizationEmail()}\n 👤*User Email*: ${getPatient().email}`
      );

      const thumbsDownText = `Context: Previous interaction required clarification
Original Question: ${sanitizedMessage}
Previous Response: ${message}
Feedback: User indicated the response was not satisfactory
Request: Please provide a more accurate and clearer response, considering:
- Be more specific and detailed
- Address any potential misunderstandings
- Provide examples if applicable
- Ensure all parts of the original question are addressed
- The answer should not be so long, it should be concise and to the point
`;

      const conversationItemCreateEvent = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: thumbsDownText.trim() }],
        },
      };

      await realtimeClient.send(conversationItemCreateEvent);
    } catch (error) {
      console.error('Error saving thumbs down reaction:', error);
      hideLoadingAnimation(); // Only hide on error
    }
  });

  appendChild(reactionContainer, thumbsUpButton);
  appendChild(reactionContainer, thumbsDownButton);

  notifyNewMessage();
  appendChild(assistantContainer, messageContainer);
  chatContainer.appendChild(assistantContainer);

  const validMessage = displayMessage || 'No message provided';
  const messageText = createElement('span', messagesTextStyle);
  messageText.id = 'assistant-message-text';

  // Show loading animation if needed
  if (showLoading) {
    const loadingContainer = createLoadingAnimation(messageContainer);
    appendChild(messageContainer, loadingContainer);

    setTimeout(() => {
      if (getIsChatActive()) {
        hideLoadingAnimation();
        appendChild(messageContainer, messageText);

        renderMessage();
      }
    }, getMessagesAnimationDelayInMilliSeconds());
  } else {
    appendChild(messageContainer, messageText);
    messageContainer.style.position = 'relative';
    renderMessage();
  }

  function renderMessage() {
    // Create a MutationObserver to watch for height changes in the message container
    const resizeObserver = new ResizeObserver(() => {
      // Only scroll to bottom if user is not actively typing and change is significant

      scrollToBottom();
    });

    // Start observing the message container for size changes
    resizeObserver.observe(messageContainer);

    typeText(messageText, validMessage).then(() => {
      requestAnimationFrame(() => {
        if (getIsChatActive()) {
          messageContainer.style.transform = 'translateY(0)';
          messageContainer.style.opacity = '1';

          // Only add reaction buttons if not the first message and not skipping reactions
          if (!isAssistantFirstMessage && !skipReactions) {
            appendChild(assistantContainer, reactionContainer);
          }
          if (isAssistantFirstMessage) {
            const event = new CustomEvent('firstMessageComplete');
            document.dispatchEvent(event);
          }

          // Ensure we scroll to bottom after the message is fully rendered (only if user not typing)

          scrollToBottom();

          if (callback && getIsChatActive()) {
            setTimeout(() => {
              if (callback) callback();
              // Disconnect the observer once the animation is complete
              resizeObserver.disconnect();
            }, getMessagesAnimationDelayInMilliSeconds());
          } else {
            // Disconnect the observer if no callback is provided
            setTimeout(() => {
              resizeObserver.disconnect();
            }, 1000); // Give some extra time for any animations to complete
          }
        }
      });
    });
  }

  // Only scroll to bottom if user is not actively typing

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageHeight = messageContainer.offsetHeight;
  setLastElementBottomPosition(
    getLastElementBottomPosition() + messageHeight + getMessagesPadding()
  );
}

/**
 * Creates a user message and positions it beneath the last message.
 * Calls a callback function when the message animation completes.
 *
 * @param {string} message - The text content of the user message.
 * @param {function} [callback=null] - Optional callback to be executed after the message animation completes.
 */
export async function createUserMessage(
  message,
  callback = null,
  skipCache = false
) {
  if (!skipCache) {
    await saveMessage(message, 'user');
  }

  const chatContainer = document.querySelector('#chat-container');
  if (!chatContainer) return;

  // Get current timestamp for ARIA label
  const timestamp = new Date().toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const messageContainer = createElement('div', {
    ...userMessageStyle,
  });

  // Add ARIA attributes for accessibility and AI agent compatibility
  ariaUtils.setAttributes(messageContainer, {
    role: 'article',
    'aria-label': `User message sent at ${timestamp}`,
  });

  const messageText = createElement(
    'span',
    { ...messagesTextStyle },
    { innerText: message }
  );

  appendChild(messageContainer, messageText);

  chatContainer.appendChild(messageContainer);

  const messageHeight = messageContainer.offsetHeight;
  setLastElementBottomPosition(
    getLastElementBottomPosition() + messageHeight + getMessagesPadding()
  );

  // Only scroll to bottom if user is not actively typing

  chatContainer.scrollTop = chatContainer.scrollHeight;

  requestAnimationFrame(() => {
    if (getIsChatActive()) {
      messageContainer.style.transform = 'translateY(0)';
      messageContainer.style.opacity = '1';

      // Add read receipt after the message animation completes
      setTimeout(() => {
        if (getIsChatActive()) {
          createReadReceipt(messageContainer);
        }

        if (callback) {
          setTimeout(callback, getMessagesAnimationDelayInMilliSeconds());
        }
      }, getMessagesAnimationDelayInMilliSeconds());
    }
  });
}

/**
 * Creates an input field for user interaction and positions it beneath the last message.
 * Executes the provided callback when the user submits the input.
 *
 * @param {string} placeholder - The placeholder text for the input field.
 * @param {function} onSubmit - The function to call when the user submits the input.
 */
export function createInputField(
  placeholder,
  onSubmit,
  validationPattern = null
) {
  const assistantContainer = document.querySelector('#assistant-container');
  if (!assistantContainer) return;

  // Select input and submit button
  const inputElement = document.querySelector('#interworky-input-field');
  const submitButton = document.querySelector('#submit-button');

  if (!inputElement || !submitButton) {
    console.error('Input field or submit button not found in DOM');
    return;
  }

  // Check if input is already in the correct state to avoid unnecessary replacement
  const needsReplacement =
    inputElement.placeholder !== placeholder ||
    inputElement.rows !== 1 ||
    inputElement.style.fontSize !== '16px' ||
    !inputElement.hasAttribute('data-chat-element');

  let currentInput = inputElement;
  let currentSubmit = submitButton;

  if (needsReplacement) {
    // Preserve current input state before replacement
    const preservedState = preserveInputState();

    // Clone nodes to remove all previous event listeners
    const newInput = inputElement.cloneNode(true);

    newInput.placeholder = placeholder;
    newInput.rows = 1;
    newInput.style.fontSize = '16px';
    const newSubmit = submitButton.cloneNode(true);

    // Ensure data-chat-element attribute is set
    newInput.setAttribute('data-chat-element', 'true');
    newSubmit.setAttribute('data-chat-element', 'true');

    // Replace original elements with cloned elements
    inputElement.parentNode.replaceChild(newInput, inputElement);
    submitButton.parentNode.replaceChild(newSubmit, submitButton);

    // Update current references
    currentInput = newInput;
    currentSubmit = newSubmit;

    // Restore input state after replacement
    if (preservedState) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        restoreInputState(preservedState);
      }, 0);
    }
  }

  // Reset input and button states
  enableInputs({ input: currentInput, submit: currentSubmit, placeholder });

  // Auto-resize input
  currentInput.addEventListener('input', () => {
    currentInput.style.height = 'auto';
    currentInput.style.height = `${currentInput.scrollHeight}px`;
  });

  // Function to handle validation and submission
  function handleSubmit() {
    const value = currentInput.value.trim();
    if (!value) return;
    if (validationPattern && !new RegExp(validationPattern).test(value)) {
      // Show the tooltip if validation fails
      tooltip.style.visibility = 'visible';
      if (getIsChatActive()) {
        setTimeout(() => {
          tooltip.style.visibility = 'hidden'; // Hide tooltip after 2 seconds
        }, 2000);
      }
    } else {
      onSubmit(value);
      disableInputs({ input: currentInput, submit: currentSubmit });
    }
  }

  // Event listener for the Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        const cursorPos = currentInput.selectionStart;
        currentInput.value =
          currentInput.value.slice(0, cursorPos) +
          '\n' +
          currentInput.value.slice(cursorPos);
        currentInput.selectionStart = currentInput.selectionEnd = cursorPos + 1;
      } else {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  // Event listener for submit button click
  const handleSubmitClick = (e) => {
    e.preventDefault();
    handleSubmit();
  };

  // Add new listeners to elements
  currentInput.addEventListener('keypress', handleKeyPress);
  currentSubmit.addEventListener('click', handleSubmitClick);

  // Cleanup function
  const cleanup = () => {
    currentInput.removeEventListener('keypress', handleKeyPress);
    currentSubmit.removeEventListener('click', handleSubmitClick);
    currentInput.value = '';
    currentInput.disabled = true;
    currentSubmit.disabled = true;
  };

  return cleanup;
}

/**
 * @param {{input: HTMLInputElement, submit: HTMLButtonElement, placeholder?: string}} elements
 */
function enableInputs({ input, submit, placeholder = '' }) {
  input.disabled = false;
  submit.disabled = false;
  input.ariaDisabled = false;
  submit.ariaDisabled = false;
  input.style.cursor = 'auto';
  submit.style.cursor = 'pointer';
  input.focus();
  if (placeholder) {
    input.placeholder = placeholder;
  }
}

/**
 * @param {{input: HTMLInputElement, submit: HTMLButtonElement}} elements
 */
function disableInputs({ input, submit }) {
  input.disabled = true;
  submit.disabled = true;
  input.ariaDisabled = true;
  submit.ariaDisabled = true;
  input.style.cursor = 'not-allowed';
  submit.style.cursor = 'not-allowed';
  input.value = null;
  input.placeholder = '';
}
