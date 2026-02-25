import { getAssistantInfo } from '../assistant/utils/state';

let theme = getAssistantInfo();
var text_primary_color;
if (!theme) {
  text_primary_color = '#000000';
} else {
  var { text_primary_color: text_primary_color } = theme;
}

export const calendarIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${text_primary_color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`;

export const bulbIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${text_primary_color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;

export const svgMicIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${text_primary_color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;

export const sendIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${text_primary_color}" stroke="${text_primary_color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>`;

export const svgCloseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${text_primary_color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

export const svgInfoIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <path d="m9 12 2 2 4-4"/>
  <path d="M12 16v-4"/>
  <path d="M12 8h.01"/>
</svg>`;

export const muteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${text_primary_color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic-off"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;

export const voiceIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 52 52" stroke="${text_primary_color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<style>
.wave {
  animation: pulseWave 1.5s infinite ease-in-out;
  transform-origin: center;
  opacity: 0.6;
}
.wave-1 { 
  animation-delay: 0s;
}
.wave-2 { 
  animation-delay: 0.2s;
}
.wave-3 { 
  animation-delay: 0.4s;
}

@keyframes pulseWave {
  0% { 
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% { 
    opacity: 1;
    transform: scale(1.2);
  }
  100% { 
    opacity: 0.3;
    transform: scale(0.8);
  }
}

.microphone {
  fill: none;
  stroke: ${text_primary_color};
  stroke-width: 3;
}
</style>

<path class="microphone" d="M3 3c9.521 0 17.253 7.72 17.367 17.286l3.69 5.24c.549.778.452 1.824-.36 2.322c-.815.501-2.027 1.088-3.674 1.493l-.554 6.706a3 3 0 0 1-3.365 2.729l-2.683-.338v3.238c0 1.289-.83 2.416-2.096 2.65C9.606 44.647 6.83 45 3 45"/>
<path class="microphone" d="M12 18v1"/>
<path class="wave wave-1" fill="none" stroke="${text_primary_color}" stroke-width="2" d="M29.5 25.5c2.667 2.485 2.667 6.515 0 9"/>
<path class="wave wave-2" fill="none" stroke="${text_primary_color}" stroke-width="2" d="M35.25 22c4 4.418 4 11.582 0 16"/>
<path class="wave wave-3" fill="none" stroke="${text_primary_color}" stroke-width="2" d="M40 18c6.667 6.627 6.667 17.373 0 24"/>
</svg>
`;

export const textIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="${text_primary_color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text">
<style>
.line {
fill: ${text_primary_color};
animation: moveX 1s infinite ease-in-out;
transform-origin: left center;
}

.line:nth-of-type(1) {
animation-delay: 0s;
}
.line:nth-of-type(2) {
animation-delay: 0.2s;
}
.line:nth-of-type(3) {
animation-delay: 0.4s;
}

@keyframes moveX {
0%, 100% {
transform: translateX(0);
}
50% {
transform: translateX(-2px);
}
}
</style>

<line class="line" x1="3" y1="6.1" x2="17" y2="6.1" />
<line class="line" x1="3" y1="12.1" x2="21" y2="12.1" />
<line class="line" x1="3" y1="18" x2="15.1" y2="18" />
</svg>
`;

export const nextIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>`;

export const previousIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>`;

export const optionsIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${text_primary_color}" stroke="${text_primary_color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`;

export const disclaimerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
  <line x1="12" x2="12" y1="9" y2="13"/>
  <line x1="12" x2="12.01" y1="17" y2="17"/>
</svg>`;

export const UserIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><g fill="none" stroke="#058A7C" stroke-width="1.5"><rect width="6" height="12" x="9" y="2" fill="#058A7C" rx="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v2M1 2v4m18-3v2m4-3v4M5 10v1a7 7 0 0 0 7 7v0a7 7 0 0 0 7-7v-1m-7 8v4m0 0H9m3 0h3"/></g></svg>`;

export const getUserSpeakingSVG = (strokeColor) => `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 52 52" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<style>
.wave {
  animation: pulseWave 1.5s infinite ease-in-out;
  transform-origin: center;
  opacity: 0.6;
}
.wave-1 { 
  animation-delay: 0s;
}
.wave-2 { 
  animation-delay: 0.2s;
}
.wave-3 { 
  animation-delay: 0.4s;
}

@keyframes pulseWave {
  0% { 
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% { 
    opacity: 1;
    transform: scale(1.2);
  }
  100% { 
    opacity: 0.3;
    transform: scale(0.8);
  }
}

.microphone {
  fill: none;
  stroke: ${strokeColor};
  stroke-width: 3;
}
</style>

<path class="microphone" d="M3 3c9.521 0 17.253 7.72 17.367 17.286l3.69 5.24c.549.778.452 1.824-.36 2.322c-.815.501-2.027 1.088-3.674 1.493l-.554 6.706a3 3 0 0 1-3.365 2.729l-2.683-.338v3.238c0 1.289-.83 2.416-2.096 2.65C9.606 44.647 6.83 45 3 45"/>
<path class="microphone" d="M12 18v1"/>
<path class="wave wave-1" fill="none" stroke="${strokeColor}" stroke-width="2" d="M29.5 25.5c2.667 2.485 2.667 6.515 0 9"/>
<path class="wave wave-2" fill="none" stroke="${strokeColor}" stroke-width="2" d="M35.25 22c4 4.418 4 11.582 0 16"/>
<path class="wave wave-3" fill="none" stroke="${strokeColor}" stroke-width="2" d="M40 18c6.667 6.627 6.667 17.373 0 24"/>
</svg>
`;
export const minimizeIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#000" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minimize2-icon lucide-minimize-2"><path d="m14 10 7-7"/><path d="M20 10h-6V4"/><path d="m3 21 7-7"/><path d="M4 14h6v6"/></svg>`;

export const expandIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#000" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize2-icon lucide-maximize-2"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg>`;
const getThumbsUpIconSVG = (strokeColor) => `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M7 10v12"/>
  <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1"/>
</svg>
`;

const getThumbsDownIconSVG = (strokeColor) => `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17 2v12"/>
  <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1"/>
</svg>
`;

export let thumbsUpIconSVG = getThumbsUpIconSVG('#ffffff');
export let thumbsDownIconSVG = getThumbsDownIconSVG('#ffffff');
export let UserSpeakingSVG = getUserSpeakingSVG('#ffffff');

export function updateIcons(isDark) {
  const strokeColor = isDark ? '#000000' : '#ffffff';
  thumbsUpIconSVG = getThumbsUpIconSVG(strokeColor);
  thumbsDownIconSVG = getThumbsDownIconSVG(strokeColor);
  UserSpeakingSVG = getUserSpeakingSVG(strokeColor);
}
