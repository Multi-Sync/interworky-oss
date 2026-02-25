import { getIsMuted } from '../../utils/voice-state';

export function updateMinimizedStatus(mode) {
  const statusText = document.getElementById('minimized-status-text');
  if (!statusText) return;

  for (let i = 0; i < 8; i++) {
    const bar = document.getElementById(`waveform-bar-${i}`);
    if (bar) {
      if (getIsMuted()) {
        bar.style.animation = 'none';
        bar.style.height = '8px';
      } else {
        bar.style.animation = `waveform-${i} 1s ease-in-out infinite`;
        bar.style.animationDelay = `${i * 0.1}s`;
      }
    }
  }

  // If muted, always show "Mic muted" regardless of mode
  if (getIsMuted()) {
    statusText.innerText = 'Muted';
    return;
  }

  switch (mode) {
    case 'MODE_1':
      statusText.innerText = 'Speaking';
      break;
    case 'MODE_2':
      statusText.innerText = 'Listening';
      break;
    default:
      statusText.innerText = 'Ready';
  }
}
