// src/assistant/modes/flowEngine/index.js
import { assistantContainerStyle, overlayStyle } from '../../../styles/styles';
import { appendChild, createElement } from '../../ui/baseMethods';
import { injectAccessibilityStyles } from '../../../styles/accessibilityStyles';
import { getIsVoiceChatActive, setIsVoiceChatActive, getScriptTags } from '../../utils/state';
import { createFlowSession, fetchFlowConfig } from './FlowEngine';
import logger from '../../../utils/logger';

// Import completion action handler
import { processCompletionAction } from './completionActions';

// Import auth gate for login-before-results flow
import { showAuthGate, requiresAuth } from './authGate';
import { isFlowAuthenticated, getFlowUser, chargeFlowTokens, saveFlowResult, updateFlowUserBalance } from '../../../utils/authBridge';

// Import validation API for data completeness checks
import { validateFlowData, needsMoreData, getFollowUpQuestions } from '../../../utils/api/flowValidationApi';

// Import action registry and renderer for output
import { getAction, getRenderer } from './renderers/index';
import './renderers/actions'; // Register all actions

// Register all renderers
import './renderers/resumeRenderer';
import './renderers/macroRenderer';
import './renderers/careerRenderer';
import './renderers/reportRenderer';
import './renderers/cardRenderer';
import './renderers/calculatorRenderer';

// Import data mapper for transforming raw tool data
import { getRendererData } from './dataMapper';

// Import visual companion for immersive visuals during voice session
import {
  initVisualCompanion,
  createVisualContainer,
  updateVisual,
  generateInitialVisual,
  onAgentChange,
  onToolCall,
  destroyVisualCompanion,
} from './visualCompanion';

let flowSession = null;
let audioElement = null;
let flowContainer = null;
let voiceContainer = null;
let resultContainer = null;
let currentFlowConfig = null;
let currentSessionId = null;

// Generate unique session ID
function generateSessionId() {
  return `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create the initial flow UI with start button - Clean minimal design
 */
function createFlowStartUI(flowConfig) {
  currentFlowConfig = flowConfig;

  // Create overlay
  const overlay = createElement('div', overlayStyle, {});
  document.body.appendChild(overlay);

  // Create main container - clean stone theme
  flowContainer = createElement(
    'div',
    {
      ...assistantContainerStyle,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      textAlign: 'center',
      backgroundColor: '#fafaf9',
      border: '1px solid #e7e5e4',
    },
    { id: 'flow-container' }
  );

  // Title
  const title = createElement(
    'h1',
    {
      fontSize: '20px',
      fontWeight: '500',
      color: '#292524',
      marginBottom: '8px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    { textContent: flowConfig.name || 'Experience' }
  );

  // Description
  const description = createElement(
    'p',
    {
      fontSize: '14px',
      color: '#78716c',
      marginBottom: '24px',
      lineHeight: '1.5',
      maxWidth: '320px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    { textContent: flowConfig.description || 'Answer a few questions to get your personalized results.' }
  );

  // Start button - minimal style
  const startButton = createElement(
    'button',
    {
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#fafaf9',
      backgroundColor: '#57534e',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    { id: 'flow-start-btn' }
  );

  // Mic icon SVG
  const micIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  micIcon.setAttribute('width', '16');
  micIcon.setAttribute('height', '16');
  micIcon.setAttribute('viewBox', '0 0 24 24');
  micIcon.setAttribute('fill', 'none');
  micIcon.setAttribute('stroke', 'currentColor');
  micIcon.setAttribute('stroke-width', '2');
  micIcon.setAttribute('stroke-linecap', 'round');
  micIcon.setAttribute('stroke-linejoin', 'round');
  micIcon.innerHTML = '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line>';

  const buttonText = document.createElement('span');
  buttonText.textContent = "Let's Begin";
  buttonText.id = 'flow-start-text';

  startButton.appendChild(micIcon);
  startButton.appendChild(buttonText);

  startButton.addEventListener('mouseenter', () => {
    startButton.style.backgroundColor = '#44403c';
  });
  startButton.addEventListener('mouseleave', () => {
    startButton.style.backgroundColor = '#57534e';
  });

  startButton.addEventListener('click', async () => {
    if (getIsVoiceChatActive()) return;

    buttonText.textContent = 'Starting...';
    startButton.style.opacity = '0.7';
    startButton.disabled = true;

    // Start voice session with cinematic countdown overlay
    try {
      await startFlowVoice(flowConfig, true); // true = show countdown
    } catch (error) {
      logger.error('Failed to start flow voice', { error });
      buttonText.textContent = "Let's Begin";
      startButton.style.opacity = '1';
      startButton.disabled = false;
      // Show the start UI again if voice fails
      if (flowContainer) flowContainer.style.display = 'flex';
    }
  });

  appendChild(flowContainer, title);
  appendChild(flowContainer, description);
  appendChild(flowContainer, startButton);

  document.body.appendChild(flowContainer);
  updateContainerSize();
  window.addEventListener('resize', updateContainerSize);
}

/**
 * Show cinematic countdown overlay before voice session starts
 * Displays 3, 2, 1 countdown then "Say Hello" with cinematic animations
 * @param {Function} onComplete - Callback when countdown finishes
 */
function showCinematicCountdown(onComplete) {
  // Inject countdown styles
  const countdownStyles = document.createElement('style');
  countdownStyles.id = 'flow-countdown-styles';
  countdownStyles.textContent = `
    @keyframes countdownPulse {
      0% { transform: scale(0.3); opacity: 0; }
      30% { transform: scale(1.15); opacity: 1; }
      50% { transform: scale(1); }
      70% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes countdownFadeOut {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0; filter: blur(10px); }
    }
    @keyframes countdownGlow {
      0%, 100% { text-shadow: 0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(255,255,255,0.1); }
      50% { text-shadow: 0 0 60px rgba(255,255,255,0.5), 0 0 120px rgba(255,255,255,0.2); }
    }
    @keyframes sayHelloSlideUp {
      0% { transform: translateY(40px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    @keyframes sayHelloGlow {
      0%, 100% { text-shadow: 0 0 30px rgba(255,255,255,0.4), 0 0 60px rgba(255,255,255,0.2); }
      50% { text-shadow: 0 0 50px rgba(255,255,255,0.6), 0 0 100px rgba(255,255,255,0.3); }
    }
    @keyframes overlayFadeOut {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes subtleFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    @keyframes ringPulse {
      0% { transform: scale(0.8); opacity: 0.8; }
      100% { transform: scale(2); opacity: 0; }
    }

    /* Mobile responsive countdown */
    @media screen and (max-width: 480px) {
      #countdown-number {
        font-size: 80px !important;
        letter-spacing: -4px !important;
      }
      #countdown-ring {
        width: 100px !important;
        height: 100px !important;
      }
      #say-hello-container > div:first-child {
        font-size: 32px !important;
        letter-spacing: 4px !important;
      }
      #say-hello-container > div:last-child svg {
        width: 24px !important;
        height: 24px !important;
      }
    }

    @media screen and (max-width: 360px) {
      #countdown-number {
        font-size: 64px !important;
        letter-spacing: -2px !important;
      }
      #countdown-ring {
        width: 80px !important;
        height: 80px !important;
      }
      #say-hello-container > div:first-child {
        font-size: 26px !important;
        letter-spacing: 2px !important;
      }
    }
  `;
  if (!document.getElementById('flow-countdown-styles')) {
    document.head.appendChild(countdownStyles);
  }

  // Create overlay - semi-transparent to show voice UI behind
  const overlay = createElement(
    'div',
    {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(12, 10, 9, 0.92)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10002',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    { id: 'flow-countdown-overlay' }
  );

  // Countdown number container
  const countdownContainer = createElement(
    'div',
    {
      position: 'relative',
      width: '200px',
      height: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    {}
  );

  // Ring effect behind number
  const ring = createElement(
    'div',
    {
      position: 'absolute',
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.2)',
    },
    { id: 'countdown-ring' }
  );

  // Countdown number
  const countdownNumber = createElement(
    'div',
    {
      fontSize: '120px',
      fontWeight: '200',
      color: '#fafaf9',
      letterSpacing: '-8px',
      animation: 'countdownGlow 1s ease-in-out infinite',
    },
    { id: 'countdown-number', textContent: '3' }
  );

  countdownContainer.appendChild(ring);
  countdownContainer.appendChild(countdownNumber);

  // "Say Hello" text (initially hidden)
  const sayHelloContainer = createElement(
    'div',
    {
      position: 'absolute',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      opacity: '0',
    },
    { id: 'say-hello-container' }
  );

  const sayHelloText = createElement(
    'div',
    {
      fontSize: '48px',
      fontWeight: '300',
      color: '#fafaf9',
      letterSpacing: '8px',
      textTransform: 'uppercase',
    },
    { textContent: 'Say Hello' }
  );

  // Microphone icon
  const micIcon = createElement(
    'div',
    {
      opacity: '0.6',
    },
    {}
  );
  micIcon.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fafaf9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" x2="12" y1="19" y2="22"></line>
    </svg>
  `;

  sayHelloContainer.appendChild(sayHelloText);
  sayHelloContainer.appendChild(micIcon);

  overlay.appendChild(countdownContainer);
  overlay.appendChild(sayHelloContainer);
  document.body.appendChild(overlay);

  // Countdown sequence
  let count = 3;
  const showNumber = (num) => {
    countdownNumber.style.animation = 'none';
    countdownNumber.offsetHeight; // Trigger reflow
    countdownNumber.textContent = num;
    countdownNumber.style.animation = 'countdownPulse 0.7s ease-out forwards, countdownGlow 1s ease-in-out infinite';

    // Ring pulse effect
    ring.style.animation = 'none';
    ring.offsetHeight;
    ring.style.animation = 'ringPulse 0.7s ease-out forwards';
  };

  const fadeOutNumber = () => {
    countdownNumber.style.animation = 'countdownFadeOut 0.3s ease-in forwards';
  };

  // Initial animation for 3
  showNumber(3);

  // Countdown interval
  const countdownInterval = setInterval(() => {
    count--;

    if (count > 0) {
      fadeOutNumber();
      setTimeout(() => showNumber(count), 300);
    } else if (count === 0) {
      // Hide countdown, show "Say Hello"
      fadeOutNumber();
      setTimeout(() => {
        countdownContainer.style.display = 'none';
        sayHelloContainer.style.opacity = '1';
        sayHelloContainer.style.animation = 'sayHelloSlideUp 0.6s ease-out forwards';
        sayHelloText.style.animation = 'sayHelloGlow 2s ease-in-out infinite';
        micIcon.style.animation = 'subtleFloat 2s ease-in-out infinite';
      }, 300);
    } else {
      // Fade out overlay and complete
      clearInterval(countdownInterval);
      setTimeout(() => {
        overlay.style.animation = 'overlayFadeOut 0.5s ease-in forwards';
        setTimeout(() => {
          overlay.remove();
          onComplete();
        }, 500);
      }, 1200); // Show "Say Hello" for 1.2 seconds
    }
  }, 800); // Each number shows for 800ms
}

/**
 * Create voice conversation UI - Clean minimal design
 */
function createVoiceUI() {
  if (voiceContainer) voiceContainer.remove();

  // Hide the flow container (start UI) when voice session begins
  if (flowContainer) {
    flowContainer.style.display = 'none';
  }

  // Add animations and styles - minimal
  const style = document.createElement('style');
  style.id = 'flow-voice-styles';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    /* Animation 1: Horizontal bars */
    @keyframes flowActive1 {
      0%  {background-position:0    0,0    100%}
      25% {background-position:100% 0,0    100%}
      47%, 53% {background-position:100% 0,100% 100%}
      75% {background-position:0    0,100% 100%}
      100%{background-position:0    0,0    100%}
    }
    /* Animation 2: Four squares grid */
    @keyframes flowActive2 {
      0%    {background-position:0   0  ,50%  0  ,0   50% ,50%  50%}
      12.5% {background-position:50% 0  ,100% 0  ,0   50% ,50%  50%}
      25%   {background-position:50% 0  ,100% 0  ,50% 50% ,100% 50%}
      37.5% {background-position:50% 0  ,100% 50%,50% 50% ,100% 100%}
      50%   {background-position:50% 50%,100% 50%,50% 100%,100% 100%}
      62.5% {background-position:50% 50%,100% 50%,0   100%,50%  100%}
      75%   {background-position:0   50%,50%  50%,0   100%,50%  100%}
      87.5% {background-position:0   0  ,50%  50%,0   50% ,50%  100%}
      100%  {background-position:0   0  ,50%  0  ,0   50% ,50%  50%}
    }
    /* Animation 3: Four blocks shuffle */
    @keyframes flowActive3 {
      0%    {background-position:0 0,50% 0,0 100%,50% 100%}
      12.5% {background-position:0 0,100% 0,0 100%,50% 100%}
      25%   {background-position:0 0,100% 0,0 100%,50% 0}
      37.5% {background-position:0 0,100% 0,50% 100%,50% 0}
      50%   {background-position:0 100%,100% 0,50% 100%,50% 0}
      62.5% {background-position:0 100%,100% 0,50% 100%,0 0}
      75%   {background-position:0 100%,100% 100%,50% 100%,0 0}
      87.5% {background-position:0 100%,100% 100%,50% 0,0 0}
      100%  {background-position:0 100%,50% 100%,50% 0,0 0}
    }
    @keyframes flowLoading {
      0%, 10%  {background-position:33.4% 100%,66.6% 100%}
      40%  {background-position:33.4% 0,100% 100%}
      70%  {background-position:0 100%,66.6% 0}
      100% {background-position:33.4% 100%,66.6% 100%}
    }
    .flow-active-indicator {
      height: 40px;
      --c:no-repeat linear-gradient(#fff 0 0);
      transition: opacity 0.3s ease-in-out;
    }
    .flow-active-style-1 {
      aspect-ratio: 1.5;
      background: var(--c), var(--c);
      background-size: 66% 50%;
      animation: flowActive1 1.5s infinite linear;
    }
    .flow-active-style-2 {
      height: 50px;
      aspect-ratio: 1;
      background: var(--c), var(--c), var(--c), var(--c);
      background-size: 33.4% 33.4%;
      animation: flowActive2 2s infinite linear;
    }
    .flow-active-style-3 {
      aspect-ratio: 1.5;
      background: var(--c), var(--c), var(--c), var(--c);
      background-size: 33.4% 50%;
      animation: flowActive3 2s infinite linear;
    }
    .flow-loading-indicator {
      height: 80px;
      aspect-ratio: 1;
      display: grid;
    }
    .flow-loading-indicator:before,
    .flow-loading-indicator:after {
      content: "";
      --c:no-repeat linear-gradient(#fff 0 0);
      background: var(--c), var(--c);
      background-size: 25% 50%;
      animation: flowLoading 1.5s infinite linear;
    }
    .flow-loading-indicator:after {
      transform: scale(-1);
    }
    @keyframes endBtnPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
      50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
    }
    .flow-end-ready {
      animation: endBtnPulse 2s ease-in-out infinite;
      background-color: #059669 !important;
    }
    .flow-end-ready:hover {
      background-color: #047857 !important;
    }
    .flow-transcript-entry {
      animation: fadeIn 0.2s ease-out;
    }
    #flow-voice-container * {
      box-sizing: border-box;
    }

    /* Mobile Responsive Styles */
    @media screen and (max-width: 480px) {
      #flow-voice-container {
        padding-top: env(safe-area-inset-top, 0px);
      }
      #flow-top-bar {
        padding: 12px 16px !important;
        gap: 8px !important;
      }
      #flow-top-bar .flow-icon {
        width: 28px !important;
        height: 28px !important;
      }
      #flow-top-bar .flow-icon svg {
        width: 14px !important;
        height: 14px !important;
      }
      #flow-top-bar .flow-name {
        font-size: 13px !important;
      }
      #flow-top-bar .flow-caption {
        font-size: 11px !important;
        max-width: 140px !important;
      }
      #flow-main-content {
        padding: 20px 16px !important;
      }
      #flow-orb-container {
        width: 64px !important;
        height: 64px !important;
        margin-bottom: 20px !important;
      }
      #flow-orb {
        width: 64px !important;
        height: 64px !important;
      }
      .flow-active-indicator {
        height: 32px !important;
      }
      .flow-active-style-2 {
        height: 40px !important;
      }
      .flow-loading-indicator {
        height: 64px !important;
      }
      #flow-voice-name {
        font-size: 16px !important;
      }
      #flow-agent-role {
        font-size: 12px !important;
      }
      #flow-status-label {
        font-size: 11px !important;
        margin-top: 8px !important;
      }
      #flow-transcript-area {
        padding: 0 16px 12px !important;
      }
      #flow-view-conversation-btn {
        padding: 10px 12px !important;
        font-size: 13px !important;
      }
      #flow-controls {
        padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) !important;
        gap: 10px !important;
      }
      #flow-mute-btn {
        width: 52px !important;
        height: 52px !important;
      }
      #flow-end-btn {
        padding: 14px 20px !important;
        font-size: 14px !important;
      }
    }

    /* Extra small screens */
    @media screen and (max-width: 360px) {
      #flow-top-bar .flow-caption {
        display: none !important;
      }
      #flow-orb-container,
      #flow-orb {
        width: 56px !important;
        height: 56px !important;
      }
      .flow-active-indicator {
        height: 28px !important;
      }
      .flow-loading-indicator {
        height: 56px !important;
      }
    }

    /* Landscape mobile */
    @media screen and (max-height: 500px) and (orientation: landscape) {
      #flow-main-content {
        padding: 12px 16px !important;
        flex-direction: row !important;
        gap: 24px !important;
      }
      #flow-agent-info-center {
        margin-bottom: 0 !important;
        text-align: left !important;
        align-items: flex-start !important;
      }
      #flow-orb-container {
        width: 56px !important;
        height: 56px !important;
        margin-bottom: 0 !important;
      }
      #flow-orb {
        width: 56px !important;
        height: 56px !important;
      }
      .flow-active-indicator {
        height: 28px !important;
      }
      .flow-loading-indicator {
        height: 56px !important;
      }
      #flow-status-label {
        display: none !important;
      }
      #flow-transcript-area {
        display: none !important;
      }
      #flow-controls {
        padding: 8px 16px calc(8px + env(safe-area-inset-bottom, 0px)) !important;
      }
    }

    /* Touch-friendly active states */
    @media (hover: none) and (pointer: coarse) {
      #flow-mute-btn:active {
        background-color: #57534e !important;
        transform: scale(0.95);
      }
      #flow-end-btn:active {
        transform: scale(0.97);
        opacity: 0.9;
      }
      #flow-view-conversation-btn:active {
        background-color: rgba(255,255,255,0.05) !important;
      }
    }
  `;
  if (!document.getElementById('flow-voice-styles')) {
    document.head.appendChild(style);
  }

  voiceContainer = createElement(
    'div',
    {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: '#292524',
      display: 'flex',
      flexDirection: 'column',
      zIndex: '10001',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    { id: 'flow-voice-container' }
  );

  // Top bar - minimal with progress
  const topBar = createElement(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 20px',
      borderBottom: '1px solid #3f3f3c',
      gap: '12px',
    },
    { id: 'flow-top-bar' }
  );

  // Top row: agent info and timer
  const topRow = createElement(
    'div',
    {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    {}
  );

  const flowInfo = createElement(
    'div',
    { display: 'flex', alignItems: 'center', gap: '10px' },
    {}
  );

  // Flow icon with theme color
  const flowIcon = createElement(
    'div',
    {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      backgroundColor: currentFlowConfig?.output_schema?.theme_color || '#57534e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    { className: 'flow-icon' }
  );
  flowIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fafaf9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>';

  const flowDetails = createElement('div', {}, {});

  // Show flow name
  const flowName = createElement(
    'div',
    {
      fontSize: '14px',
      fontWeight: '500',
      color: '#fafaf9',
    },
    { textContent: currentFlowConfig?.name || 'Experience', className: 'flow-name' }
  );
  // Show flow description as caption
  const flowCaption = createElement(
    'div',
    {
      fontSize: '12px',
      color: '#a8a29e',
      maxWidth: '200px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    { textContent: currentFlowConfig?.description?.substring(0, 50) + (currentFlowConfig?.description?.length > 50 ? '...' : '') || '', className: 'flow-caption' }
  );
  flowDetails.appendChild(flowName);
  flowDetails.appendChild(flowCaption);
  flowInfo.appendChild(flowIcon);
  flowInfo.appendChild(flowDetails);

  // Timer
  const timer = createElement(
    'div',
    {
      fontSize: '13px',
      color: '#78716c',
      fontVariantNumeric: 'tabular-nums',
    },
    { textContent: '00:00', id: 'flow-timer' }
  );

  topRow.appendChild(flowInfo);
  topRow.appendChild(timer);

  // Progress bar
  const totalAgents = Object.keys(currentFlowConfig?.agents || {}).length;
  const progressContainer = createElement(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    {}
  );

  const progressBar = createElement(
    'div',
    {
      flex: '1',
      height: '4px',
      backgroundColor: '#3f3f3c',
      borderRadius: '2px',
      overflow: 'hidden',
    },
    {}
  );

  const progressFill = createElement(
    'div',
    {
      width: `${Math.round((1 / totalAgents) * 100)}%`,
      height: '100%',
      backgroundColor: currentFlowConfig?.output_schema?.theme_color || '#57534e',
      borderRadius: '2px',
      transition: 'width 0.5s ease',
    },
    { id: 'flow-progress-fill' }
  );
  progressBar.appendChild(progressFill);

  const progressLabel = createElement(
    'div',
    {
      fontSize: '11px',
      color: '#78716c',
      whiteSpace: 'nowrap',
    },
    { textContent: `Step 1 of ${totalAgents}`, id: 'flow-progress-label' }
  );

  progressContainer.appendChild(progressBar);
  progressContainer.appendChild(progressLabel);

  topBar.appendChild(topRow);
  // Progress bar hidden for now - tool-based tracking not accurate
  // topBar.appendChild(progressContainer);

  // Main content area - minimal
  const mainContent = createElement(
    'div',
    {
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      position: 'relative',
    },
    { id: 'flow-main-content' }
  );

  // Simple indicator circle
  const orbContainer = createElement(
    'div',
    {
      position: 'relative',
      width: '80px',
      height: '80px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    { id: 'flow-orb-container' }
  );

  // Main indicator container - holds both active and loading states
  const orb = createElement(
    'div',
    {
      position: 'relative',
      width: '80px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    { id: 'flow-orb' }
  );

  // Active state indicator - animated bars with cycling styles
  orb.innerHTML = `
    <div id="flow-active-container" style="display: flex; align-items: center; justify-content: center;">
      <div class="flow-active-indicator flow-active-style-1" id="flow-active-anim"></div>
    </div>
    <div id="flow-loading-container" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; align-items: center; justify-content: center;">
      <div class="flow-loading-indicator"></div>
    </div>
  `;
  orbContainer.appendChild(orb);

  // Cycle through animation styles every 5 seconds with smooth fade
  let currentAnimStyle = 1;
  const animStyles = ['flow-active-style-1', 'flow-active-style-2', 'flow-active-style-3'];
  const animCycleInterval = setInterval(() => {
    const animEl = document.getElementById('flow-active-anim');
    if (animEl) {
      // Fade out
      animEl.style.opacity = '0';
      setTimeout(() => {
        // Remove current style
        animEl.classList.remove(animStyles[currentAnimStyle - 1]);
        // Move to next style
        currentAnimStyle = (currentAnimStyle % 3) + 1;
        // Add new style
        animEl.classList.add(animStyles[currentAnimStyle - 1]);
        // Fade in
        animEl.style.opacity = '1';
      }, 300);
    }
  }, 5000);

  // Store interval for cleanup
  if (!window._flowAnimIntervals) window._flowAnimIntervals = [];
  window._flowAnimIntervals.push(animCycleInterval);

  // Get starting agent info
  const startAgentKey = currentFlowConfig?.start_agent;
  const startAgent = currentFlowConfig?.agents?.[startAgentKey];
  const startVoice = startAgent?.voice || currentFlowConfig?.voice_config?.voice || 'Assistant';
  const startAgentName = startAgent?.name || 'Assistant';

  // Helper to capitalize voice name
  const capitalizeVoice = (voice) => voice ? voice.charAt(0).toUpperCase() + voice.slice(1) : 'Assistant';

  // Agent info above state - shows voice name and agent role
  const agentInfoCenter = createElement(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '16px',
    },
    { id: 'flow-agent-info-center' }
  );

  // Voice name (the "name" - like Sage, Ash, Coral)
  const voiceNameEl = createElement(
    'div',
    {
      fontSize: '18px',
      fontWeight: '600',
      color: '#fafaf9',
      marginBottom: '4px',
      transition: 'opacity 0.2s ease',
    },
    { textContent: capitalizeVoice(startVoice), id: 'flow-voice-name' }
  );

  // Agent role (the job title - like Resume Coordinator)
  const agentRoleEl = createElement(
    'div',
    {
      fontSize: '13px',
      color: '#a8a29e',
      transition: 'opacity 0.2s ease',
    },
    { textContent: startAgentName, id: 'flow-agent-role' }
  );

  agentInfoCenter.appendChild(voiceNameEl);
  agentInfoCenter.appendChild(agentRoleEl);

  // Status label - shows "Active" or "Loading"
  const statusLabel = createElement(
    'div',
    {
      fontSize: '12px',
      fontWeight: '500',
      color: '#a8a29e',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginTop: '12px',
    },
    { textContent: 'Active', id: 'flow-status-label' }
  );

  // Visual companion container - dynamic visuals during conversation
  const themeColor = currentFlowConfig?.output_schema?.theme_color || '#3b82f6';
  const visualCompanionContainer = createVisualContainer(null, themeColor);

  // Bottom section for orb and agent info
  const bottomSection = createElement(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: 'auto',
    },
    { id: 'flow-bottom-section' }
  );

  bottomSection.appendChild(agentInfoCenter);
  bottomSection.appendChild(orbContainer);
  bottomSection.appendChild(statusLabel);

  mainContent.appendChild(visualCompanionContainer);
  mainContent.appendChild(bottomSection);

  // Transcript area - hidden by default, voice-first experience
  const transcriptArea = createElement(
    'div',
    {
      width: '100%',
      padding: '0 20px 16px',
    },
    { id: 'flow-transcript-area' }
  );

  // "View Conversation" button - subtle, text-only
  const viewConversationBtn = createElement(
    'button',
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      width: '100%',
      padding: '8px 12px',
      fontSize: '12px',
      color: '#78716c',
      backgroundColor: 'transparent',
      border: '1px dashed #57534e',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    { id: 'flow-view-conversation-btn' }
  );
  viewConversationBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span>View Conversation</span>
  `;
  viewConversationBtn.addEventListener('mouseenter', () => {
    viewConversationBtn.style.color = '#a8a29e';
    viewConversationBtn.style.borderColor = '#78716c';
  });
  viewConversationBtn.addEventListener('mouseleave', () => {
    viewConversationBtn.style.color = '#78716c';
    viewConversationBtn.style.borderColor = '#57534e';
  });
  viewConversationBtn.addEventListener('click', showTranscriptBriefly);

  const transcript = createElement(
    'div',
    {
      maxHeight: '0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      backgroundColor: '#1c1917',
      borderRadius: '8px',
      border: '1px solid #3f3f3c',
      transition: 'max-height 0.3s ease, padding 0.3s ease, margin 0.3s ease',
      padding: '0 12px',
      marginTop: '0',
    },
    { id: 'flow-transcript' }
  );

  transcriptArea.appendChild(viewConversationBtn);
  transcriptArea.appendChild(transcript);

  // Bottom controls - minimal
  const controls = createElement(
    'div',
    {
      display: 'flex',
      justifyContent: 'center',
      gap: '12px',
      padding: '16px 20px',
      borderTop: '1px solid #3f3f3c',
    },
    { id: 'flow-controls' }
  );

  const muteBtn = createElement(
    'button',
    {
      width: '48px',
      height: '48px',
      color: '#fafaf9',
      backgroundColor: '#3f3f3c',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    { id: 'flow-mute-btn' }
  );
  muteBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>';
  muteBtn.title = 'Mute/Unmute';
  muteBtn.addEventListener('click', toggleMute);
  muteBtn.addEventListener('mouseenter', () => {
    muteBtn.style.backgroundColor = '#57534e';
  });
  muteBtn.addEventListener('mouseleave', () => {
    muteBtn.style.backgroundColor = isMuted ? '#991b1b' : '#3f3f3c';
  });

  const endBtn = createElement(
    'button',
    {
      padding: '12px 20px',
      fontSize: '13px',
      fontWeight: '500',
      color: '#fafaf9',
      backgroundColor: '#991b1b',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    { id: 'flow-end-btn' }
  );
  endBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg><span id="flow-end-text">End</span>';
  endBtn.addEventListener('click', endFlowSession);
  endBtn.addEventListener('mouseenter', () => {
    if (!endBtn.classList.contains('flow-end-ready')) {
      endBtn.style.backgroundColor = '#7f1d1d';
    }
  });
  endBtn.addEventListener('mouseleave', () => {
    if (!endBtn.classList.contains('flow-end-ready')) {
      endBtn.style.backgroundColor = '#991b1b';
    }
  });

  controls.appendChild(muteBtn);
  controls.appendChild(endBtn);

  // Assemble UI
  voiceContainer.appendChild(topBar);
  voiceContainer.appendChild(mainContent);
  voiceContainer.appendChild(transcriptArea);
  voiceContainer.appendChild(controls);

  document.body.appendChild(voiceContainer);

  // Hidden audio
  audioElement = createElement('audio', {}, { id: 'flow-audio' });
  audioElement.autoplay = true;
  document.body.appendChild(audioElement);

  // Start timer
  startTimer();
}

// Timer management
let timerInterval = null;
let timerSeconds = 0;

function startTimer() {
  timerSeconds = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerSeconds++;
    const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const secs = (timerSeconds % 60).toString().padStart(2, '0');
    const timerEl = document.getElementById('flow-timer');
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * Start voice session for flow
 * @param {Object} flowConfig - Flow configuration
 * @param {boolean} showCountdown - Whether to show cinematic countdown overlay
 */
async function startFlowVoice(flowConfig, showCountdown = false) {
  if (getIsVoiceChatActive()) return;

  setIsVoiceChatActive(true);
  currentSessionId = generateSessionId();
  createVoiceUI();

  // Show cinematic countdown overlay on top of voice UI
  if (showCountdown) {
    await new Promise((resolve) => {
      showCinematicCountdown(resolve);
    });
  }

  try {
    // Create flow session directly from config
    const { DynamicFlowSession } = await import('./FlowEngine');
    flowSession = new DynamicFlowSession(flowConfig);

    // Initialize visual companion for immersive visuals
    initVisualCompanion(flowConfig.flow_id);
    generateInitialVisual(flowConfig);

    // Event listeners
    flowSession.addEventListener('connected', () => {
      updateStateUI('listening');
      // Agent name already shows in the UI, no need for status text
    });

    // Handle state changes for visual feedback (orb animation only)
    flowSession.addEventListener('state_change', (e) => {
      const { state } = e.detail;
      updateStateUI(state);
    });

    // Handle initial greeting - agent speaks first
    flowSession.addEventListener('initial_greeting', (e) => {
      const { agent, greeting } = e.detail;
      logger.info('FLOW_UI', 'Initial greeting triggered', { agent, greeting: greeting?.substring(0, 30) });
      // The greeting will be spoken by the agent through the session
      // We just update UI to show the agent is speaking
      updateStateUI('speaking');
    });

    // Handle agent handoff - update agent info in UI (legacy, kept for backward compatibility)
    flowSession.addEventListener('handoff', (e) => {
      const { to, agentConfig } = e.detail;
      logger.info('FLOW_UI', 'Handoff received (will wait for agent_change)', {
        to,
        agentConfigName: agentConfig?.name,
        hasAgentConfig: !!agentConfig,
      });
      // UI update now handled by agent_change event for more reliability
    });

    // Handle agent_change - fires when agent starts (after handoff is complete)
    // Also fires on initial connection with isInitial: true
    flowSession.addEventListener('agent_change', (e) => {
      const { name, job_title, voice, avatar, theme_color, isInitial } = e.detail;
      const voiceNameEl = document.getElementById('flow-voice-name');
      const agentRoleEl = document.getElementById('flow-agent-role');

      logger.info('FLOW_UI', 'Agent change received', {
        name,
        job_title,
        voice,
        isInitial,
      });

      // Get voice - from event or fallback to global config
      const displayVoice = voice || currentFlowConfig?.voice_config?.voice || 'Assistant';
      const capitalizedVoice = displayVoice.charAt(0).toUpperCase() + displayVoice.slice(1);
      // Use job_title if available, otherwise fall back to name
      const displayRole = job_title || name || 'Agent';

      logger.info('FLOW_UI', 'Updating agent display', { displayVoice, displayRole, capitalizedVoice });

      // Update voice name with animation
      if (voiceNameEl) {
        voiceNameEl.style.opacity = '0';
        setTimeout(() => {
          voiceNameEl.textContent = capitalizedVoice;
          voiceNameEl.style.opacity = '1';
          logger.info('FLOW_UI', 'Voice name updated', { capitalizedVoice });
        }, 150);
      } else {
        logger.warn('FLOW_UI', 'Voice name element not found');
      }

      // Update agent role/title with animation
      if (agentRoleEl) {
        agentRoleEl.style.opacity = '0';
        setTimeout(() => {
          agentRoleEl.textContent = displayRole;
          agentRoleEl.style.opacity = '1';
          logger.info('FLOW_UI', 'Agent role updated', { displayRole });
        }, 150);
      } else {
        logger.warn('FLOW_UI', 'Agent role element not found');
      }

      // Update visual companion for agent change
      if (!isInitial) {
        onAgentChange(displayRole);
      }
    });

    // Handle tool results - update progress when tools are called
    flowSession.addEventListener('tool_result', (e) => {
      const { progress, tool_name, result } = e.detail;
      if (progress) {
        updateProgress(progress);
      }
      // Update visual companion with tool data
      if (tool_name && result) {
        onToolCall(tool_name, result);
      }
    });

    // Handle transcripts - both user and assistant
    // Track last messages for visual companion
    let lastUserTranscript = '';
    let lastAssistantTranscript = '';

    flowSession.addEventListener('transcript', (e) => {
      const { type, text, delta, partial, complete } = e.detail;

      if (type === 'user' && text) {
        addTranscript('user', text);
        lastUserTranscript = text;
        // Update visual on user message (debounced internally)
        updateVisual({
          lastUserMessage: text,
          lastAssistantMessage: lastAssistantTranscript,
        });
      } else if (type === 'assistant') {
        // For assistant, use complete text when available, otherwise use partial for streaming
        if (complete && text) {
          addTranscript('assistant', text);
          lastAssistantTranscript = text;
          // Update visual on complete assistant message (debounced internally)
          updateVisual({
            lastUserMessage: lastUserTranscript,
            lastAssistantMessage: text,
          });
        } else if (partial && !currentAssistantMessage) {
          // Start streaming message
          currentAssistantMessage = addTranscript('assistant', partial, true);
        } else if (partial && currentAssistantMessage) {
          // Update streaming message
          updateStreamingTranscript(currentAssistantMessage, partial);
        }
      }
    });

    // Clear streaming message on response done
    flowSession.addEventListener('message', (e) => {
      if (e.detail.type === 'response.done') {
        currentAssistantMessage = null;

        // Also try to extract transcript from response if not already added
        if (e.detail.response?.output) {
          const textContent = e.detail.response.output
            .filter((o) => o.type === 'message')
            .flatMap((o) => o.content || [])
            .filter((c) => c.type === 'text' || c.type === 'audio')
            .map((c) => c.text || c.transcript)
            .filter(Boolean)
            .join(' ');
          // Only add if we have content and don't have a streaming message
          if (textContent && !document.querySelector('.flow-transcript-streaming')) {
            addTranscript('assistant', textContent);
          }
        }
      }
    });

    flowSession.addEventListener('error', (e) => {
      // Don't show error to user - just log it
      logger.error('Flow session error', e.detail);
    });

    await flowSession.connect(audioElement);
  } catch (error) {
    logger.error('Failed to start flow session', { error });
    // Don't show error to user - silently handle
    setIsVoiceChatActive(false);
  }
}

/**
 * End session and show results
 * If auth is required, shows auth gate first
 * For dual-agent mode: token charging is deferred until after quality approval
 */
async function endFlowSession() {
  if (!flowSession) return;

  // Cleanup animation intervals
  if (window._flowAnimIntervals) {
    window._flowAnimIntervals.forEach(interval => clearInterval(interval));
    window._flowAnimIntervals = [];
  }

  // Cleanup visual companion
  destroyVisualCompanion();

  stopTimer();
  const finalData = flowSession.close();
  flowSession = null;
  setIsVoiceChatActive(false);

  // Check if auth is required before showing results
  const needsAuth = requiresAuth(currentFlowConfig);
  const isAuthenticated = isFlowAuthenticated();
  const isDualAgent = currentFlowConfig?.completion_action?.type === 'dual-agent';

  if (needsAuth && !isAuthenticated) {
    // Show auth gate before processing
    // For dual-agent, don't charge in auth gate - charging happens after quality approval
    showAuthGate(
      currentFlowConfig,
      currentSessionId,
      async ({ user, chargeResult }) => {
        // Auth successful, now process and show results
        // For dual-agent, chargeResult will be null (we charge after quality check)
        await processAndShowResults(finalData, isDualAgent ? null : chargeResult);
      },
      currentFlowConfig?.token_cost === 0 ? () => {
        // Skip auth for free flows (demo mode)
        processAndShowResults(finalData, null);
      } : null,
      isDualAgent // Pass isDualAgent flag to auth gate to skip charging
    );
  } else if (isAuthenticated && currentFlowConfig?.token_cost > 0 && !isDualAgent) {
    // Already authenticated, charge tokens then show results
    // Skip for dual-agent - it handles charging after quality approval
    let chargeResult = null;
    try {
      chargeResult = await chargeFlowTokens(currentFlowConfig.flow_id, currentSessionId);
      // Update localStorage with new balance
      if (chargeResult?.new_balance !== undefined) {
        updateFlowUserBalance(chargeResult.new_balance);
      }
    } catch (e) {
      logger.warn('FLOW_MODE', 'Failed to charge tokens', { error: e.message });
    }
    await processAndShowResults(finalData, chargeResult);
  } else {
    // No auth required OR dual-agent mode (will charge after quality check)
    await processAndShowResults(finalData, null);
  }
}

/**
 * Process completion action and show results
 * For dual-agent mode: charges tokens only after quality approval
 * @param {Object} finalData - Collected data from voice session
 * @param {Object|null} chargeResult - Pre-existing charge result (null for dual-agent, which charges after)
 */
async function processAndShowResults(finalData, chargeResult) {
  // Check if there's a completion action
  const completionAction = currentFlowConfig?.completion_action;
  const isDualAgent = completionAction?.type === 'dual-agent';

  if (completionAction && completionAction.type && completionAction.type !== 'none') {
    // Show appropriate processing state based on completion action type
    if (isDualAgent) {
      showProcessingState(currentFlowConfig?.output_schema, 'verifying');
    } else {
      showProcessingState(currentFlowConfig?.output_schema, 'processing');
    }

    try {
      // For dual-agent, show generating state after initial verification message
      if (isDualAgent) {
        setTimeout(() => {
          showProcessingState(currentFlowConfig?.output_schema, 'generating');
        }, 1500);
      }

      // Process completion action - API returns data + pre-rendered HTML
      const result = await processCompletionAction(
        finalData,
        completionAction,
        currentFlowConfig
      );

      const { collectedData, completionResults, html, error, qualityScore, approved, noDataCollected } = result;

      // Handle case where no data was collected
      if (noDataCollected) {
        logger.info('FLOW_MODE', 'No data was collected during session');
        showNoDataCollectedMessage(currentFlowConfig?.output_schema);
        return;
      }

      if (error) {
        logger.warn('FLOW_MODE', 'Completion action had error', { error });
      }

      // For dual-agent mode: charge tokens only if result is approved
      let finalChargeResult = chargeResult;
      if (isDualAgent && isFlowAuthenticated() && currentFlowConfig?.token_cost > 0) {
        if (approved && qualityScore >= 8) {
          logger.info('FLOW_MODE', 'Dual-agent result approved, charging tokens', {
            qualityScore,
            approved,
          });
          try {
            finalChargeResult = await chargeFlowTokens(currentFlowConfig.flow_id, currentSessionId);
            if (finalChargeResult?.new_balance !== undefined) {
              updateFlowUserBalance(finalChargeResult.new_balance);
            }
          } catch (chargeErr) {
            logger.warn('FLOW_MODE', 'Failed to charge tokens after dual-agent approval', {
              error: chargeErr.message,
            });
          }
        } else {
          logger.info('FLOW_MODE', 'Dual-agent result not approved, skipping charge', {
            qualityScore,
            approved,
          });
        }
      }

      // Save result for authenticated users (fire and forget)
      if (isFlowAuthenticated()) {
        logger.info('FLOW_MODE', 'Saving flow result...', {
          flowId: currentFlowConfig.flow_id,
          sessionId: currentSessionId,
          hasCollectedData: !!collectedData,
          hasCompletionResult: !!completionResults,
          hasHtml: !!html,
          qualityScore: qualityScore,
          approved: approved,
        });
        saveFlowResult({
          flowId: currentFlowConfig.flow_id,
          sessionId: currentSessionId,
          collectedData: collectedData,
          completionResult: {
            ...completionResults,
            qualityScore,
            approved,
          },
          renderedHtml: html,
          tokensCharged: finalChargeResult?.amount || 0,
        }).then((saveResult) => {
          logger.info('FLOW_MODE', 'Flow result saved successfully', { resultId: saveResult?.result_id });
        }).catch((err) => {
          logger.error('FLOW_MODE', 'Failed to save result', { error: err.message, stack: err.stack });
          console.error('[Interworky] Failed to save result:', err);
        });
      } else {
        logger.info('FLOW_MODE', 'User not authenticated, skipping result save');
      }

      // Show results with HTML from API (if available)
      showResults(collectedData, currentFlowConfig?.output_schema, html, finalChargeResult, {
        qualityScore,
        approved,
        isDualAgent,
      });
    } catch (err) {
      logger.error('FLOW_MODE', 'Completion action failed', { error: err.message });
      // Fall back to showing just the collected data
      showResults(finalData, currentFlowConfig?.output_schema, null, chargeResult);
    }
  } else {
    // No completion action - save raw collected data
    if (isFlowAuthenticated()) {
      logger.info('FLOW_MODE', 'Saving raw flow result (no completion action)...', {
        flowId: currentFlowConfig.flow_id,
        sessionId: currentSessionId,
        hasData: !!finalData,
      });
      saveFlowResult({
        flowId: currentFlowConfig.flow_id,
        sessionId: currentSessionId,
        collectedData: finalData,
        completionResult: null,
        renderedHtml: null,
        tokensCharged: chargeResult?.amount || 0,
      }).then((result) => {
        logger.info('FLOW_MODE', 'Raw flow result saved successfully', { resultId: result?.result_id });
      }).catch((err) => {
        logger.error('FLOW_MODE', 'Failed to save result', { error: err.message, stack: err.stack });
        console.error('[Interworky] Failed to save result:', err);
      });
    } else {
      logger.info('FLOW_MODE', 'User not authenticated, skipping result save');
    }
    showResults(finalData, currentFlowConfig?.output_schema, null, chargeResult);
  }
}

/**
 * Show message when no data was collected during the session
 * @param {Object} outputSchema - Output schema with theme config
 */
function showNoDataCollectedMessage(outputSchema) {
  if (voiceContainer) voiceContainer.innerHTML = '';
  else return;

  const themeColor = outputSchema?.theme_color || '#57534e';

  const container = createElement(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 40px',
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '300px',
    },
    {}
  );

  // Icon
  const iconContainer = createElement(
    'div',
    {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: '#f5f5f4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
    },
    {}
  );
  iconContainer.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

  // Title
  const title = createElement(
    'h2',
    {
      fontSize: '22px',
      fontWeight: '600',
      color: '#292524',
      margin: '0 0 12px 0',
    },
    { textContent: 'No Data Collected' }
  );

  // Message
  const message = createElement(
    'p',
    {
      fontSize: '15px',
      color: '#78716c',
      margin: '0 0 32px 0',
      lineHeight: '1.6',
      maxWidth: '400px',
    },
    {
      textContent:
        'The session ended before any information was collected. Please start a new session and provide the requested information.',
    }
  );

  // Button to start over
  const startOverBtn = createElement(
    'button',
    {
      padding: '12px 28px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff',
      backgroundColor: themeColor,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    { textContent: 'Start New Session' }
  );
  startOverBtn.addEventListener('click', () => {
    // Close this view and allow starting fresh
    if (voiceContainer) {
      voiceContainer.innerHTML = '';
      voiceContainer.style.display = 'none';
    }
  });
  startOverBtn.addEventListener('mouseenter', () => {
    startOverBtn.style.opacity = '0.9';
    startOverBtn.style.transform = 'scale(1.02)';
  });
  startOverBtn.addEventListener('mouseleave', () => {
    startOverBtn.style.opacity = '1';
    startOverBtn.style.transform = 'scale(1)';
  });

  container.appendChild(iconContainer);
  container.appendChild(title);
  container.appendChild(message);
  container.appendChild(startOverBtn);

  voiceContainer.appendChild(container);
}

/**
 * Show processing state while completion action runs
 * Uses configurable loading messages from output_schema
 * @param {Object} outputSchema - Output schema with loading messages
 * @param {string} phase - Processing phase: 'verifying', 'generating', 'processing'
 */
function showProcessingState(outputSchema, phase = 'processing') {
  if (voiceContainer) voiceContainer.innerHTML = '';
  else return;

  // Phase-specific messages with fallback to output_schema config
  const phaseMessages = {
    verifying: {
      title: 'Verifying...',
      subtitle: 'Checking your information',
      icon: '🔍',
    },
    generating: {
      title: 'Generating...',
      subtitle: 'Creating your personalized results',
      icon: '✨',
    },
    processing: {
      title: outputSchema?.loading_title || 'Processing...',
      subtitle: outputSchema?.loading_subtitle || 'Analyzing your information',
      icon: '⚡',
    },
  };

  const { title: loadingTitle, subtitle: loadingSubtitle, icon } = phaseMessages[phase] || phaseMessages.processing;

  voiceContainer.style.backgroundColor = '#292524';
  voiceContainer.style.display = 'flex';
  voiceContainer.style.alignItems = 'center';
  voiceContainer.style.justifyContent = 'center';

  const processingUI = createElement(
    'div',
    {
      textAlign: 'center',
      padding: '32px',
    },
    { id: 'flow-processing-ui' }
  );

  const spinner = createElement(
    'div',
    {
      width: '40px',
      height: '40px',
      border: '2px solid #3f3f3c',
      borderTop: '2px solid #a8a29e',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 20px',
    },
    {}
  );

  // Add spin animation (only once)
  if (!document.getElementById('flow-spin-animation')) {
    const style = document.createElement('style');
    style.id = 'flow-spin-animation';
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  const title = createElement(
    'h2',
    {
      fontSize: '16px',
      fontWeight: '500',
      color: '#fafaf9',
      marginBottom: '6px',
    },
    { textContent: loadingTitle, id: 'flow-processing-title' }
  );

  const subtitle = createElement(
    'p',
    {
      fontSize: '13px',
      color: '#78716c',
    },
    { textContent: loadingSubtitle, id: 'flow-processing-subtitle' }
  );

  processingUI.appendChild(spinner);
  processingUI.appendChild(title);
  processingUI.appendChild(subtitle);
  voiceContainer.appendChild(processingUI);
}

/**
 * Check if data object has any meaningful content
 */
function hasData(data) {
  if (!data || typeof data !== 'object') return false;
  const keys = Object.keys(data);
  if (keys.length === 0) return false;
  // Check if any key has non-empty array or non-null value
  return keys.some((key) => {
    const value = data[key];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== null && value !== undefined && value !== '';
  });
}

/**
 * Show results - renders HTML from API or falls back to JSON display
 * Full-screen with gradient background, slide animation, centered content
 * @param {Object} data - Collected data
 * @param {Object} outputSchema - Output schema from flow config
 * @param {string} html - Pre-rendered HTML from API (if available)
 * @param {Object} chargeResult - Token charge result (if user was charged)
 */
function showResults(data, outputSchema, html = null, chargeResult = null) {
  if (voiceContainer) voiceContainer.innerHTML = '';
  else return;

  const themeColor = outputSchema?.theme_color || '#57534e';

  // Add result-specific styles and animations
  const resultStyles = document.createElement('style');
  resultStyles.id = 'flow-result-styles';
  resultStyles.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .flow-result-content img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
    .flow-result-content h1, .flow-result-content h2, .flow-result-content h3 {
      color: #292524;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    .flow-result-content h1:first-child, .flow-result-content h2:first-child {
      margin-top: 0;
    }
    .flow-result-content p {
      color: #44403c;
      line-height: 1.7;
      margin-bottom: 1em;
    }
    .flow-result-content ul, .flow-result-content ol {
      padding-left: 1.5em;
      margin-bottom: 1em;
    }
    .flow-result-content li {
      color: #44403c;
      margin-bottom: 0.5em;
      line-height: 1.6;
    }
    .flow-result-content code {
      background: #f5f5f4;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }
    .flow-result-content pre {
      background: #1c1917;
      color: #e7e5e4;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
    .flow-result-content blockquote {
      border-left: 3px solid ${themeColor};
      padding-left: 16px;
      margin: 1em 0;
      color: #57534e;
      font-style: italic;
    }
    .flow-result-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    .flow-result-content th, .flow-result-content td {
      padding: 10px 12px;
      border: 1px solid #e7e5e4;
      text-align: left;
    }
    .flow-result-content th {
      background: #fafaf9;
      font-weight: 600;
    }
    .flow-result-content hr {
      border: none;
      border-top: 1px solid #e7e5e4;
      margin: 2em 0;
    }
  `;
  if (!document.getElementById('flow-result-styles')) {
    document.head.appendChild(resultStyles);
  }

  // Full-screen gradient background - use flex-start to prevent content clipping when scrolling
  voiceContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #fafaf9 0%, #e7e5e4 25%, #d6d3d1 50%, #e7e5e4 75%, #fafaf9 100%);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
    z-index: 10001;
  `;

  // Check if we have any data or HTML
  const hasContent = hasData(data) || html;

  // If no data and no HTML, show empty state
  if (!hasContent) {
    const emptyState = createElement(
      'div',
      {
        textAlign: 'center',
        padding: '48px 40px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        animation: 'slideUp 0.6s ease-out',
      },
      {}
    );

    const emptyIcon = createElement('div', { marginBottom: '20px' }, {});
    emptyIcon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>';

    const emptyTitle = createElement(
      'h2',
      {
        fontSize: '20px',
        fontWeight: '600',
        color: '#292524',
        marginBottom: '10px',
      },
      { textContent: 'No data collected' }
    );

    const emptyText = createElement(
      'p',
      {
        fontSize: '14px',
        color: '#78716c',
        marginBottom: '24px',
        lineHeight: '1.6',
      },
      { textContent: 'The conversation ended before any information was collected.' }
    );

    const restartBtn = createElement(
      'button',
      {
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#fafaf9',
        backgroundColor: '#57534e',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
      { textContent: 'Try again' }
    );
    restartBtn.addEventListener('mouseenter', () => { restartBtn.style.backgroundColor = '#44403c'; });
    restartBtn.addEventListener('mouseleave', () => { restartBtn.style.backgroundColor = '#57534e'; });
    restartBtn.addEventListener('click', () => {
      voiceContainer.remove();
      const startText = document.getElementById('flow-start-text');
      const startBtn = document.getElementById('flow-start-btn');
      if (startText) startText.textContent = "Let's Begin";
      if (startBtn) startBtn.style.opacity = '1';
      if (flowContainer) flowContainer.style.display = 'flex';
    });

    emptyState.appendChild(emptyIcon);
    emptyState.appendChild(emptyTitle);
    emptyState.appendChild(emptyText);
    emptyState.appendChild(restartBtn);
    voiceContainer.appendChild(emptyState);
    return;
  }

  // Main result wrapper - centered with max-width, no maxHeight to prevent action button clipping
  const resultWrapper = createElement(
    'div',
    {
      width: '100%',
      maxWidth: '900px',
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideUp 0.6s ease-out',
      marginTop: '20px',
      marginBottom: '20px',
    },
    {}
  );

  // Result card with glass effect - flex layout ensures actions always visible
  resultContainer = createElement(
    'div',
    {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.97)',
      borderRadius: '20px',
      padding: '0',
      color: '#292524',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
    },
    {}
  );

  // Success header with theme color accent
  const successMessage = outputSchema?.success_message || 'Complete';
  const successBar = createElement(
    'div',
    {
      background: `linear-gradient(135deg, ${themeColor} 0%, ${adjustColor(themeColor, -20)} 100%)`,
      color: '#fff',
      padding: '20px 28px',
      fontSize: '16px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      letterSpacing: '-0.01em',
      flexShrink: '0',
    },
    {}
  );
  successBar.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg><span>${successMessage}</span>`;

  // Content container - scrollable if needed, flex-grow to take available space
  const contentContainer = createElement(
    'div',
    {
      padding: '28px',
      maxHeight: '50vh',
      overflowY: 'auto',
      fontSize: '15px',
      lineHeight: '1.7',
      flexGrow: '1',
      minHeight: '0',
    },
    { className: 'flow-result-content' }
  );

  // Transform raw tool data to renderer-friendly format (used for rendering and actions)
  const rendererType = outputSchema?.type || 'default';
  const renderer = getRenderer(rendererType);
  const rendererData = getRendererData(data, outputSchema);

  logger.debug('FLOW_UI_RENDER', 'Rendering flow output', {
    type: rendererType,
    hasHtml: !!html,
    hasRenderer: !!renderer,
    dataKeys: Object.keys(rendererData),
  });

  if (html) {
    // Use pre-rendered HTML from API
    contentContainer.innerHTML = html;
    // Clean up any inline styles that might conflict
    contentContainer.querySelectorAll('[style]').forEach(el => {
      // Keep necessary styles but ensure readability
      if (el.style.color) {
        const color = el.style.color;
        if (color === 'white' || color === '#fff' || color === '#ffffff') {
          el.style.color = '#292524';
        }
      }
    });
  } else if (renderer && renderer.render) {
    // Use the registered renderer
    const renderedContent = renderer.render(rendererData, outputSchema);
    contentContainer.appendChild(renderedContent);
  } else {
    // Fallback: show cleaned JSON data with better styling
    const jsonDisplay = createElement(
      'pre',
      {
        backgroundColor: '#1c1917',
        color: '#e7e5e4',
        padding: '20px',
        borderRadius: '12px',
        overflow: 'auto',
        fontSize: '13px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        lineHeight: '1.6',
      },
      { textContent: JSON.stringify(rendererData, null, 2) }
    );
    contentContainer.appendChild(jsonDisplay);
  }

  // Action buttons - always visible, never shrink
  const actionsContainer = createElement(
    'div',
    {
      padding: '20px 28px',
      backgroundColor: '#fafaf9',
      borderTop: '1px solid #e7e5e4',
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      flexShrink: '0',
    },
    {}
  );

  // Create action buttons from downloadFormats config
  const downloadFormats = outputSchema?.downloadFormats || ['copy'];

  downloadFormats.forEach((format, index) => {
    const action = getAction(format);
    if (!action) {
      logger.warn('FLOW_UI_001', 'Unknown action format', { format });
      return;
    }

    const isFirst = index === 0;
    const btn = createElement(
      'button',
      {
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '500',
        color: action.textColor || '#fafaf9',
        backgroundColor: isFirst ? themeColor : (action.color || '#57534e'),
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
      {}
    );

    const originalLabel = `${action.icon || ''} ${action.label}`.trim();
    btn.innerHTML = `<span>${originalLabel}</span>`;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    btn.addEventListener('click', async () => {
      try {
        // Use mapped data for actions (downloads, copy, etc.)
        const result = action.handler(rendererData, { output_schema: outputSchema }, currentFlowConfig);

        // Handle async actions (like copy to clipboard)
        if (action.isAsync && result instanceof Promise) {
          await result;
        }

        // Show success feedback
        if (action.successLabel) {
          btn.innerHTML = `<span>${action.successLabel}</span>`;
          setTimeout(() => {
            btn.innerHTML = `<span>${originalLabel}</span>`;
          }, 2000);
        }
      } catch (error) {
        logger.error('FLOW_UI_002', 'Action failed', { format, error: error.message });
      }
    });

    actionsContainer.appendChild(btn);
  });

  // Close button with hover effect
  const closeBtn = createElement(
    'button',
    {
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#57534e',
      backgroundColor: 'transparent',
      border: '1px solid #d6d3d1',
      borderRadius: '10px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    {}
  );
  closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg><span>Close</span>';
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.backgroundColor = '#f5f5f4';
    closeBtn.style.borderColor = '#a8a29e';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.backgroundColor = 'transparent';
    closeBtn.style.borderColor = '#d6d3d1';
  });
  closeBtn.addEventListener('click', () => {
    voiceContainer.remove();
    const startText = document.getElementById('flow-start-text');
    const startBtn = document.getElementById('flow-start-btn');
    if (startText) startText.textContent = "Let's Begin";
    if (startBtn) startBtn.style.opacity = '1';
    if (flowContainer) flowContainer.style.display = 'flex';
  });
  actionsContainer.appendChild(closeBtn);

  // Assemble the result card
  resultContainer.appendChild(successBar);
  resultContainer.appendChild(contentContainer);
  resultContainer.appendChild(actionsContainer);

  // Add result card to wrapper, wrapper to container
  resultWrapper.appendChild(resultContainer);

  // Add post-result UI with balance and CTAs (if user is authenticated)
  if (isFlowAuthenticated()) {
    const postResultUI = createPostResultUI(chargeResult, themeColor);
    resultWrapper.appendChild(postResultUI);
  }

  voiceContainer.appendChild(resultWrapper);
}

/**
 * Create post-result UI with token balance and CTAs
 * @param {Object} chargeResult - Token charge result
 * @param {string} themeColor - Theme color
 */
function createPostResultUI(chargeResult, themeColor) {
  const user = getFlowUser();
  const balance = chargeResult?.new_balance ?? user?.token_balance ?? 0;

  const container = createElement(
    'div',
    {
      marginTop: '16px',
      padding: '20px 24px',
      backgroundColor: 'rgba(255, 255, 255, 0.97)',
      borderRadius: '16px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)',
      animation: 'slideUp 0.5s ease-out 0.2s both',
    },
    {}
  );

  // User info and balance row
  const userRow = createElement(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e7e5e4',
    },
    {}
  );

  // User info
  const userInfo = createElement(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    {}
  );

  const avatar = createElement(
    'div',
    {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: themeColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '600',
    },
    {}
  );

  if (user?.avatar_url) {
    avatar.innerHTML = `<img src="${user.avatar_url}" alt="" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
  } else {
    const initials = user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
    avatar.textContent = initials;
  }

  const userName = createElement(
    'div',
    {
      fontSize: '14px',
      fontWeight: '500',
      color: '#292524',
    },
    { textContent: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'User' }
  );

  userInfo.appendChild(avatar);
  userInfo.appendChild(userName);

  // Token balance
  const balanceContainer = createElement(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: '#f5f5f4',
      padding: '8px 12px',
      borderRadius: '8px',
    },
    {}
  );
  balanceContainer.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${themeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
    <span style="font-size: 13px; font-weight: 600; color: #292524;">${formatTokenBalance(balance)}</span>
    <span style="font-size: 12px; color: #78716c;">tokens</span>
  `;

  userRow.appendChild(userInfo);
  userRow.appendChild(balanceContainer);

  // Charge info (if charged)
  let chargeInfo = null;
  if (chargeResult?.charged && chargeResult?.amount) {
    chargeInfo = createElement(
      'div',
      {
        fontSize: '12px',
        color: '#78716c',
        marginBottom: '16px',
        textAlign: 'center',
      },
      { textContent: `${formatTokenBalance(chargeResult.amount)} tokens used for this flow` }
    );
  }

  // CTAs - stacked vertically for cleaner look
  const ctaContainer = createElement(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    {}
  );

  // Explore More Flows button
  const exploreBtn = createElement(
    'button',
    {
      width: '100%',
      padding: '14px 16px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#fafaf9',
      backgroundColor: themeColor,
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    {}
  );
  exploreBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="14" rx="1"/>
      <rect width="7" height="7" x="3" y="14" rx="1"/>
    </svg>
    <span>More Experiences</span>
  `;
  exploreBtn.addEventListener('mouseenter', () => {
    exploreBtn.style.transform = 'translateY(-1px)';
    exploreBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  });
  exploreBtn.addEventListener('mouseleave', () => {
    exploreBtn.style.transform = 'translateY(0)';
    exploreBtn.style.boxShadow = 'none';
  });
  exploreBtn.addEventListener('click', () => {
    // Navigate to experiences page - use relative path to work on any environment
    window.open('/flow', '_blank');
  });

  // Become a Builder button
  const builderBtn = createElement(
    'button',
    {
      width: '100%',
      padding: '14px 16px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#57534e',
      backgroundColor: 'transparent',
      border: '1px solid #d6d3d1',
      borderRadius: '10px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    {}
  );
  builderBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
    </svg>
    <span>Become a Builder</span>
  `;
  builderBtn.addEventListener('mouseenter', () => {
    builderBtn.style.backgroundColor = '#f5f5f4';
    builderBtn.style.borderColor = '#a8a29e';
  });
  builderBtn.addEventListener('mouseleave', () => {
    builderBtn.style.backgroundColor = 'transparent';
    builderBtn.style.borderColor = '#d6d3d1';
  });
  builderBtn.addEventListener('click', () => {
    // Show builder interest modal
    showBuilderModal();
  });

  ctaContainer.appendChild(exploreBtn);
  ctaContainer.appendChild(builderBtn);

  // Assemble
  container.appendChild(userRow);
  if (chargeInfo) container.appendChild(chargeInfo);
  container.appendChild(ctaContainer);

  return container;
}

/**
 * Format token balance with K/M suffix
 */
function formatTokenBalance(balance) {
  if (balance >= 1000000) {
    return (balance / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (balance >= 1000) {
    return (balance / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return balance.toLocaleString();
}

/**
 * Adjust color brightness
 * @param {string} hex - Hex color
 * @param {number} amount - Amount to adjust (-100 to 100)
 */
function adjustColor(hex, amount) {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Adjust
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));

  // Convert back to hex
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Show Builder Interest Modal - similar to BuilderModal React component
 * Collects name and email, sends to Slack via API
 */
function showBuilderModal() {
  // Check if modal already exists
  if (document.getElementById('flow-builder-modal')) return;

  // Create modal overlay
  const overlay = createElement(
    'div',
    {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(41, 37, 36, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: '10002',
      animation: 'fadeIn 0.2s ease-out',
    },
    { id: 'flow-builder-modal' }
  );

  // Create modal container
  const modal = createElement(
    'div',
    {
      width: '100%',
      maxWidth: '400px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      overflow: 'hidden',
      animation: 'slideUp 0.2s ease-out',
    },
    {}
  );

  // Header
  const header = createElement(
    'div',
    {
      padding: '24px 24px 16px',
    },
    {}
  );

  // Icon
  const iconContainer = createElement(
    'div',
    {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
    },
    {}
  );
  iconContainer.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`;

  const title = createElement(
    'h2',
    {
      fontSize: '18px',
      fontWeight: '600',
      color: '#292524',
      marginBottom: '4px',
    },
    { textContent: 'Become a Builder' }
  );

  const subtitle = createElement(
    'p',
    {
      fontSize: '14px',
      color: '#78716c',
      lineHeight: '1.5',
    },
    { textContent: 'Create your own AI voice flows. Be among the first to build custom experiences.' }
  );

  header.appendChild(iconContainer);
  header.appendChild(title);
  header.appendChild(subtitle);

  // Form
  const form = createElement(
    'form',
    {
      padding: '0 24px 24px',
    },
    {}
  );

  // Name field
  const nameLabel = createElement('label', { display: 'block', marginBottom: '16px' }, {});
  const nameLabelText = createElement(
    'span',
    { display: 'block', fontSize: '13px', fontWeight: '500', color: '#44403c', marginBottom: '6px' },
    { textContent: 'Your name' }
  );
  const nameInput = createElement(
    'input',
    {
      width: '100%',
      padding: '10px 14px',
      fontSize: '14px',
      color: '#292524',
      backgroundColor: '#fafaf9',
      border: '1px solid #d6d3d1',
      borderRadius: '8px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box',
    },
    { type: 'text', placeholder: 'John Doe', id: 'builder-name-input' }
  );
  nameInput.addEventListener('focus', () => {
    nameInput.style.borderColor = '#a8a29e';
    nameInput.style.boxShadow = '0 0 0 3px rgba(168, 162, 158, 0.15)';
  });
  nameInput.addEventListener('blur', () => {
    nameInput.style.borderColor = '#d6d3d1';
    nameInput.style.boxShadow = 'none';
  });
  nameLabel.appendChild(nameLabelText);
  nameLabel.appendChild(nameInput);

  // Email field
  const emailLabel = createElement('label', { display: 'block', marginBottom: '16px' }, {});
  const emailLabelText = createElement(
    'span',
    { display: 'block', fontSize: '13px', fontWeight: '500', color: '#44403c', marginBottom: '6px' },
    { textContent: 'Email address' }
  );
  const emailInput = createElement(
    'input',
    {
      width: '100%',
      padding: '10px 14px',
      fontSize: '14px',
      color: '#292524',
      backgroundColor: '#fafaf9',
      border: '1px solid #d6d3d1',
      borderRadius: '8px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box',
    },
    { type: 'email', placeholder: 'john@example.com', id: 'builder-email-input' }
  );
  emailInput.addEventListener('focus', () => {
    emailInput.style.borderColor = '#a8a29e';
    emailInput.style.boxShadow = '0 0 0 3px rgba(168, 162, 158, 0.15)';
  });
  emailInput.addEventListener('blur', () => {
    emailInput.style.borderColor = '#d6d3d1';
    emailInput.style.boxShadow = 'none';
  });
  emailLabel.appendChild(emailLabelText);
  emailLabel.appendChild(emailInput);

  // Error message container
  const errorMsg = createElement(
    'p',
    {
      fontSize: '13px',
      color: '#dc2626',
      textAlign: 'center',
      marginBottom: '12px',
      display: 'none',
    },
    { id: 'builder-error-msg' }
  );

  // Submit button
  const submitBtn = createElement(
    'button',
    {
      width: '100%',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#fff',
      backgroundColor: '#292524',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    { type: 'submit', id: 'builder-submit-btn' }
  );
  submitBtn.innerHTML = '<span>Get Early Access</span>';
  submitBtn.addEventListener('mouseenter', () => { submitBtn.style.backgroundColor = '#44403c'; });
  submitBtn.addEventListener('mouseleave', () => { submitBtn.style.backgroundColor = '#292524'; });

  // Privacy note
  const privacyNote = createElement(
    'p',
    {
      fontSize: '12px',
      color: '#a8a29e',
      textAlign: 'center',
      marginTop: '12px',
    },
    { textContent: "We'll never share your information with third parties." }
  );

  form.appendChild(nameLabel);
  form.appendChild(emailLabel);
  form.appendChild(errorMsg);
  form.appendChild(submitBtn);
  form.appendChild(privacyNote);

  // Close button
  const closeBtn = createElement(
    'button',
    {
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '32px',
      height: '32px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#a8a29e',
      transition: 'background-color 0.2s, color 0.2s',
    },
    {}
  );
  closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.backgroundColor = '#f5f5f4';
    closeBtn.style.color = '#57534e';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.backgroundColor = 'transparent';
    closeBtn.style.color = '#a8a29e';
  });
  closeBtn.addEventListener('click', () => overlay.remove());

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Close on Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    // Validate
    if (!name) {
      errorMsg.textContent = 'Please enter your name';
      errorMsg.style.display = 'block';
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorMsg.textContent = 'Please enter a valid email';
      errorMsg.style.display = 'block';
      return;
    }

    errorMsg.style.display = 'none';
    submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg><span>Submitting...</span>';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    try {
      // Send to Slack via API
      const { getScriptTags } = await import('../../utils/state');
      const scriptTags = getScriptTags();
      const apiUrl = scriptTags?.apiUrl || 'https://carla.interworky.com/api';

      await fetch(`${apiUrl}/slack/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🚀 New Builder Interest!\n\n👤 Name: ${name}\n📧 Email: ${email}\n\n---\n📍 Source: Flow Widget\n🔗 URL: ${window.location.href}\n⏰ Timestamp: ${new Date().toISOString()}`
        })
      });

      // Show success state
      modal.innerHTML = '';
      const successContent = createElement('div', { padding: '32px', textAlign: 'center' }, {});
      successContent.innerHTML = `
        <div style="width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; background-color: #dcfce7; display: flex; align-items: center; justify-content: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <path d="m9 11 3 3L22 4"/>
          </svg>
        </div>
        <h3 style="font-size: 18px; font-weight: 600; color: #292524; margin-bottom: 8px;">You're on the list!</h3>
        <p style="font-size: 14px; color: #78716c; margin-bottom: 20px;">We'll reach out soon with early access to our builder tools.</p>
        <button id="builder-close-success" style="padding: 10px 20px; font-size: 14px; font-weight: 500; color: #57534e; background-color: #f5f5f4; border: none; border-radius: 8px; cursor: pointer;">Close</button>
      `;
      modal.appendChild(successContent);
      document.getElementById('builder-close-success').addEventListener('click', () => overlay.remove());

    } catch (err) {
      logger.error('FLOW_BUILDER_MODAL', 'Failed to submit builder interest', { error: err.message });
      errorMsg.textContent = 'Something went wrong. Please try again.';
      errorMsg.style.display = 'block';
      submitBtn.innerHTML = '<span>Get Early Access</span>';
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });

  // Assemble modal
  modal.style.position = 'relative';
  modal.appendChild(closeBtn);
  modal.appendChild(header);
  modal.appendChild(form);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Focus name input
  setTimeout(() => nameInput.focus(), 100);
}

// Helper functions
let currentAssistantMessage = null;

/**
 * Update UI based on conversation state
 * Two-state system: Active (animated bars) or Loading (grid animation)
 * - Active: System is ready, user can speak anytime (supports interruptions)
 * - Loading: System is processing, please wait
 */
function updateStateUI(state) {
  const activeContainer = document.getElementById('flow-active-container');
  const loadingContainer = document.getElementById('flow-loading-container');
  const statusLabel = document.getElementById('flow-status-label');

  // Map states to our two-state system
  const isLoading = state === 'thinking' || state === 'connecting';

  if (activeContainer && loadingContainer && statusLabel) {
    if (isLoading) {
      // Loading state - show grid animation
      activeContainer.style.display = 'none';
      loadingContainer.style.display = 'flex';
      statusLabel.textContent = 'Loading';
      statusLabel.style.color = '#78716c';
    } else {
      // Active state - show animated bars
      activeContainer.style.display = 'flex';
      loadingContainer.style.display = 'none';
      statusLabel.textContent = 'Active';
      statusLabel.style.color = '#a8a29e';
    }
  }
}

/**
 * Update the end button when flow data collection is complete
 * Changes from red "End" to green pulsing "See Results"
 */
function updateEndButton(isReady) {
  const endBtn = document.getElementById('flow-end-btn');
  const endText = document.getElementById('flow-end-text');

  if (!endBtn || !endText) return;

  if (isReady) {
    // Add ready class for pulse animation and green color
    endBtn.classList.add('flow-end-ready');

    // Change icon to sparkles and text to "See Results"
    endBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        <path d="M5 3v4"/>
        <path d="M19 17v4"/>
        <path d="M3 5h4"/>
        <path d="M17 19h4"/>
      </svg>
      <span id="flow-end-text">See Results</span>
    `;

    logger.info('FLOW_UI', 'Flow data collection complete - button updated');
  }
}

/**
 * Update progress bar and label
 */
function updateProgress(progress) {
  const fill = document.getElementById('flow-progress-fill');
  const label = document.getElementById('flow-progress-label');

  if (fill) {
    fill.style.width = `${progress.percentage}%`;
  }

  if (label) {
    if (progress.isComplete) {
      label.textContent = 'Complete!';
    } else if (progress.isNearEnd) {
      label.textContent = 'Almost done!';
    } else {
      label.textContent = `${progress.current} of ${progress.total} steps`;
    }
  }

  // Update end button when data collection is complete
  if (progress.isComplete) {
    updateEndButton(true);
  }
}

/**
 * Add transcript message - supports streaming mode
 */
function addTranscript(role, text, isStreaming = false) {
  const container = document.getElementById('flow-transcript');
  if (!container) return null;

  // Remove any existing streaming message if adding a complete one
  if (!isStreaming) {
    const existingStreaming = container.querySelector('.flow-transcript-streaming');
    if (existingStreaming) {
      existingStreaming.remove();
    }
  }

  const entry = document.createElement('div');
  entry.className = 'flow-transcript-entry' + (isStreaming ? ' flow-transcript-streaming' : '');
  entry.style.display = 'flex';
  entry.style.flexDirection = role === 'user' ? 'row-reverse' : 'row';
  entry.style.gap = '10px';
  entry.style.alignItems = 'flex-start';

  const avatar = document.createElement('div');
  avatar.style.width = '28px';
  avatar.style.height = '28px';
  avatar.style.borderRadius = '50%';
  avatar.style.display = 'flex';
  avatar.style.alignItems = 'center';
  avatar.style.justifyContent = 'center';
  avatar.style.fontSize = '14px';
  avatar.style.flexShrink = '0';

  if (role === 'user') {
    avatar.style.backgroundColor = 'rgba(120, 113, 108, 0.3)';
    avatar.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(168, 162, 158, 0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  } else {
    avatar.style.backgroundColor = 'rgba(87, 83, 78, 0.5)';
    avatar.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(214, 211, 209, 0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="m2 14 6 6m0-6-6 6"/><path d="m22 14-6 6m0-6 6 6"/></svg>';
  }

  const bubble = document.createElement('div');
  bubble.className = 'flow-transcript-bubble';
  bubble.style.maxWidth = '80%';
  bubble.style.padding = '10px 14px';
  bubble.style.borderRadius = role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px';
  bubble.style.backgroundColor = role === 'user' ? 'rgba(120, 113, 108, 0.2)' : 'rgba(68, 64, 60, 0.6)';
  bubble.style.color = 'rgba(231, 229, 228, 0.95)';
  bubble.style.fontSize = '13px';
  bubble.style.lineHeight = '1.5';
  bubble.textContent = text;

  entry.appendChild(avatar);
  entry.appendChild(bubble);
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;

  return entry;
}

/**
 * Update a streaming transcript message
 */
function updateStreamingTranscript(entry, text) {
  if (!entry) return;
  const bubble = entry.querySelector('.flow-transcript-bubble');
  if (bubble) {
    bubble.textContent = text;
    const container = document.getElementById('flow-transcript');
    if (container) container.scrollTop = container.scrollHeight;
  }
}

// Transcript folding state
let isTranscriptExpanded = false;
let transcriptCollapseTimer = null;

/**
 * Toggle transcript visibility
 */
function toggleTranscript(manual = true) {
  const transcript = document.getElementById('flow-transcript');
  const viewBtn = document.getElementById('flow-view-conversation-btn');

  if (!transcript) return;

  isTranscriptExpanded = !isTranscriptExpanded;

  if (isTranscriptExpanded) {
    transcript.style.maxHeight = '140px';
    transcript.style.padding = '12px';
    transcript.style.marginTop = '12px';
    if (viewBtn) {
      viewBtn.style.borderColor = '#78716c';
      viewBtn.style.color = '#a8a29e';
    }

    // If manually toggled, don't auto-collapse
    if (manual) {
      clearTimeout(transcriptCollapseTimer);
    }
  } else {
    transcript.style.maxHeight = '0';
    transcript.style.padding = '0 12px';
    transcript.style.marginTop = '0';
    if (viewBtn) {
      viewBtn.style.borderColor = '#57534e';
      viewBtn.style.color = '#78716c';
    }
  }
}

/**
 * Briefly show transcript then auto-collapse
 * Called when user clicks "View Conversation" button
 */
function showTranscriptBriefly() {
  const transcript = document.getElementById('flow-transcript');
  const viewBtn = document.getElementById('flow-view-conversation-btn');
  if (!transcript) return;

  // Show transcript with margin from button
  transcript.style.maxHeight = '140px';
  transcript.style.padding = '12px';
  transcript.style.marginTop = '12px';
  isTranscriptExpanded = true;

  // Update button to show active state
  if (viewBtn) {
    viewBtn.style.borderColor = '#78716c';
    viewBtn.style.color = '#a8a29e';
  }

  // Clear existing timer and set new one for auto-collapse
  clearTimeout(transcriptCollapseTimer);
  transcriptCollapseTimer = setTimeout(() => {
    const transcript = document.getElementById('flow-transcript');
    const viewBtn = document.getElementById('flow-view-conversation-btn');
    if (transcript) {
      transcript.style.maxHeight = '0';
      transcript.style.padding = '0 12px';
      transcript.style.marginTop = '0';
    }
    // Reset button to default state
    if (viewBtn) {
      viewBtn.style.borderColor = '#57534e';
      viewBtn.style.color = '#78716c';
    }
    isTranscriptExpanded = false;
  }, 2000);
}

let isMuted = false;
function toggleMute() {
  if (!flowSession) return;
  isMuted = !isMuted;
  flowSession.mute(isMuted);

  const btn = document.getElementById('flow-mute-btn');
  if (btn) {
    btn.innerHTML = isMuted
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
    btn.style.backgroundColor = isMuted ? 'rgba(185, 28, 28, 0.8)' : 'rgba(68, 64, 60, 0.6)';
    btn.style.borderColor = isMuted ? 'rgba(185, 28, 28, 0.9)' : 'rgba(87, 83, 78, 0.5)';
  }

  // Update status hint
  const hint = document.getElementById('flow-status-hint');
  if (hint) {
    hint.textContent = isMuted ? 'Microphone muted' : "Speak naturally, I'm listening";
  }
}

function updateContainerSize() {
  if (!flowContainer) return;
  if (window.innerWidth <= 480) {
    flowContainer.style.width = '100%';
    flowContainer.style.height = '100%';
    flowContainer.style.right = '0';
    flowContainer.style.top = '0';
    flowContainer.style.borderRadius = '0';
  } else {
    flowContainer.style.width = '450px';
    flowContainer.style.height = 'auto';
    flowContainer.style.minHeight = '400px';
    flowContainer.style.right = '20px';
    flowContainer.style.top = '80px';
    flowContainer.style.borderRadius = '16px';
  }
}

/**
 * Start Flow Mode - entry point
 */
export const startFlowMode = async (flowId) => {
  logger.info('FLOW_MODE', 'Starting Flow Mode', { flowId });

  injectAccessibilityStyles();

  try {
    const flowConfig = await fetchFlowConfig(flowId);
    createFlowStartUI(flowConfig);
  } catch (error) {
    logger.error('FLOW_MODE', 'Failed to load flow', { flowId, error });
    // Show error UI
    const errorContainer = createElement(
      'div',
      {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '20px',
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
      },
      { textContent: `Failed to load flow: ${flowId}` }
    );
    document.body.appendChild(errorContainer);
  }
};

export { createFlowStartUI, startFlowVoice, endFlowSession };
