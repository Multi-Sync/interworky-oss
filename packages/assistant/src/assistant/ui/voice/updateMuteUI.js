import { muteIconSVG, svgMicIcon } from '../../../styles/icons';
import { getCurrentMode, getIsMuted } from '../../utils/voice-state';
import { clearStatus, updateStatus } from '../templates/voice/createStatus';
import { updateMinimizedStatus } from './updateMinimizedStatus';

export function updateMuteUI() {
  // Update expanded mode button
  const expandedMuteButton = document.getElementById('mute-toggle');
  if (expandedMuteButton) {
    const isMuted = getIsMuted();
    if (isMuted) {
      expandedMuteButton.innerHTML = muteIconSVG;
      expandedMuteButton.title = 'Unmute microphone';
      expandedMuteButton.setAttribute('aria-label', 'Unmute microphone');
      expandedMuteButton.setAttribute('aria-pressed', 'true');
      updateStatus('Mic muted');

      // Announce to screen readers and AI agents
      const statusAnnouncer = document.getElementById('voice-status');
      if (statusAnnouncer) {
        statusAnnouncer.textContent = 'Microphone muted';
      }
    } else {
      expandedMuteButton.innerHTML = svgMicIcon;
      expandedMuteButton.title = 'Mute microphone';
      expandedMuteButton.setAttribute('aria-label', 'Mute microphone');
      expandedMuteButton.setAttribute('aria-pressed', 'false');
      clearStatus();

      // Announce to screen readers and AI agents
      const statusAnnouncer = document.getElementById('voice-status');
      if (statusAnnouncer) {
        statusAnnouncer.textContent = 'Microphone unmuted';
      }
    }
  }

  // Update minimized mode button
  const minimizedMuteButton = document.getElementById('minimized-mic-button');
  if (minimizedMuteButton) {
    const isMuted = getIsMuted();
    if (isMuted) {
      minimizedMuteButton.innerHTML = muteIconSVG;
      minimizedMuteButton.style.color = '#666';
      minimizedMuteButton.setAttribute('aria-label', 'Unmute microphone');
      minimizedMuteButton.setAttribute('aria-pressed', 'true');
    } else {
      minimizedMuteButton.innerHTML = svgMicIcon;
      minimizedMuteButton.style.color = '#333';
      minimizedMuteButton.setAttribute('aria-label', 'Mute microphone');
      minimizedMuteButton.setAttribute('aria-pressed', 'false');
    }
  }

  // Update minimized status text
  updateMinimizedStatus(getCurrentMode());
}
