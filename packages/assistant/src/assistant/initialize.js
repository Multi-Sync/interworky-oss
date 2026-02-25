import {
  floatUpAnimation,
  gradientAnimation,
  loadingAnimation,
  pulse,
  rainbowLetterTrail,
  rotate,
  sentenceGlow,
  shineAnimation,
  sparkleAnimation,
  spin,
  waveKeyframes,
  bounceEntrance,
  gentleBounce,
  glowPulse,
  fadeRotate,
  onlinePulse,
  typingDots,
} from '../styles/animations';

import { getAssistantInfo, getScriptTags } from './utils/state';
import { applyTheme } from '../styles/themeManager';
import visitorJourneyAnalytics from '../utils/analytics/VisitorJourneyAnalytics';
import performanceMonitoringManager from '../utils/performance/performanceMonitoringManager';
import logger from '../utils/logger';

export async function initializeInterworkyAssistant() {
  // Apply styles
  const styleReset = document.createElement('style');
  styleReset.innerHTML = `
    .interworky-customer-assistant-popup *, 
    .interworky-customer-assistant-popup *::before, 
    .interworky-customer-assistant-popup *::after,
    .chat-container *, 
    .chat-container *::before, 
    .chat-container *::after {
      all: unset !important;
      box-sizing: border-box !important;
      font-family: inherit !important;
      color: inherit !important;
    }
  
    .chat-container {
      all: initial !important; /* Resets all inherited styles */
      box-sizing: border-box !important;
      position: relative !important;
      font-family: Arial, sans-serif !important;
      color: black !important;
    }
  `;
  document.head.appendChild(styleReset);
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `${shineAnimation} ${sparkleAnimation} ${waveKeyframes}
  ${sentenceGlow} ${rainbowLetterTrail} ${loadingAnimation}
  ${gradientAnimation} ${spin} ${pulse}
  ${rotate} ${floatUpAnimation}
  ${bounceEntrance} ${gentleBounce} ${glowPulse}
  ${fadeRotate} ${onlinePulse} ${typingDots}`;
  document.head.appendChild(styleSheet);

  applyTheme(getAssistantInfo());

  // Initialize visitor journey analytics if enabled
  await visitorJourneyAnalytics.initialize();

  // Track initial page view (only if this is the first time on this page)
  const pageTracked = sessionStorage.getItem('iw_initial_page_tracked');
  if (!pageTracked) {
    await visitorJourneyAnalytics.trackPageView();
    sessionStorage.setItem('iw_initial_page_tracked', 'true');
  }

  // Make analytics accessible globally for cross-page tracking
  if (typeof window !== 'undefined') {
    window.visitorJourneyAnalytics = visitorJourneyAnalytics;
  }

  // Initialize performance monitoring with organization and assistant IDs
  const assistantInfoData = getAssistantInfo();

  // Check if monitoring is enabled
  const monitoringEnabled =
    assistantInfoData?.monitoring_enabled !== undefined
      ? assistantInfoData.monitoring_enabled
      : false; // Default to false

  if (!monitoringEnabled) {
    logger.info(
      'IW Performance Monitoring',
      'Performance monitoring is disabled in AssistantInfo'
    );
  } else if (assistantInfoData?.organization_id && assistantInfoData?.id) {
    await performanceMonitoringManager.initialize({
      organizationId: assistantInfoData.organization_id,
      assistantId: assistantInfoData.id,
    });
    logger.info(
      'IW Performance Monitoring',
      'Performance monitoring initialized with org and assistant IDs'
    );
  } else {
    logger.warn(
      'IW Performance Monitoring',
      'Performance monitoring skipped: missing organization or assistant ID'
    );
  }

  // Make performance monitoring accessible globally
  if (typeof window !== 'undefined') {
    window.performanceMonitoringManager = performanceMonitoringManager;
  }

  // Check if customer support is enabled before rendering UI
  const cxEnabled =
    assistantInfoData?.cx_enabled !== undefined
      ? assistantInfoData.cx_enabled
      : true;
  if (!cxEnabled) {
    logger.info(
      '[Interworky]',
      'Customer support is disabled - analytics active, UI hidden'
    );
    return; // Exit before rendering UI - analytics already initialized
  }

  // Check for special modes via script tags
  const scriptTags = getScriptTags();
  const isResumeMode = scriptTags?.resumeMode === true;
  const flowId = scriptTags?.flowId;

  if (flowId) {
    // Start Flow Mode (dynamic flows from backend)
    logger.info('[Interworky]', 'Starting in Flow mode', { flowId });
    const { startFlowMode } = await import('./modes/flowEngine');
    startFlowMode(flowId);
  } else if (isResumeMode) {
    // Legacy resume mode - redirect to flow engine with resume-builder flow
    logger.info('[Interworky]', 'Starting Resume Builder via Flow Engine');
    const { startFlowMode } = await import('./modes/flowEngine');
    startFlowMode('resume-builder');
  } else {
    // Default: Customer Assistant Mode
    const { startCustomerAssistantMode } = await import(
      './modes/customerAssistant'
    );
    startCustomerAssistantMode();
  }
}
