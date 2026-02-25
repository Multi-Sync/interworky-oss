/**
 * Visual Companion Module
 * Generates and displays dynamic visuals during voice sessions
 * Makes the experience immersive by providing contextual visuals that evolve with conversation
 */

import { createElement } from '../../ui/baseMethods.js';
import logger from '../../../utils/logger.js';

// State
let visualContainer = null;
let currentVisualHtml = null;
let isLoading = false;
let apiBaseUrl = null;
let currentFlowId = null;
let turnNumber = 0;
let collectedData = {};

// Debounce timer to prevent rapid API calls
let debounceTimer = null;
const DEBOUNCE_MS = 1500; // Wait 1.5s after last message before generating

/**
 * Initialize the visual companion
 * @param {string} flowId - The flow ID
 * @param {string} baseUrl - API base URL
 */
export function initVisualCompanion(flowId, baseUrl) {
  currentFlowId = flowId;
  apiBaseUrl = baseUrl || getApiBaseUrl();
  turnNumber = 0;
  collectedData = {};
  currentVisualHtml = null;
  isLoading = false;

  logger.info('VISUAL_COMPANION_001', 'Visual companion initialized', { flowId });
}

/**
 * Get the API base URL from environment or script tag
 */
function getApiBaseUrl() {
  // Check for staging/production
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('staging')) {
      return 'https://staging.interworky.com/api-core';
    }
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'http://localhost:3015';
    }
  }
  return 'https://interworky.com/api-core';
}

/**
 * Create the visual companion container
 * @param {HTMLElement} parentElement - Parent element to append to
 * @param {string} themeColor - Theme color for fallback styling
 * @returns {HTMLElement} The visual container
 */
export function createVisualContainer(parentElement, themeColor = '#3b82f6') {
  if (visualContainer) {
    visualContainer.remove();
  }

  // Add styles
  const styleId = 'visual-companion-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes visualFadeIn {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes visualSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes visualScale {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes visualPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      .visual-companion-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
      }
      .visual-companion-wrapper.transition-fade .visual-content {
        animation: visualFadeIn 0.4s ease-out forwards;
      }
      .visual-companion-wrapper.transition-slide-up .visual-content {
        animation: visualSlideUp 0.4s ease-out forwards;
      }
      .visual-companion-wrapper.transition-scale .visual-content {
        animation: visualScale 0.4s ease-out forwards;
      }
      .visual-loading-indicator {
        position: absolute;
        bottom: 10px;
        right: 10px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${themeColor};
        animation: visualPulse 1s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  visualContainer = createElement(
    'div',
    {
      width: '100%',
      flex: '1',
      minHeight: '200px',
      maxHeight: '45vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: 'transparent',
      borderRadius: '12px',
      margin: '0 0 16px 0',
    },
    { id: 'flow-visual-companion', className: 'visual-companion-wrapper' }
  );

  // Create inner content wrapper
  const contentWrapper = createElement(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    { className: 'visual-content' }
  );

  // Initial placeholder - themed gradient
  contentWrapper.innerHTML = `
    <div style="
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 50%, ${themeColor}22, transparent 70%);
    ">
      <div style="
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${themeColor}33, ${themeColor}11);
        animation: visualPulse 2s ease-in-out infinite;
      "></div>
    </div>
  `;

  visualContainer.appendChild(contentWrapper);

  if (parentElement) {
    parentElement.appendChild(visualContainer);
  }

  logger.info('VISUAL_COMPANION_002', 'Visual container created');
  return visualContainer;
}

/**
 * Update visual based on conversation state
 * Called after each user/assistant turn
 * @param {Object} params - Update parameters
 */
export function updateVisual({
  currentAgent = 'Assistant',
  lastUserMessage = '',
  lastAssistantMessage = '',
  toolCalled = null,
  toolData = null,
}) {
  // Track conversation progress
  turnNumber++;

  // Update collected data if a tool was called
  if (toolCalled && toolData) {
    collectedData[toolCalled] = toolData;
  }

  // Debounce API calls
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    fetchAndRenderVisual({
      currentAgent,
      lastUserMessage,
      lastAssistantMessage,
    });
  }, DEBOUNCE_MS);
}

/**
 * Fetch visual from API and render it
 */
async function fetchAndRenderVisual({
  currentAgent,
  lastUserMessage,
  lastAssistantMessage,
}) {
  if (!currentFlowId || !apiBaseUrl || isLoading) {
    return;
  }

  isLoading = true;
  showLoadingIndicator();

  try {
    const response = await fetch(`${apiBaseUrl}/api/flows/${currentFlowId}/visual-companion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_agent: currentAgent,
        collected_data: collectedData,
        turn_number: turnNumber,
        last_user_message: lastUserMessage,
        last_assistant_message: lastAssistantMessage,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const visual = await response.json();

    logger.info('VISUAL_COMPANION_003', 'Visual received', {
      mood: visual.mood,
      transition: visual.transition,
      focus: visual.focus_element,
    });

    renderVisual(visual);

  } catch (error) {
    logger.error('VISUAL_COMPANION_004', 'Failed to fetch visual', { error: error.message });
    // Keep current visual on error - don't disrupt the experience
  } finally {
    isLoading = false;
    hideLoadingIndicator();
  }
}

/**
 * Render the visual HTML with transition
 * @param {Object} visual - Visual data { html, transition, mood, focus_element }
 */
function renderVisual(visual) {
  if (!visualContainer || !visual.html) {
    return;
  }

  const contentWrapper = visualContainer.querySelector('.visual-content');
  if (!contentWrapper) {
    return;
  }

  // Store current HTML
  currentVisualHtml = visual.html;

  // Apply transition class
  const transitionClass = `transition-${visual.transition || 'fade'}`;
  visualContainer.className = `visual-companion-wrapper ${transitionClass}`;

  // Fade out current content
  contentWrapper.style.opacity = '0';

  setTimeout(() => {
    // Replace content
    contentWrapper.innerHTML = visual.html;

    // Trigger reflow for animation
    contentWrapper.offsetHeight;

    // Fade in new content
    contentWrapper.style.opacity = '1';
  }, 200);
}

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
  if (!visualContainer) return;

  let indicator = visualContainer.querySelector('.visual-loading-indicator');
  if (!indicator) {
    indicator = createElement('div', {}, { className: 'visual-loading-indicator' });
    visualContainer.appendChild(indicator);
  }
  indicator.style.display = 'block';
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
  if (!visualContainer) return;

  const indicator = visualContainer.querySelector('.visual-loading-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

/**
 * Generate initial visual when session starts
 * @param {Object} flowConfig - The flow configuration
 */
export function generateInitialVisual(flowConfig) {
  const themeColor = flowConfig?.output_schema?.theme_color || '#3b82f6';
  const flowName = flowConfig?.name || 'Experience';

  // Trigger initial visual generation after a short delay
  setTimeout(() => {
    updateVisual({
      currentAgent: flowConfig?.agents?.[flowConfig?.start_agent]?.name || 'Assistant',
      lastUserMessage: '',
      lastAssistantMessage: flowConfig?.initial_greeting || 'Welcome!',
    });
  }, 500);
}

/**
 * Handle agent change - update visual with new agent context
 * @param {string} agentName - Name of the new agent
 */
export function onAgentChange(agentName) {
  logger.info('VISUAL_COMPANION_005', 'Agent changed', { agent: agentName });

  // Generate new visual for agent change
  updateVisual({
    currentAgent: agentName,
    lastUserMessage: '',
    lastAssistantMessage: '',
  });
}

/**
 * Handle tool call - track collected data for visual context
 * @param {string} toolName - Name of the tool called
 * @param {Object} toolData - Data from the tool
 */
export function onToolCall(toolName, toolData) {
  collectedData[toolName] = toolData;

  logger.info('VISUAL_COMPANION_006', 'Tool called', { tool: toolName });

  // Generate new visual after data collection
  updateVisual({
    toolCalled: toolName,
    toolData: toolData,
  });
}

/**
 * Cleanup and destroy the visual companion
 */
export function destroyVisualCompanion() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (visualContainer) {
    visualContainer.remove();
    visualContainer = null;
  }

  currentVisualHtml = null;
  isLoading = false;
  turnNumber = 0;
  collectedData = {};
  currentFlowId = null;

  logger.info('VISUAL_COMPANION_007', 'Visual companion destroyed');
}

/**
 * Get current visual HTML (for debugging/testing)
 */
export function getCurrentVisualHtml() {
  return currentVisualHtml;
}

/**
 * Force refresh the visual
 */
export function refreshVisual() {
  fetchAndRenderVisual({
    currentAgent: 'Assistant',
    lastUserMessage: '',
    lastAssistantMessage: '',
  });
}

export default {
  initVisualCompanion,
  createVisualContainer,
  updateVisual,
  generateInitialVisual,
  onAgentChange,
  onToolCall,
  destroyVisualCompanion,
  getCurrentVisualHtml,
  refreshVisual,
};
