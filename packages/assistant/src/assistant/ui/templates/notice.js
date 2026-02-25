import { svgInfoIcon } from '../../../styles/icons';
import {
  infoVoiceIconStyle,
  popupVoiceNoticeStyle,
  voiceNoticeTextStyle,
} from '../../../styles/styles';
import { appendChild, createElement } from '../baseMethods';
import ariaUtils from '../../../utils/aria';

/**
 * Creates a popup notice with a given text and a privacy policy link.
 *
 * @param {string} text - The message to display in the popup notice.
 */
export function createNotice(text, parentContainer = '') {
  let chatContainer;
  if (parentContainer == '') {
    chatContainer = document.querySelector('#chat-container');
    if (!chatContainer) return;
  }

  const noticeContainer = createElement('div', popupVoiceNoticeStyle);

  // Add ARIA attributes for notice
  ariaUtils.setAttributes(noticeContainer, {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });

  // Create the info icon (decorative)
  const infoIcon = createElement('div', infoVoiceIconStyle);
  infoIcon.innerHTML = svgInfoIcon;
  infoIcon.setAttribute('aria-hidden', 'true');

  // Create the text element
  const noticeText = createElement('p', voiceNoticeTextStyle, {
    innerText: text,
  });

  // Create the privacy link
  const privacyLink = createElement('a', voiceNoticeTextStyle, {
    innerText: 'Privacy Policy',
    href: 'https://interworky.com/privacy',
    target: '_blank',
  });

  // Append all elements to the notice container
  appendChild(noticeContainer, infoIcon);
  appendChild(noticeContainer, noticeText);
  appendChild(noticeContainer, privacyLink);

  if (parentContainer == '') {
    // Append the notice container to the body
    chatContainer.appendChild(noticeContainer);
    // Scroll into view for better visibility
    noticeContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    // Scroll the container to the bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  } else {
    return noticeContainer;
  }
}
