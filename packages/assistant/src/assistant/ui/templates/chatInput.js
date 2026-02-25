import {
  inputContainerStyle,
  inputFieldStyle,
  inputWrapperStyle,
  submitButtonStyle,
} from '../../../styles/styles';
import { appendChild, createElement } from '../baseMethods';

import { sendIconSVG } from '../../../styles/icons';
import { detectDarkTheme } from '../../../styles/themeManager';
import { getAssistantInfo } from '../../utils/state';
import { createBranding } from './branding';
import ariaUtils from '../../../utils/aria';
// import { createVoiceButton } from './voiceButton';

export const createChatInput = () => {
  const isDarkTheme = detectDarkTheme();
  const wrapper = createElement('div', inputWrapperStyle, {});
  const isPremium = getAssistantInfo().premium;
  // const voiceModeEnabled = getAssistantInfo().voice_enabled;

  const voiceInputContainerStyle = {
    ...inputContainerStyle,
    // width: voiceModeEnabled ? '80%' : '',
  };

  const inputContainer = createElement('div', voiceInputContainerStyle);

  // Add ARIA role for form container
  ariaUtils.setAttributes(inputContainer, {
    role: 'form',
    'aria-label': 'Send message',
  });

  // Create the input field with an accessible label
  const inputElement = createElement('textarea', inputFieldStyle, {
    id: 'interworky-input-field',
    disabled: true,
  });

  // Add ARIA attributes for input field
  ariaUtils.setAttributes(inputElement, {
    'aria-label': 'Type your message',
    'aria-disabled': 'true',
    'aria-multiline': 'true',
    'aria-required': 'false',
  });

  const submitButton = createElement('button', submitButtonStyle, {
    innerHTML: sendIconSVG,
    id: 'submit-button',
    disabled: true,
    type: 'button',
  });

  // Add ARIA attributes for submit button
  ariaUtils.setAttributes(submitButton, {
    'aria-label': 'Send message',
    'aria-disabled': 'true',
    role: 'button',
  });

  appendChild(inputContainer, inputElement);
  appendChild(inputContainer, submitButton);

  // if (voiceModeEnabled) {
  //   const inputVoiceWrapper = createElement('div', inputVoiceWrapperStyle);
  //   const voiceButton = createVoiceButton();

  //   appendChild(inputVoiceWrapper, inputContainer);
  //   appendChild(inputVoiceWrapper, voiceButton);
  //   appendChild(wrapper, inputVoiceWrapper);
  // } else {
  appendChild(wrapper, inputContainer);
  // }

  if (!isPremium) {
    const poweredByContainer = createBranding();
    poweredByContainer.style.setProperty(
      'color',
      isDarkTheme ? '#000' : '#fff',
      'important'
    );
    appendChild(wrapper, poweredByContainer);
  }

  return wrapper;
};
