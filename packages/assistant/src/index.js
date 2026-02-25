//src/index.js

// Early personalization init - MUST be first import to apply cached personalization before render
import './assistant/personalization/earlyInit';

import { startInterworkyAssistant } from './assistant/index';
import { removeAllChatElements } from './assistant/ui/baseMethods';
import { getScriptTags, setScriptTags } from './assistant/utils/state';
import { fetchScriptTags } from './utils/common';
import packageJson from '../package.json';
import logger from './utils/logger';
import { ERROR_CODES } from './utils/errorCodes';

function printInterworkyVersion() {
  const version = packageJson.version;

  const interworkyText = `
╭─────────────────────╮
 Interworky v${version}
╰─────────────────────╯
`;

  console.log('%c' + interworkyText, 'color: blue; font-weight: bold;');
}

export function initInterworky(config = {}) {
  printInterworkyVersion();
  startInterworkyAssistant(config);
}

if (typeof window !== 'undefined') {
  // Capture initial script source
  const currentScript = document.currentScript;
  const scriptSrc = currentScript?.src;

  window.Interworky = {
    init: (config = {}) => {
      // Check if UI actually exists in DOM (critical check for SPAs like Next.js)
      const chatContainer = document.getElementById(
        'interworky-customer-assistant-popup'
      );
      const assistantContainer = document.getElementById('assistant-container');

      // If UI elements exist, Interworky is truly initialized
      const uiExists = chatContainer || assistantContainer;

      // Check persistent flag (survives page reload within session)
      const persistentInit = sessionStorage.getItem('iw_initialized');
      const lastInitTime = sessionStorage.getItem('iw_init_time');

      // Allow re-init if last init was >1 hour ago (session likely ended)
      const ONE_HOUR = 60 * 60 * 1000;
      if (
        persistentInit &&
        lastInitTime &&
        Date.now() - parseInt(lastInitTime) < ONE_HOUR &&
        uiExists // ✅ CRITICAL: Only skip if UI actually exists
      ) {
        logger.warn(
          ERROR_CODES.INIT_ALREADY_INITIALIZED,
          'Interworky already initialized in this session. Skipping re-initialization.',
          { lastInitTime, uiExists }
        );

        // But still track page view for the new page if analytics exists
        if (
          window.visitorJourneyAnalytics &&
          window.visitorJourneyAnalytics.isEnabled
        ) {
          logger.info(
            ERROR_CODES.INIT_PAGE_VIEW,
            'Tracking page view for new page',
            { url: window.location.href }
          );
          window.visitorJourneyAnalytics.trackPageView();
        }
        return;
      }

      // If persistent flag exists but UI doesn't, clear stale flags
      if (persistentInit && !uiExists) {
        logger.info(
          ERROR_CODES.INIT_STALE_FLAGS,
          'Clearing stale initialization flags (UI was removed)',
          { persistentInit, uiExists }
        );
        sessionStorage.removeItem('iw_initialized');
        sessionStorage.removeItem('iw_init_time');
        window.interworkyInitialized = false;
      }

      // Check if already initialized in current page load
      if (window.interworkyInitialized && uiExists) {
        logger.warn(
          ERROR_CODES.INIT_ALREADY_INITIALIZED,
          'Interworky is already initialized. Skipping duplicate initialization.',
          { uiExists }
        );
        return;
      }

      setScriptTags(fetchScriptTags());
      printInterworkyVersion();

      startInterworkyAssistant(config);

      // Set initialization flags
      window.interworkyInitialized = true;
      sessionStorage.setItem('iw_initialized', 'true');
      sessionStorage.setItem('iw_init_time', Date.now().toString());
    },
    inject: () => {
      // Check if script already exists
      const existingScript = document.getElementById('interworky-script');
      if (existingScript) {
        logger.warn(
          ERROR_CODES.INIT_ALREADY_INITIALIZED,
          'Interworky script already exists in the DOM. Skipping injection.'
        );
        return;
      }

      const script = document.createElement('script');
      script.src = scriptSrc;
      script.id = 'interworky-script';
      script.onload = () => {
        // Only initialize if not already initialized
        if (!window.interworkyInitialized) {
          window.Interworky.init();
        } else {
          logger.warn(
            ERROR_CODES.INIT_ALREADY_INITIALIZED,
            'Interworky is already initialized.'
          );
        }
      };
      document.body.appendChild(script);
    },
    remove: () => {
      // Clean up analytics if exists
      if (window.visitorJourneyAnalytics) {
        window.visitorJourneyAnalytics.destroy();
        window.visitorJourneyAnalytics = null;
      }

      // Clean up performance monitoring if exists
      if (window.performanceMonitoringManager) {
        window.performanceMonitoringManager.destroy();
        window.performanceMonitoringManager = null;
      }

      // Clean up ARIA enhancement engine if exists
      if (window.interworkyARIAEngine) {
        window.interworkyARIAEngine.destroy();
        window.interworkyARIAEngine = null;
      }

      // Clear session storage flags
      sessionStorage.removeItem('iw_initialized');
      sessionStorage.removeItem('iw_init_time');
      sessionStorage.removeItem('iw_journey_id');
      sessionStorage.removeItem('iw_initial_page_tracked');
      sessionStorage.removeItem('iw_perf_initialized');
      sessionStorage.removeItem('iw_perf_init_time');

      // Clear localStorage cache
      localStorage.removeItem('interworky-conversation-cache');

      window.interworkyInitialized = false;
      const script = document.getElementById('interworky-script');
      if (script) script.remove();

      const chat = document.getElementById(
        'interworky-customer-assistant-popup'
      );
      if (chat) chat.remove();
      removeAllChatElements();

      const assistantContainer = document.getElementById('assistant-container');
      if (assistantContainer) assistantContainer.remove();
    },
    reinject: () => {
      window.Interworky.remove();
      window.Interworky.inject();
    },
  };

  // Initialize Interworky on window load only if not already initialized
  if (!getScriptTags() || !getScriptTags().native) {
    window.onload = () => {
      if (!window.interworkyInitialized) {
        window.Interworky.init();
      } else {
        logger.warn(
          ERROR_CODES.INIT_WINDOW_LOAD,
          'Interworky was already initialized on window load.'
        );
      }
    };
  }
}

// Pre-unlock audio on iOS on the first user interaction.
document.addEventListener('touchstart', function unlockAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      // Create a short silent buffer.
      const buffer = audioCtx.createBuffer(1, 1, 22050);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
      // Remove the listener once audio is unlocked.
      document.removeEventListener('touchstart', unlockAudio);
    });
  } else {
    document.removeEventListener('touchstart', unlockAudio);
  }
});
