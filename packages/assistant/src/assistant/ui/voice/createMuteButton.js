import { muteIconSVG, svgMicIcon } from '../../../styles/icons';
import { muteButtonStyles } from '../../../styles/styles';
import { getIsMuted } from '../../utils/voice-state';
import { appendChild, createElement } from '../baseMethods';
import { clearStatus, updateStatus } from '../templates/voice/createStatus';
import { toggleMuteUI } from './toggleMuteUI';
import ariaUtils from '../../../utils/aria';

export function createMuteButton(container) {
  // 1) Create a single <button> element
  const toggle = createElement('button', {}, {});
  toggle.id = 'mute-toggle';

  // 2) Apply shared styles
  Object.assign(toggle.style, muteButtonStyles, {
    cursor: 'pointer',
    background: 'white',
    border: 'none',
    outline: 'none',
    borderRadius: '50%',
    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 8px',
  });

  // 3) Decide initial icon/tooltip based on existing `getIsMuted`
  const isMuted = getIsMuted();

  if (isMuted) {
    toggle.innerHTML = muteIconSVG; // currently muted
    toggle.title = 'Unmute microphone';
    updateStatus('Mic muted');
  } else {
    toggle.innerHTML = svgMicIcon; // currently unmuted
    toggle.title = 'Mute microphone';
    clearStatus();
  }

  // Add ARIA attributes for toggle button
  ariaUtils.setAttributes(toggle, {
    role: 'button',
    'aria-label': isMuted ? 'Unmute microphone' : 'Mute microphone',
    'aria-pressed': isMuted.toString(),
  });

  toggle.addEventListener('click', toggleMuteUI);

  // 5) Append it to the container
  appendChild(container, toggle);
}
