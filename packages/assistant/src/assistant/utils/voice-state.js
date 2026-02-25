let isMuted = false; // Global mute state
let isMinimized = false;
let currentMode = 'READY';
let realtimeClient, waveform, audioElement;
let sessionUsage = { totalTokens: 0, cost: 0 }; // Track usage from OpenAI Agents SDK
let patientEmailSentToAgent = false; // Track if patient email has been sent as system message

// voice state management
export function getIsMuted() {
  return isMuted;
}

export function setIsMuted(muted) {
  isMuted = muted;
}

export function toggleIsMuted() {
  isMuted = !isMuted;
}

export function getIsMinimized() {
  return isMinimized;
}

export function setIsMinimized(minimized) {
  isMinimized = minimized;
}

export function getCurrentMode() {
  return currentMode;
}

export function setCurrentMode(mode) {
  currentMode = mode;
}

export function setRealtimeClient(client) {
  realtimeClient = client;
}

export function getRealtimeClient() {
  return realtimeClient;
}

export function setWaveform(wave) {
  waveform = wave;
}

export function getWaveform() {
  return waveform;
}

export function setAudioElement(element) {
  audioElement = element;
}

export function getAudioElement() {
  return audioElement;
}

// Usage tracking functions for OpenAI Agents SDK
export function getSessionUsage() {
  return sessionUsage;
}

export function setSessionUsage(usage) {
  sessionUsage = usage;
}

export function updateSessionUsage(tokens, cost) {
  sessionUsage = { totalTokens: tokens, cost: cost };
}

// Patient email system message tracking
export function getPatientEmailSentToAgent() {
  return patientEmailSentToAgent;
}

export function setPatientEmailSentToAgent(sent) {
  patientEmailSentToAgent = sent;
}
