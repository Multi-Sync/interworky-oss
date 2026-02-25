import { createElement } from '../baseMethods';

export function addWaveformAnimations() {
  const style = createElement('style', {
    id: 'waveform-animations',
  });
  style.textContent = `
    @keyframes waveform-0 { 0%, 100% { height: 8px; } 50% { height: 20px; } }
    @keyframes waveform-1 { 0%, 100% { height: 12px; } 50% { height: 16px; } }
    @keyframes waveform-2 { 0%, 100% { height: 6px; } 50% { height: 24px; } }
    @keyframes waveform-3 { 0%, 100% { height: 14px; } 50% { height: 10px; } }
    @keyframes waveform-4 { 0%, 100% { height: 8px; } 50% { height: 18px; } }
    @keyframes waveform-5 { 0%, 100% { height: 16px; } 50% { height: 8px; } }
    @keyframes waveform-6 { 0%, 100% { height: 10px; } 50% { height: 22px; } }
    @keyframes waveform-7 { 0%, 100% { height: 12px; } 50% { height: 14px; } }
  `;

  document.head.appendChild(style);
}
