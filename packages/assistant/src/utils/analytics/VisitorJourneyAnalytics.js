// src/utils/analytics/VisitorJourneyAnalytics.js
import {
  createVisitorJourney,
  updateVisitorJourney,
  addPageToJourney,
  addConversionEvent,
  addBounceEvent,
  updateSessionStatus,
  getVisitorJourneyBySession,
  syncCriticalDataBeacon,
  getConversionConfig,
  reportValidationFailure,
} from '../api/visitorJourneyApi';
import { getAssistantInfo, getOrgId } from '../../assistant/utils/state';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

/**
 * VisitorJourneyAnalytics - Single Responsibility: Track and manage visitor journey data
 * This class handles all analytics collection for visitor behavior when analytics is enabled
 */
class VisitorJourneyAnalytics {
  constructor() {
    this.journeyId = null;

    // Check if this is a returning visitor BEFORE creating visitor ID
    // This must happen before _getOrCreateVisitorId() creates the ID
    this.isReturning = localStorage.getItem('iw_visitor_id') !== null;

    this.sessionId = this._getOrCreateSessionId();
    this.visitorId = this._getOrCreateVisitorId();
    this.sessionStartTime = new Date();
    this.sessionEndTime = null;
    this.isSessionActive = true; // Track session state explicitly
    this.lastActivityTime = new Date();
    this.pageViews = 0;
    this.interactions = 0;
    this.pages = [];
    this.isEnabled = false;
    this.isInitialized = false;

    // Event queue for handling race conditions
    this.eventQueue = [];
    this.isCreatingJourney = false;

    // Store references for cleanup
    this.activityInterval = null;
    this.scrollTimeout = null;
    this.scrollDepthInterval = null;
    this.periodicSyncInterval = null;
    this.eventListeners = [];

    // Retry mechanism
    this.retryQueue = [];
    this.maxRetries = 3;

    // Store original history methods for restoration
    this.originalPushState = null;
    this.originalReplaceState = null;

    // Track if critical sync is pending
    this.criticalSyncPending = false;
    this.lastSyncTime = Date.now();

    // Conversion config tracking
    this.conversionConfig = null;
    this.conversionElement = null;
    this.conversionListener = null;

    // ========== ENHANCED TRACKING PROPERTIES ==========

    // Per-page time tracking
    this.currentPageStartTime = null;
    this.pageTimeTracking = {
      activeTime: 0,
      totalTime: 0,
      lastActiveTime: null,
      isPageVisible: true,
      visibilityStartTime: null,
    };

    // Enhanced scroll depth tracking with milestones
    this.scrollMilestones = {
      25: false,
      50: false,
      75: false,
      100: false,
    };
    this.scrollDepthTimeout = null;
    this.lastScrollDepth = 0;

    // Comprehensive interaction tracking
    this.interactionCounts = {
      clicks: 0,
      formInteractions: 0,
      scrollInteractions: 0,
      keyboardInteractions: 0,
      customEvents: 0,
      total: 0,
    };
    this.interactionTimeout = null;
    this.lastInteractionTime = null;

    // ========== IMMEDIATE DATA CAPTURE (BEFORE ANY NAVIGATION) ==========
    // Capture page and referrer data immediately in constructor to prevent loss due to SPA navigation
    this.initialPageCapture = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer || null,
      timestamp: new Date().toISOString(),
      urlParams: new URLSearchParams(window.location.search),
    };

    // Capture traffic source immediately
    this.trafficSourceCapture = this._captureTrafficSourceImmediate();
  }

  /**
   * Initialize analytics if enabled in AssistantInfo
   * @returns {Promise<boolean>} Whether analytics was successfully initialized
   */
  async initialize() {
    try {
      const assistantInfo = getAssistantInfo();

      // Check if analytics is enabled
      if (!assistantInfo?.analytics_enabled) {
        logger.info(
          'IW_ANALYTICS_001',
          'Analytics is disabled in AssistantInfo'
        );
        this.isEnabled = false;
        return false;
      }

      this.isEnabled = true;
      logger.info('IW_ANALYTICS_002', 'Analytics is enabled, initializing...');

      // Get or create journey (checks for existing first)
      await this._getOrCreateJourney();

      // Validate captured data
      this._validateCapturedData();

      // Start tracking
      this._setupEventListeners();
      this._startActivityTracking();

      // Setup conversion tracking (fetch config and attach listener)
      await this._setupConversionTracking();

      this.isInitialized = true;
      logger.info('IW_ANALYTICS_003', 'Analytics initialized successfully', {
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        journeyId: this.journeyId,
      });

      return true;
    } catch (error) {
      logger.warn('IW_ANALYTICS_004', 'Failed to initialize analytics', {
        error: error.message,
      });
      this.isEnabled = false;
      return false;
    }
  }

  /**
   * Get existing journey or create new one
   * @private
   */
  async _getOrCreateJourney() {
    this.isCreatingJourney = true;

    try {
      const organizationId = getOrgId();
      if (!organizationId) {
        throw new Error('Organization ID not found');
      }

      // Check if we have a cached journeyId from this session
      const cachedJourneyId = sessionStorage.getItem('iw_journey_id');

      logger.info('IW_ANALYTICS_037', 'Checking for existing journey', {
        cachedJourneyId,
        sessionId: this.sessionId,
      });

      if (cachedJourneyId) {
        // Verify journey still exists on backend (can be active OR inactive)
        try {
          logger.info('IW_ANALYTICS_038', 'Looking up journey by session ID', {
            sessionId: this.sessionId,
          });
          const journey = await getVisitorJourneyBySession(this.sessionId);
          if (journey && journey.session) {
            // Check if journey was recently ended (within last 5 seconds)
            const endTime = journey.session.end_time
              ? new Date(journey.session.end_time)
              : null;
            const timeSinceEnd = endTime
              ? Date.now() - endTime.getTime()
              : null;
            const isRecentlyEnded = timeSinceEnd && timeSinceEnd < 5000; // 5 seconds

            // Resume journey ONLY if it's still active
            // Do NOT reactivate recently ended sessions - create new session instead
            if (journey.session.is_active) {
              this.journeyId = journey.id;
              // Restore journey state from backend
              this.sessionStartTime = new Date(journey.session.start_time);
              this.pageViews = journey.journey?.page_views || 0;
              this.interactions = journey.engagement?.chat_interactions || 0;
              this.pages = journey.journey?.pages || [];
              this.isSessionActive = true;

              logger.info('IW_ANALYTICS_028', 'Resumed existing journey', {
                journeyId: this.journeyId,
                sessionId: this.sessionId,
              });

              // Process queued events
              this._processEventQueue();
              return;
            } else if (isRecentlyEnded) {
              // Session was recently ended - create new session instead of reactivating
              logger.info(
                'IW_ANALYTICS_036',
                'Previous session ended, creating new session instead of reactivating',
                {
                  previousJourneyId: journey.id,
                  timeSinceEnd,
                }
              );
              // Clear invalid cache and create new journey
              sessionStorage.removeItem('iw_journey_id');
              // Will create new journey below
            }
          }
        } catch (error) {
          // Journey not found on backend, create new one
          logger.error(
            'IW_ANALYTICS_029',
            'Failed to lookup journey - will create new',
            {
              cachedJourneyId,
              sessionId: this.sessionId,
              error: error.message,
              stack: error.stack,
            }
          );
          // Clear invalid cache
          sessionStorage.removeItem('iw_journey_id');
        }
      }

      // Create new journey if no active one exists
      await this._createNewJourney();
    } finally {
      this.isCreatingJourney = false;
    }
  }

  /**
   * Create new visitor journey record
   * @private
   */
  async _createNewJourney() {
    try {
      const organizationId = getOrgId();

      // Get location data (now returns a Promise)
      const locationData = await this._getLocation();

      // Use immediately captured entry page data to prevent loss from SPA navigation
      const entry_page = {
        url: this.initialPageCapture.url,
        title: this.initialPageCapture.title,
        timestamp: this.initialPageCapture.timestamp,
      };

      const journeyData = {
        organization_id: organizationId,
        session_id: this.sessionId,
        visitor_id: this.visitorId,
        traffic_source: this._getTrafficSource(), // Now uses this.trafficSourceCapture
        location: locationData,
        device: this._getDeviceInfo(),
        journey: {
          entry_page: entry_page, // Use immediately captured entry page
          current_page: entry_page, // Initialize with entry page
          pages: [],
          total_time_spent: 0,
          page_views: 0, // Will be incremented on first trackPageView
          bounce_rate: false,
        },
        intent: {
          search_queries: [],
          interests: [],
          goals: [],
          urgency: 'medium',
        },
        engagement: {
          is_returning: this._isReturningVisitor(),
          visit_count: this._getVisitCount(),
          last_visit: this._getLastVisit(),
          engagement_score: 0,
          conversion_events: [],
          bounce_events: [],
          form_submissions: 0,
          downloads: 0,
          video_plays: 0,
          chat_interactions: 0,
        },
        session: {
          start_time: this.sessionStartTime,
          end_time: null,
          duration: 0,
          is_active: true,
          last_activity: this.lastActivityTime,
        },
      };

      const response = await createVisitorJourney(journeyData);
      this.journeyId = response.visitorJourney.id;

      // Cache journey ID for this session
      sessionStorage.setItem('iw_journey_id', this.journeyId);

      logger.info('IW_ANALYTICS_005', 'Journey created', {
        journeyId: this.journeyId,
        sessionId: this.sessionId,
      });

      // Immediately update session duration (don't wait 30s for first update)
      // This ensures even short sessions get recorded with accurate duration
      await this._updateEngagementScore();

      // Process queued events
      this._processEventQueue();
    } catch (error) {
      logger.warn('IW_ANALYTICS_030', 'Failed to create new journey', {
        error: error.message,
        stack: error.stack,
      });
      logger.error('IW_ANALYTICS_039', 'Failed to create new journey', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Track chat interaction
   */
  async trackChatInteraction() {
    if (!this.isEnabled) return;

    // Queue event if journey not yet created
    if (!this.journeyId || this.isCreatingJourney) {
      this.eventQueue.push({ type: 'chat_interaction' });
      return;
    }

    try {
      this.interactions++;
      await this._executeWithRetry(async () => {
        await updateVisitorJourney(this.journeyId, {
          'engagement.chat_interactions': this.interactions,
          'session.last_activity': new Date(),
        });
      });
      logger.info('IW_ANALYTICS_006', 'Chat interaction tracked');
    } catch (error) {
      logger.warn('IW_ANALYTICS_007', 'Failed to track chat interaction', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Track page view
   * @param {string} url - The page URL
   * @param {string} title - The page title
   */
  async trackPageView(url, title) {
    if (!this.isEnabled) return;

    // Stop tracking previous page if exists
    if (this.currentPageStartTime) {
      this._stopPageTimeTracking();
    }

    // Start tracking new page
    this._startPageTimeTracking();

    const pageData = {
      url: url || window.location.href,
      title: title || document.title,
      time_spent: 0, // Will be updated as user spends time on page
      scroll_depth: 0, // Will be updated as user scrolls
      interactions: 0, // Will be updated as user interacts
    };

    // Queue event if journey not yet created
    if (!this.journeyId || this.isCreatingJourney) {
      this.eventQueue.push({ type: 'page_view', data: pageData });
      return;
    }

    try {
      this.pages.push(pageData);
      this.pageViews++;

      // Use dedicated endpoint for adding pages
      await this._executeWithRetry(async () => {
        await addPageToJourney(this.journeyId, pageData);
      });

      logger.info('IW_ANALYTICS_008', 'Page view tracked', {
        url: pageData.url,
      });
    } catch (error) {
      logger.warn('IW_ANALYTICS_009', 'Failed to track page view', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Track conversion event
   * @param {string} eventName - The event name
   * @param {number} value - Optional value associated with the event
   */
  async trackConversionEvent(eventName, value = 0, elementContext = null) {
    if (!this.isEnabled) return;

    const conversionData = {
      event: eventName,
      value,
      ...(elementContext && { element_context: elementContext }),
    };

    // Queue event if journey not yet created
    if (!this.journeyId || this.isCreatingJourney) {
      this.eventQueue.push({ type: 'conversion', data: conversionData });
      return;
    }

    try {
      // Use dedicated endpoint for adding conversions
      await this._executeWithRetry(async () => {
        await addConversionEvent(this.journeyId, conversionData);
      });

      logger.info('IW_ANALYTICS_010', 'Conversion event tracked', {
        event: eventName,
        has_context: !!elementContext,
      });
    } catch (error) {
      logger.warn('IW_ANALYTICS_011', 'Failed to track conversion event', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Track bounce event with context for A/B testing
   * @param {string} bounceType - Type of bounce (immediate | quick)
   * @param {string} exitTrigger - What triggered the exit
   * @private
   */
  async trackBounceEvent(bounceType, exitTrigger) {
    if (!this.isEnabled || !this.journeyId) return;

    try {
      const bounceEventData = {
        timestamp: new Date().toISOString(),
        bounce_type: bounceType,
        page_url: window.location.href,
        page_title: document.title,
        session_duration: Math.round(
          (new Date() - this.sessionStartTime) / 1000
        ),
        scroll_depth: this._calculateScrollDepth(),
        device: this._getDeviceInfo(),
        exit_trigger: exitTrigger,
      };

      await this._executeWithRetry(async () => {
        await addBounceEvent(this.journeyId, bounceEventData);
      });

      logger.info('IW_ANALYTICS_040', 'Bounce event tracked', {
        bounceType,
        exitTrigger,
      });
    } catch (error) {
      logger.warn('IW_ANALYTICS_041', 'Failed to track bounce event', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Update engagement score based on activity
   * @private
   */
  async _updateEngagementScore() {
    // GUARD: Don't update if session ended
    if (!this.isEnabled || !this.journeyId || !this.isSessionActive) {
      logger.debug(
        'IW_ANALYTICS_DEBUG',
        'Skipping engagement update - session inactive'
      );
      return;
    }

    try {
      const sessionDuration = this._calculateCurrentDuration();

      // Improved engagement score calculation with diminishing returns (0-100)
      // Components:
      // - Page views: 0-30 points (logarithmic: log(views+1) * 15)
      // - Time spent: 0-30 points (capped at 10 mins: min(duration/20, 30))
      // - Interactions: 0-25 points (logarithmic: log(interactions+1) * 10)
      // - Chat engagement: 0-15 points (chat_interactions * 5, capped)
      const pageScore = Math.min(30, Math.log(this.pageViews + 1) * 15);
      const timeScore = Math.min(30, sessionDuration / 20);
      const interactionScore = Math.min(
        25,
        Math.log(this.interactions + 1) * 10
      );
      const chatScore = Math.min(15, this.interactions * 5);

      const score = Math.round(
        pageScore + timeScore + interactionScore + chatScore
      );

      // CRITICAL: Double-check session is still active before updating
      // (Prevents race condition where session ends while async update is in flight)
      if (!this.isSessionActive) {
        logger.debug(
          'IW_ANALYTICS_DEBUG',
          'Session ended during engagement calculation, aborting update'
        );
        return;
      }

      await this._executeWithRetry(async () => {
        // Triple-check right before update (final safety net)
        if (!this.isSessionActive) {
          logger.debug(
            'IW_ANALYTICS_DEBUG',
            'Session ended before update, aborting'
          );
          return;
        }
        await updateVisitorJourney(this.journeyId, {
          'engagement.engagement_score': score,
          'session.duration': Math.round(sessionDuration),
          'session.last_activity': new Date(),
        });
      });
    } catch (error) {
      logger.warn('IW_ANALYTICS_012', 'Failed to update engagement score', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Clear all intervals to prevent background updates
   * @private
   */
  _clearAllIntervals() {
    // Clear activity interval
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
      logger.debug('IW_ANALYTICS_DEBUG', 'Cleared activity interval');
    }

    // Clear scroll depth interval
    if (this.scrollDepthInterval) {
      clearInterval(this.scrollDepthInterval);
      this.scrollDepthInterval = null;
      logger.debug('IW_ANALYTICS_DEBUG', 'Cleared scroll depth interval');
    }

    // Clear periodic sync interval
    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval);
      this.periodicSyncInterval = null;
      logger.debug('IW_ANALYTICS_DEBUG', 'Cleared periodic sync interval');
    }

    // Clear any timeouts
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }

    if (this.scrollDepthTimeout) {
      clearTimeout(this.scrollDepthTimeout);
      this.scrollDepthTimeout = null;
    }

    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout);
      this.interactionTimeout = null;
    }

    logger.info('IW_ANALYTICS_INTERVALS', 'All intervals and timeouts cleared');
  }

  /**
   * Calculate current session duration safely
   * Uses end time if session has ended, otherwise uses current time
   * @private
   * @returns {number} Duration in seconds
   */
  _calculateCurrentDuration() {
    // If session ended, use the frozen end time
    if (!this.isSessionActive && this.sessionEndTime) {
      return (this.sessionEndTime - this.sessionStartTime) / 1000;
    }

    // Session is active, use current time
    return (new Date() - this.sessionStartTime) / 1000;
  }

  /**
   * End the visitor session
   * @param {string} reason - Reason for ending session
   * @param {boolean} useBeacon - Whether to use sendBeacon for guaranteed delivery
   */
  async endSession(reason = 'natural', useBeacon = false) {
    // GUARD: Check if session already ended
    if (!this.isSessionActive) {
      logger.debug('IW_ANALYTICS_DEBUG', 'Session already ended, skipping');
      return;
    }

    if (!this.isEnabled || !this.journeyId) return;

    try {
      // STEP 1: Mark session as inactive IMMEDIATELY and freeze end time
      this.isSessionActive = false;
      this.sessionEndTime = new Date();

      // STEP 2: Calculate final duration using frozen end time
      const sessionDuration = this._calculateCurrentDuration();

      // STEP 3: Clear all intervals IMMEDIATELY to prevent further updates
      this._clearAllIntervals();

      // Calculate bounce rate: true if only 1 page view and session < 5 minutes (tracks longer single-page sessions)
      const isBounce = this.pageViews <= 1 && sessionDuration < 300;

      // DEBUG: Log bounce detection in endSession
      logger.info('IW_ANALYTICS_DEBUG', 'End session bounce check', {
        isBounce,
        pageViews: this.pageViews,
        sessionDuration: sessionDuration.toFixed(2),
      });

      // Determine bounce type if this is a bounce
      const bounceType = isBounce ? this._determineBounceType() : null;

      // DEBUG: Log bounce type result
      logger.info('IW_ANALYTICS_DEBUG', 'Bounce type determined', {
        bounceType,
        willTrackBounceEvent: !!(isBounce && bounceType),
      });

      // Prepare critical data
      const criticalData = {
        session: {
          is_active: false,
          end_time: new Date().toISOString(),
          duration: Math.round(sessionDuration),
          exit_page: window.location.href,
          exit_reason: reason,
        },
        journey: {
          bounce_rate: isBounce,
        },
        engagement: {
          engagement_score: this._calculateCurrentEngagementScore(),
        },
        // Include bounce event if applicable
        bounce_event:
          isBounce && bounceType
            ? {
                timestamp: new Date().toISOString(),
                bounce_type: bounceType,
                page_url: window.location.href,
                page_title: document.title,
                session_duration: Math.round(sessionDuration),
                scroll_depth: this._calculateScrollDepth(),
                device: this._getDeviceInfo(),
                exit_trigger: reason,
              }
            : null,
      };

      // Use sendBeacon for guaranteed delivery on page unload
      if (useBeacon) {
        const success = syncCriticalDataBeacon(this.journeyId, criticalData);
        logger.info('IW_ANALYTICS_013', 'Session ended via beacon', {
          journeyId: this.journeyId,
          duration: sessionDuration,
          reason,
          isBounce,
          beaconSuccess: success,
        });
        return;
      }

      // Track bounce event if applicable (for regular async calls)
      if (isBounce && bounceType) {
        await this.trackBounceEvent(bounceType, reason);
      }

      // Regular async update for normal session end
      await this._executeWithRetry(async () => {
        await updateSessionStatus(this.journeyId, {
          is_active: false,
          end_time: new Date(),
          duration: Math.round(sessionDuration),
          exit_page: window.location.href,
          exit_reason: reason,
        });

        // Update bounce rate in journey
        await updateVisitorJourney(this.journeyId, {
          'journey.bounce_rate': isBounce,
        });
      });

      logger.info('IW_ANALYTICS_013', 'Session ended', {
        journeyId: this.journeyId,
        duration: sessionDuration,
        reason,
        isBounce,
      });
    } catch (error) {
      logger.warn('IW_ANALYTICS_014', 'Failed to end session', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Setup event listeners for tracking
   * @private
   */
  _setupEventListeners() {
    // Track page visibility changes (tab switching) - Enhanced with time tracking
    const visibilityHandler = () => {
      this._handleVisibilityChange(); // Handle time tracking

      if (document.hidden) {
        // Sync current scroll depth
        this._updateCurrentPageScrollDepth();
        // Use beacon for guaranteed delivery when tab is hidden
        this.endSession('tab_hidden', true);
      } else {
        // Tab became visible again
        // DON'T REACTIVATE SESSION - session is already ended
        // User needs to refresh page to start new session
        if (this.journeyId && !this.isSessionActive) {
          logger.info(
            'IW_ANALYTICS_033',
            'Tab visible but session already ended - not reactivating'
          );
        } else if (this.journeyId && this.isSessionActive) {
          logger.info(
            'IW_ANALYTICS_033',
            'Tab became visible and session still active'
          );
        }
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    this.eventListeners.push({
      target: document,
      type: 'visibilitychange',
      handler: visibilityHandler,
    });

    // Track before unload (page close/refresh)
    const beforeUnloadHandler = () => {
      // Stop page time tracking and sync final data
      this._stopPageTimeTracking();
      // Update current page scroll depth
      this._updateCurrentPageScrollDepth();
      // Use sendBeacon for guaranteed delivery on page unload
      this.endSession('page_unload', true);
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);
    this.eventListeners.push({
      target: window,
      type: 'beforeunload',
      handler: beforeUnloadHandler,
    });

    // Track pagehide (more reliable than beforeunload on mobile)
    const pagehideHandler = () => {
      this._stopPageTimeTracking();
      this._updateCurrentPageScrollDepth();
      this.endSession('page_hide', true);
    };
    window.addEventListener('pagehide', pagehideHandler);
    this.eventListeners.push({
      target: window,
      type: 'pagehide',
      handler: pagehideHandler,
    });

    // Enhanced scroll depth tracking with milestones
    const scrollHandler = () => {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this._updateScrollDepthWithMilestones();
      }, 500);
    };
    window.addEventListener('scroll', scrollHandler);
    this.eventListeners.push({
      target: window,
      type: 'scroll',
      handler: scrollHandler,
    });

    // ========== SPA NAVIGATION DETECTION ==========

    // Store current URL to detect changes
    let currentUrl = window.location.href;

    // Handler for navigation events
    const navigationHandler = () => {
      const newUrl = window.location.href;
      if (newUrl !== currentUrl) {
        logger.info('IW_ANALYTICS_031', 'SPA navigation detected', {
          from: currentUrl,
          to: newUrl,
        });
        currentUrl = newUrl;
        // Track as page view when URL changes
        this.trackPageView();

        // Check for page visit conversion if configured
        if (
          this.conversionConfig &&
          this.conversionConfig.conversion_type === 'page_visit'
        ) {
          this._checkPageVisitConversion();
        }
      }
    };

    // Intercept History API (pushState/replaceState) for SPA routing
    if (typeof history !== 'undefined') {
      // Store original methods
      this.originalPushState = history.pushState;
      this.originalReplaceState = history.replaceState;

      // Wrap pushState
      history.pushState = (...args) => {
        this.originalPushState.apply(history, args);
        navigationHandler();
      };

      // Wrap replaceState
      history.replaceState = (...args) => {
        this.originalReplaceState.apply(history, args);
        navigationHandler();
      };
    }

    // Popstate event (back/forward button)
    window.addEventListener('popstate', navigationHandler);
    this.eventListeners.push({
      target: window,
      type: 'popstate',
      handler: navigationHandler,
    });

    // Hash change (for hash-based routing)
    const hashChangeHandler = () => {
      const newUrl = window.location.href;
      if (newUrl !== currentUrl) {
        logger.info('IW_ANALYTICS_032', 'Hash navigation detected', {
          from: currentUrl,
          to: newUrl,
        });
        currentUrl = newUrl;
        this.trackPageView();
      }
    };
    window.addEventListener('hashchange', hashChangeHandler);
    this.eventListeners.push({
      target: window,
      type: 'hashchange',
      handler: hashChangeHandler,
    });

    // ========== COMPREHENSIVE INTERACTION TRACKING ==========
    this._trackUserInteractions();
  }

  /**
   * Start activity tracking interval
   * @private
   */
  _startActivityTracking() {
    // Update engagement score every 30 seconds
    this.activityInterval = setInterval(() => {
      // CHECK: Only update if session is still active
      if (this.isEnabled && this.journeyId && this.isSessionActive) {
        this._updateEngagementScore();
      } else if (!this.isSessionActive) {
        // Session ended, clear this interval
        logger.debug(
          'IW_ANALYTICS_DEBUG',
          'Activity interval detected inactive session, clearing'
        );
        clearInterval(this.activityInterval);
        this.activityInterval = null;
      }
    }, 30000);

    // Sync scroll depth every 10 seconds
    this.scrollDepthInterval = setInterval(() => {
      if (this.isEnabled && this.journeyId && this.isSessionActive) {
        this._syncScrollDepth();
      } else if (!this.isSessionActive) {
        logger.debug(
          'IW_ANALYTICS_DEBUG',
          'Scroll depth interval detected inactive session, clearing'
        );
        clearInterval(this.scrollDepthInterval);
        this.scrollDepthInterval = null;
      }
    }, 10000);

    // Periodic critical data sync (every 60 seconds as safety net)
    // This ensures data is saved even if user closes tab unexpectedly
    this.periodicSyncInterval = setInterval(() => {
      if (this.isEnabled && this.journeyId && this.isSessionActive) {
        this._periodicCriticalSync();
      } else if (!this.isSessionActive) {
        logger.debug(
          'IW_ANALYTICS_DEBUG',
          'Periodic sync interval detected inactive session, clearing'
        );
        clearInterval(this.periodicSyncInterval);
        this.periodicSyncInterval = null;
      }
    }, 60000); // Every 1 minute
  }

  /**
   * Periodic sync of critical data as safety net
   * Uses regular async API (not beacon) since page is still active
   * @private
   */
  async _periodicCriticalSync() {
    // GUARD: Don't sync if session ended
    if (!this.isEnabled || !this.journeyId || !this.isSessionActive) {
      logger.debug(
        'IW_ANALYTICS_DEBUG',
        'Skipping periodic sync - session inactive'
      );
      return;
    }

    try {
      const sessionDuration = this._calculateCurrentDuration();
      this._updateCurrentPageScrollDepth();

      // CRITICAL: Double-check session is still active before updating
      // (Prevents race condition where session ends while async update is in flight)
      if (!this.isSessionActive) {
        logger.debug(
          'IW_ANALYTICS_DEBUG',
          'Session ended during periodic sync calculation, aborting'
        );
        return;
      }

      await this._executeWithRetry(async () => {
        // Triple-check right before update (final safety net)
        if (!this.isSessionActive) {
          logger.debug(
            'IW_ANALYTICS_DEBUG',
            'Session ended before periodic sync update, aborting'
          );
          return;
        }
        await updateVisitorJourney(this.journeyId, {
          'session.duration': Math.round(sessionDuration),
          'session.last_activity': new Date(),
          'engagement.engagement_score':
            this._calculateCurrentEngagementScore(),
        });
      });

      this.lastSyncTime = Date.now();
      logger.info('IW_ANALYTICS_034', 'Periodic sync completed', {
        journeyId: this.journeyId,
      });
    } catch (error) {
      logger.warn('IW_ANALYTICS_035', 'Periodic sync failed', {
        error: error.message,
      });
    }
  }

  // ========== ENHANCED TRACKING METHODS ==========

  /**
   * Start tracking time spent on current page
   * @private
   */
  _startPageTimeTracking() {
    this.currentPageStartTime = new Date();
    this.pageTimeTracking.visibilityStartTime = new Date();
    this.pageTimeTracking.isPageVisible = true;

    logger.debug('IW_ANALYTICS_050', 'Started page time tracking', {
      startTime: this.currentPageStartTime.toISOString(),
    });
  }

  /**
   * Stop tracking time spent on current page and update page data
   * @private
   */
  _stopPageTimeTracking() {
    if (!this.currentPageStartTime) return;

    const now = new Date();
    const totalTimeSpent = Math.round((now - this.currentPageStartTime) / 1000);

    // Update the last page's time_spent
    if (this.pages.length > 0) {
      const lastPage = this.pages[this.pages.length - 1];
      lastPage.time_spent = totalTimeSpent;
      lastPage.scroll_depth = this._calculateScrollDepth();
      lastPage.interactions = this.interactionCounts.total;

      // Sync updated page data to backend
      this._syncPageData(lastPage);
    }

    logger.debug('IW_ANALYTICS_051', 'Stopped page time tracking', {
      timeSpent: totalTimeSpent,
      scrollDepth: this._calculateScrollDepth(),
      interactions: this.interactionCounts.total,
    });

    this.currentPageStartTime = null;
  }

  /**
   * Handle page visibility changes (tab switching, minimize, etc.)
   * @private
   */
  _handleVisibilityChange() {
    const now = new Date();

    if (document.hidden) {
      // Page became hidden - pause tracking
      if (
        this.pageTimeTracking.isPageVisible &&
        this.pageTimeTracking.visibilityStartTime
      ) {
        const activeTime = now - this.pageTimeTracking.visibilityStartTime;
        this.pageTimeTracking.activeTime += activeTime;
      }
      this.pageTimeTracking.isPageVisible = false;

      logger.debug('IW_ANALYTICS_052', 'Page visibility changed - hidden');
    } else {
      // Page became visible - resume tracking
      this.pageTimeTracking.visibilityStartTime = now;
      this.pageTimeTracking.isPageVisible = true;

      logger.debug('IW_ANALYTICS_053', 'Page visibility changed - visible');
    }
  }

  /**
   * Update scroll depth with milestone tracking
   * @private
   */
  _updateScrollDepthWithMilestones() {
    const currentScrollDepth = this._calculateScrollDepth();

    // Check for milestone achievements
    const milestones = [25, 50, 75, 100];

    for (const milestone of milestones) {
      if (
        currentScrollDepth >= milestone &&
        !this.scrollMilestones[milestone]
      ) {
        this.scrollMilestones[milestone] = true;

        logger.info(
          'IW_ANALYTICS_054',
          `Scroll milestone achieved: ${milestone}%`,
          {
            scrollDepth: currentScrollDepth,
            milestone,
          }
        );

        // Track milestone as conversion event
        this.trackConversionEvent(`scroll_milestone_${milestone}`, milestone);
      }
    }

    // Update current page scroll depth if significant change
    if (Math.abs(currentScrollDepth - this.lastScrollDepth) > 5) {
      this.lastScrollDepth = currentScrollDepth;

      if (this.pages.length > 0) {
        this.pages[this.pages.length - 1].scroll_depth = currentScrollDepth;
      }

      // Throttled sync to backend
      this._throttledScrollSync();
    }
  }

  /**
   * Track user interactions comprehensively
   * @private
   */
  _trackUserInteractions() {
    // Click tracking
    const clickHandler = (event) => {
      this.interactionCounts.clicks++;
      this.interactionCounts.total++;
      this._updateInteractionData();

      // Track specific interaction types
      const target = event.target;
      if (target.tagName === 'BUTTON') {
        this.trackConversionEvent('button_click', 1);
      } else if (target.tagName === 'A') {
        this.trackConversionEvent('link_click', 1);
      }
    };

    // Form interaction tracking
    const formHandler = (event) => {
      this.interactionCounts.formInteractions++;
      this.interactionCounts.total++;
      this._updateInteractionData();

      if (event.type === 'submit') {
        this.trackConversionEvent('form_submit', 1);
      }
    };

    // Keyboard interaction tracking
    const keyboardHandler = (event) => {
      // Only track meaningful keyboard interactions
      if (['Enter', 'Space', 'Tab', 'Escape'].includes(event.key)) {
        this.interactionCounts.keyboardInteractions++;
        this.interactionCounts.total++;
        this._updateInteractionData();
      }
    };

    // Add event listeners
    document.addEventListener('click', clickHandler, { passive: true });
    document.addEventListener('submit', formHandler, { passive: true });
    document.addEventListener('keydown', keyboardHandler, { passive: true });

    // Store references for cleanup
    this.eventListeners.push(
      { target: document, type: 'click', handler: clickHandler },
      { target: document, type: 'submit', handler: formHandler },
      { target: document, type: 'keydown', handler: keyboardHandler }
    );
  }

  /**
   * Update interaction data and sync to backend
   * @private
   */
  _updateInteractionData() {
    this.lastInteractionTime = new Date();

    // Update current page interaction count
    if (this.pages.length > 0) {
      this.pages[this.pages.length - 1].interactions =
        this.interactionCounts.total;
    }

    // Throttled sync to backend
    clearTimeout(this.interactionTimeout);
    this.interactionTimeout = setTimeout(() => {
      this._syncInteractionData();
    }, 1000); // Sync after 1 second of inactivity
  }

  /**
   * Sync page data to backend
   * @private
   */
  async _syncPageData(pageData) {
    if (
      !this.isEnabled ||
      !this.journeyId ||
      this.pages.length === 0 ||
      !this.isSessionActive
    )
      return;

    try {
      const pageIndex = this.pages.length - 1;
      await this._executeWithRetry(async () => {
        // Check session is still active before update
        if (!this.isSessionActive) {
          logger.debug(
            'IW_ANALYTICS_DEBUG',
            'Session ended before page data sync, aborting'
          );
          return;
        }
        await updateVisitorJourney(this.journeyId, {
          [`journey.pages.${pageIndex}.time_spent`]: pageData.time_spent,
          [`journey.pages.${pageIndex}.scroll_depth`]: pageData.scroll_depth,
          [`journey.pages.${pageIndex}.interactions`]: pageData.interactions,
        });
      });

      logger.debug('IW_ANALYTICS_055', 'Page data synced', {
        timeSpent: pageData.time_spent,
        scrollDepth: pageData.scroll_depth,
        interactions: pageData.interactions,
      });
    } catch (error) {
      logger.warn('IW_ANALYTICS_056', 'Failed to sync page data', {
        error: error.message,
      });
    }
  }

  /**
   * Throttled scroll depth sync
   * @private
   */
  _throttledScrollSync() {
    clearTimeout(this.scrollDepthTimeout);
    this.scrollDepthTimeout = setTimeout(() => {
      if (this.pages.length > 0) {
        this._syncPageData(this.pages[this.pages.length - 1]);
      }
    }, 2000); // Sync after 2 seconds of scroll inactivity
  }

  /**
   * Sync interaction data to backend
   * @private
   */
  async _syncInteractionData() {
    if (!this.isEnabled || !this.journeyId || !this.isSessionActive) return;

    try {
      await this._executeWithRetry(async () => {
        // Check session is still active before update
        if (!this.isSessionActive) {
          logger.debug(
            'IW_ANALYTICS_DEBUG',
            'Session ended before interaction data sync, aborting'
          );
          return;
        }
        await updateVisitorJourney(this.journeyId, {
          'engagement.interaction_counts': this.interactionCounts,
          'session.last_activity': new Date(),
        });
      });

      logger.debug('IW_ANALYTICS_057', 'Interaction data synced', {
        totalInteractions: this.interactionCounts.total,
      });
    } catch (error) {
      logger.warn('IW_ANALYTICS_058', 'Failed to sync interaction data', {
        error: error.message,
      });
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Calculate current engagement score without updating backend
   * @private
   * @returns {number} Current engagement score (0-100)
   */
  _calculateCurrentEngagementScore() {
    const sessionDuration = this._calculateCurrentDuration();

    const pageScore = Math.min(30, Math.log(this.pageViews + 1) * 15);
    const timeScore = Math.min(30, sessionDuration / 20);
    const interactionScore = Math.min(25, Math.log(this.interactions + 1) * 10);
    const chatScore = Math.min(15, this.interactions * 5);

    return Math.round(pageScore + timeScore + interactionScore + chatScore);
  }

  /**
   * Update scroll depth for current page
   * @private
   */
  _updateCurrentPageScrollDepth() {
    if (this.pages.length > 0) {
      const currentScrollDepth = this._calculateScrollDepth();
      this.pages[this.pages.length - 1].scroll_depth = currentScrollDepth;
    }
  }

  /**
   * Determine bounce type based on session metrics
   * @private
   * @returns {string|null} Bounce type or null if not a bounce
   */
  _determineBounceType() {
    const sessionDuration = this._calculateCurrentDuration();
    const scrollDepth = this._calculateScrollDepth();

    // DEBUG: Log actual values for troubleshooting
    logger.info('IW_ANALYTICS_DEBUG', 'Bounce detection check', {
      sessionDuration: sessionDuration.toFixed(2),
      scrollDepth: scrollDepth,
      pageViews: this.pageViews,
    });

    // Not a bounce if multiple pages viewed
    if (this.pageViews > 1) {
      logger.info('IW_ANALYTICS_DEBUG', 'Not a bounce: multiple pages viewed');
      return null;
    }

    // Immediate bounce: <3 seconds, <10% scroll
    if (sessionDuration < 3 && scrollDepth < 10) {
      logger.info('IW_ANALYTICS_DEBUG', 'Bounce type: immediate');
      return 'immediate';
    }

    // Quick bounce: 3-300 seconds (5 min), <50% scroll (low engagement even over time)
    if (sessionDuration < 300 && scrollDepth < 50) {
      logger.info('IW_ANALYTICS_DEBUG', 'Bounce type: quick');
      return 'quick';
    }

    // Not a bounce (5min+ OR 50%+ scroll = engaged user)
    logger.info('IW_ANALYTICS_DEBUG', 'Not a bounce: engaged session');
    return null;
  }

  _getOrCreateSessionId() {
    try {
      // Try sessionStorage first (cleared on tab close)
      let sessionId = sessionStorage.getItem('iw_session_id');

      if (sessionId) {
        logger.info(
          'IW_ANALYTICS_040',
          'Retrieved session ID from sessionStorage',
          {
            sessionId: sessionId.substring(0, 8) + '...',
          }
        );
      } else {
        logger.info(
          'IW_ANALYTICS_041',
          'No session ID in sessionStorage, checking localStorage'
        );

        // Fallback to localStorage with expiration (persists across pages)
        const stored = localStorage.getItem('iw_session_data');
        if (stored) {
          try {
            const { id, timestamp } = JSON.parse(stored);
            const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
            const age = Date.now() - timestamp;

            // Reuse session if within timeout window
            if (age < SESSION_TIMEOUT) {
              sessionId = id;
              sessionStorage.setItem('iw_session_id', sessionId);
              // Update timestamp to extend session
              localStorage.setItem(
                'iw_session_data',
                JSON.stringify({
                  id: sessionId,
                  timestamp: Date.now(),
                })
              );
              logger.info(
                'IW_ANALYTICS_042',
                'Restored session ID from localStorage',
                {
                  sessionId: sessionId.substring(0, 8) + '...',
                  age: Math.round(age / 1000) + 's',
                }
              );
            } else {
              logger.info('IW_ANALYTICS_043', 'Session expired', {
                age: Math.round(age / 1000) + 's',
                timeout: SESSION_TIMEOUT / 1000 + 's',
              });
            }
          } catch (error) {
            logger.warn('IW_ANALYTICS_027', 'Failed to parse session data', {
              error: error.message,
            });
          }
        }
      }

      // Create new session if none exists or expired
      if (!sessionId) {
        sessionId = uuidv4();
        sessionStorage.setItem('iw_session_id', sessionId);
        localStorage.setItem(
          'iw_session_data',
          JSON.stringify({
            id: sessionId,
            timestamp: Date.now(),
          })
        );
        logger.info('IW_ANALYTICS_044', 'Created new session ID', {
          sessionId: sessionId.substring(0, 8) + '...',
        });
      }

      return sessionId;
    } catch (error) {
      logger.warn('IW_ANALYTICS_045', 'Error in _getOrCreateSessionId', {
        error: error.message,
      });
      // Fallback: create session ID without storage
      return uuidv4();
    }
  }

  _getOrCreateVisitorId() {
    try {
      let visitorId = localStorage.getItem('iw_visitor_id');

      if (visitorId) {
        logger.info(
          'IW_ANALYTICS_046',
          'Retrieved visitor ID from localStorage',
          {
            visitorId: visitorId.substring(0, 8) + '...',
            isReturning: true,
          }
        );
      } else {
        visitorId = uuidv4();
        localStorage.setItem('iw_visitor_id', visitorId);
        logger.info('IW_ANALYTICS_047', 'Created new visitor ID', {
          visitorId: visitorId.substring(0, 8) + '...',
          isReturning: false,
        });
      }

      return visitorId;
    } catch (error) {
      logger.warn('IW_ANALYTICS_048', 'Error in _getOrCreateVisitorId', {
        error: error.message,
      });
      // Fallback: create visitor ID without storage
      return uuidv4();
    }
  }

  _getTrafficSource() {
    // Use the immediately captured traffic source from constructor
    return (
      this.trafficSourceCapture || {
        type: 'direct',
        source: null,
        medium: null,
        campaign: null,
        keyword: null,
      }
    );
  }

  /**
   * Capture traffic source immediately in constructor (before any navigation)
   * @private
   * @returns {Object} Traffic source data
   */
  _captureTrafficSourceImmediate() {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer;

    // Check for UTM parameters (campaign tracking)
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    const utmTerm =
      urlParams.get('utm_term') ||
      urlParams.get('q') ||
      urlParams.get('keyword');

    // If UTM params exist, use them
    if (utmSource) {
      return {
        type: this._classifyTrafficType(utmSource, utmMedium),
        source: utmSource,
        medium: utmMedium || 'unknown',
        campaign: utmCampaign || null,
        keyword: utmTerm || null,
      };
    }

    // Otherwise, parse referrer
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        const referrerHost = referrerUrl.hostname;

        // Check if same domain (internal)
        if (referrerHost === window.location.hostname) {
          return {
            type: 'internal',
            source: 'internal',
            medium: 'referral',
            campaign: null,
            keyword: null,
          };
        }

        // Classify external referrer
        const classification = this._classifyReferrer(referrerHost);
        return {
          type: classification.type,
          source: referrerHost,
          medium: classification.medium,
          campaign: null,
          keyword: this._extractSearchKeyword(referrerUrl),
        };
      } catch (e) {
        logger.warn('IW_ANALYTICS_100', 'Failed to parse referrer', {
          error: e.message,
        });
      }
    }

    // No referrer = direct traffic
    return {
      type: 'direct',
      source: '(direct)',
      medium: 'none',
      campaign: null,
      keyword: null,
    };
  }

  /**
   * Classify referrer hostname to determine traffic type
   * @private
   * @param {string} hostname - Referrer hostname
   * @returns {Object} Classification with type and medium
   */
  _classifyReferrer(hostname) {
    const lowerHost = hostname.toLowerCase();

    // Search engines
    const searchEngines = [
      'google',
      'bing',
      'yahoo',
      'duckduckgo',
      'baidu',
      'yandex',
      'ask',
      'aol',
      'ecosia',
    ];
    if (searchEngines.some((se) => lowerHost.includes(se))) {
      return { type: 'search', medium: 'organic' };
    }

    // Social media
    const socialSites = [
      'facebook',
      'fb.com',
      'twitter',
      't.co',
      'linkedin',
      'instagram',
      'tiktok',
      'youtube',
      'reddit',
      'pinterest',
      'snapchat',
      'whatsapp',
      'telegram',
    ];
    if (socialSites.some((s) => lowerHost.includes(s))) {
      return { type: 'social', medium: 'social' };
    }

    // Email clients
    const emailClients = ['mail.google', 'outlook', 'yahoo.mail', 'protonmail'];
    if (emailClients.some((e) => lowerHost.includes(e))) {
      return { type: 'email', medium: 'email' };
    }

    // Default to referral
    return { type: 'referral', medium: 'referral' };
  }

  /**
   * Extract search keyword from referrer URL
   * @private
   * @param {URL} referrerUrl - Parsed referrer URL
   * @returns {string|null} Search keyword if found
   */
  _extractSearchKeyword(referrerUrl) {
    const params = new URLSearchParams(referrerUrl.search);

    // Google/Bing use 'q'
    const q = params.get('q');
    if (q) return q;

    // Yahoo uses 'p'
    const p = params.get('p');
    if (p) return p;

    // DuckDuckGo uses 'q'
    // Baidu uses 'wd'
    const wd = params.get('wd');
    if (wd) return wd;

    return null;
  }

  /**
   * Classify traffic type based on source and medium
   * @private
   * @param {string} source - Traffic source
   * @param {string} medium - Traffic medium
   * @returns {string} Traffic type (paid, social, email, search, referral, other)
   */
  _classifyTrafficType(source, medium) {
    if (!source) return 'direct';

    const lowerSource = source.toLowerCase();
    const lowerMedium = (medium || '').toLowerCase();

    // Paid traffic
    if (
      lowerMedium.includes('cpc') ||
      lowerMedium.includes('ppc') ||
      lowerMedium.includes('paid') ||
      lowerMedium.includes('ad')
    ) {
      return 'paid';
    }

    // Social
    if (
      lowerMedium === 'social' ||
      ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok'].some((s) =>
        lowerSource.includes(s)
      )
    ) {
      return 'social';
    }

    // Email
    if (
      lowerMedium === 'email' ||
      lowerSource.includes('email') ||
      lowerSource.includes('newsletter')
    ) {
      return 'email';
    }

    // Organic search
    if (
      lowerMedium === 'organic' ||
      ['google', 'bing', 'yahoo', 'duckduckgo'].some((s) =>
        lowerSource.includes(s)
      )
    ) {
      return 'search';
    }

    // Referral
    if (lowerMedium === 'referral') {
      return 'referral';
    }

    return 'other';
  }

  /**
   * Validate that critical data was captured successfully
   * Logs warnings if data is missing to help diagnose collection issues
   * @private
   */
  _validateCapturedData() {
    const issues = [];

    if (
      !this.trafficSourceCapture.source ||
      this.trafficSourceCapture.source === '(direct)'
    ) {
      if (document.referrer) {
        issues.push('Referrer exists but not captured properly');
      }
    }

    if (!this.initialPageCapture.url) {
      issues.push('Entry page URL not captured');
    }

    if (!this.initialPageCapture.title) {
      issues.push('Entry page title not captured');
    }

    if (issues.length > 0) {
      logger.warn('IW_ANALYTICS_101', 'Data capture issues detected', {
        issues,
        trafficSource: this.trafficSourceCapture,
        entryPage: this.initialPageCapture,
      });
    } else {
      logger.info('IW_ANALYTICS_102', 'Data captured successfully', {
        source: this.trafficSourceCapture.source,
        type: this.trafficSourceCapture.type,
        entryPage: this.initialPageCapture.url,
      });
    }
  }

  /**
   * Enhanced location detection using browser geolocation API
   * Returns a promise-based location object with fallbacks
   * @private
   * @returns {Promise<Object>} Location data with geolocation if available
   */
  async _getLocation() {
    let baseLocation;

    try {
      // Call ipapi.co for IP-based geolocation
      // Free tier: 1,000 requests/day, no API key required
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const geoData = await response.json();

        // Check if we got an error response (rate limit, etc.)
        if (geoData.error) {
          logger.warn(
            'IW_ANALYTICS_LOCATION_007',
            'IP geolocation API returned error',
            {
              error: geoData.reason || geoData.error,
            }
          );
          return baseLocation;
        }

        const enhancedLocation = {
          country: geoData.country || geoData.country_name || null,
          country_code: geoData.country_code || null,
          region: null,
          city: null,
          timezone: geoData.timezone || baseLocation.timezone,
          latitude: null,
          longitude: null,
          accuracy: null,
          source: 'ipapi',
        };

        return enhancedLocation;
      } else {
        logger.warn(
          'IW_ANALYTICS_LOCATION_008',
          'IP geolocation API request failed',
          {
            status: response.status,
            statusText: response.statusText,
          }
        );
      }
    } catch (error) {
      // Handle timeout, network errors, or other issues
      if (error.name === 'AbortError') {
        logger.warn(
          'IW_ANALYTICS_LOCATION_009',
          'IP geolocation request timed out',
          {
            timeout: '3000ms',
          }
        );
      } else {
        logger.warn(
          'IW_ANALYTICS_LOCATION_010',
          'IP geolocation failed, using fallback',
          {
            error: error.message,
          }
        );
      }
    }

    // Fallback to timezone-only data
    return baseLocation;
  }

  _getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = 'desktop';

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      deviceType = 'tablet';
    } else if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      deviceType = 'mobile';
    }

    return {
      type: deviceType,
      browser: this._getBrowserName(),
      os: this._getOSName(),
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
    };
  }

  _getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  _getOSName() {
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  _getCurrentPage() {
    return {
      url: window.location.href,
      title: document.title,
      timestamp: new Date(),
    };
  }

  _calculateScrollDepth() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    return Math.min(100, Math.max(0, Math.round(scrollPercent)));
  }

  _isReturningVisitor() {
    // Use the value determined in constructor (before visitor ID was created)
    return this.isReturning;
  }

  _getVisitCount() {
    const count = parseInt(localStorage.getItem('iw_visit_count') || '0', 10);
    localStorage.setItem('iw_visit_count', (count + 1).toString());
    return count + 1;
  }

  _getLastVisit() {
    const lastVisit = localStorage.getItem('iw_last_visit');
    localStorage.setItem('iw_last_visit', new Date().toISOString());
    return lastVisit ? new Date(lastVisit) : null;
  }

  /**
   * Process queued events after journey creation
   * @private
   */
  _processEventQueue() {
    if (this.eventQueue.length === 0) return;

    logger.info('IW_ANALYTICS_020', 'Processing queued events', {
      count: this.eventQueue.length,
    });

    const queue = [...this.eventQueue];
    this.eventQueue = [];

    queue.forEach((event) => {
      switch (event.type) {
        case 'chat_interaction':
          this.trackChatInteraction();
          break;
        case 'page_view':
          this.trackPageView(event.data.url, event.data.title);
          break;
        case 'conversion':
          this.trackConversionEvent(event.data.event, event.data.value);
          break;
        default:
          logger.warn('IW_ANALYTICS_021', 'Unknown event type in queue', {
            type: event.type,
          });
      }
    });
  }

  /**
   * Execute API call with retry mechanism
   * @private
   * @param {Function} apiCall - The API call to execute
   * @param {number} retryCount - Current retry attempt
   */
  async _executeWithRetry(apiCall, retryCount = 0) {
    try {
      await apiCall();
    } catch (error) {
      if (retryCount < this.maxRetries) {
        logger.info('IW_ANALYTICS_022', 'Retrying API call', {
          attempt: retryCount + 1,
          maxRetries: this.maxRetries,
        });

        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retryCount) * 1000)
        );

        return this._executeWithRetry(apiCall, retryCount + 1);
      } else {
        logger.warn('IW_ANALYTICS_023', 'API call failed after max retries', {
          error: error.message,
          stack: error.stack,
        });
        logger.error('IW_ANALYTICS_999', 'API call failed', {
          error: error.message,
          stack: error.stack,
        });
      }
    }
  }

  /**
   * Sync current scroll depth to backend
   * @private
   */
  async _syncScrollDepth() {
    if (
      !this.isEnabled ||
      !this.journeyId ||
      this.pages.length === 0 ||
      !this.isSessionActive
    )
      return;

    try {
      const currentPage = this.pages[this.pages.length - 1];
      const currentScrollDepth = this._calculateScrollDepth();

      // Only sync if scroll depth changed significantly (>5%)
      if (Math.abs(currentScrollDepth - currentPage.scroll_depth) > 5) {
        currentPage.scroll_depth = currentScrollDepth;

        await this._executeWithRetry(async () => {
          // Check session is still active before update
          if (!this.isSessionActive) {
            logger.debug(
              'IW_ANALYTICS_DEBUG',
              'Session ended before scroll depth sync, aborting'
            );
            return;
          }
          await updateVisitorJourney(this.journeyId, {
            [`journey.pages.${this.pages.length - 1}.scroll_depth`]:
              currentScrollDepth,
          });
        });
      }
    } catch (error) {
      logger.warn('IW_ANALYTICS_024', 'Failed to sync scroll depth', {
        error: error.message,
      });
    }
  }

  /**
   * Setup conversion tracking by fetching config and attaching listener
   * @private
   */
  async _setupConversionTracking() {
    try {
      const organizationId = getOrgId();
      if (!organizationId) {
        logger.warn(
          'IW_ANALYTICS_CONV_001',
          'Cannot setup conversion tracking: no organization ID'
        );
        return;
      }

      // Fetch the active conversion config
      logger.info(
        'IW_ANALYTICS_CONV_002',
        'Fetching conversion config for organization',
        { org_id: organizationId }
      );
      this.conversionConfig = await getConversionConfig(organizationId);

      if (!this.conversionConfig) {
        logger.info(
          'IW_ANALYTICS_CONV_003',
          'No active conversion config found - skipping conversion tracking'
        );
        return;
      }

      logger.info(
        'IW_ANALYTICS_CONV_004',
        'Conversion config loaded successfully',
        {
          conversion_name: this.conversionConfig.conversion_name,
          conversion_type: this.conversionConfig.conversion_type || 'button',
          selector: this.conversionConfig.element_selector,
          page_url: this.conversionConfig.page_url,
        }
      );

      // Attach listener based on conversion type
      if (this.conversionConfig.conversion_type === 'page_visit') {
        this._attachPageVisitListener();
      } else {
        // Default to button tracking for backward compatibility
        this._attachConversionListener();
      }
    } catch (error) {
      logger.error(
        'IW_ANALYTICS_CONV_005',
        'Failed to setup conversion tracking',
        {
          error: error.message,
          stack: error.stack,
        }
      );
    }
  }

  /**
   * Attach click listener to the configured conversion element
   * @private
   */
  _attachConversionListener() {
    if (!this.conversionConfig) return;

    try {
      // Find the element using the configured selector
      this.conversionElement = document.querySelector(
        this.conversionConfig.element_selector
      );

      if (!this.conversionElement) {
        // Element not found - log warning and report to backend
        const errorMessage = `Element not found for selector: ${this.conversionConfig.element_selector}`;
        logger.warn('IW_ANALYTICS_CONV_006', errorMessage, {
          selector: this.conversionConfig.element_selector,
          page_url: window.location.href,
        });

        // Report validation failure to backend
        const organizationId = getOrgId();
        if (organizationId) {
          reportValidationFailure(organizationId, {
            page_url: window.location.href,
            selector: this.conversionConfig.element_selector,
            error_message: errorMessage,
            timestamp: new Date().toISOString(),
          }).catch((err) => {
            logger.error(
              'IW_ANALYTICS_CONV_007',
              'Failed to report validation failure',
              { error: err.message }
            );
          });
        }

        return;
      }

      // Element found - attach click listener
      this.conversionListener = this._handleConversionClick.bind(this);
      this.conversionElement.addEventListener('click', this.conversionListener);

      logger.info(
        'IW_ANALYTICS_CONV_008',
        'Conversion listener attached successfully',
        {
          conversion_name: this.conversionConfig.conversion_name,
          selector: this.conversionConfig.element_selector,
          element_tag: this.conversionElement.tagName,
          element_text: this.conversionElement.textContent?.substring(0, 50),
        }
      );
    } catch (error) {
      logger.error(
        'IW_ANALYTICS_CONV_009',
        'Failed to attach conversion listener',
        {
          error: error.message,
          selector: this.conversionConfig.element_selector,
        }
      );
    }
  }

  /**
   * Handle click on configured conversion element
   * @private
   */
  async _handleConversionClick(event) {
    try {
      const element = event.currentTarget;

      // Capture element context
      const elementContext = {
        tag: element.tagName,
        text: element.textContent?.trim().substring(0, 100),
        id: element.id || null,
        classes: element.className || null,
        href: element.href || null,
        dataAttributes: {},
      };

      // Capture data-* attributes
      Array.from(element.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-')) {
          elementContext.dataAttributes[attr.name] = attr.value;
        }
      });

      logger.info('IW_ANALYTICS_CONV_010', 'Conversion element clicked', {
        conversion_name: this.conversionConfig.conversion_name,
        element_context: elementContext,
      });

      // Track the conversion event with context
      await this.trackConversionEvent(
        this.conversionConfig.conversion_name,
        1,
        elementContext
      );
    } catch (error) {
      logger.error(
        'IW_ANALYTICS_CONV_011',
        'Failed to handle conversion click',
        {
          error: error.message,
        }
      );
    }
  }

  /**
   * Attach page visit listener for page-based conversion tracking
   * Checks immediately if current page matches and sets up for future navigations
   * @private
   */
  _attachPageVisitListener() {
    if (!this.conversionConfig || !this.conversionConfig.page_url) {
      logger.warn(
        'IW_ANALYTICS_CONV_013',
        'No page URL configured for page visit tracking'
      );
      return;
    }

    // Check current page immediately on initialization
    this._checkPageVisitConversion();
  }

  /**
   * Check if current page matches configured page visit conversion
   * Called on initialization and on each SPA navigation
   * @private
   */
  _checkPageVisitConversion() {
    if (!this.conversionConfig || !this.conversionConfig.page_url) {
      return;
    }

    try {
      const configuredPageUrl = this.conversionConfig.page_url.trim();
      const currentPageUrl = window.location.pathname;

      // Normalize URLs by removing trailing slashes for comparison
      const normalizedCurrentUrl = currentPageUrl.replace(/\/$/, '') || '/';
      const normalizedConfiguredUrl = configuredPageUrl.replace(/\/$/, '') || '/';

      // Check if current page matches the configured page URL (exact match only)
      const isMatch = normalizedCurrentUrl === normalizedConfiguredUrl;

      if (isMatch) {
        logger.info('IW_ANALYTICS_CONV_014', 'Page visit conversion detected', {
          conversion_name: this.conversionConfig.conversion_name,
          configured_url: configuredPageUrl,
          current_url: currentPageUrl,
          journeyId: this.journeyId,
          isCreatingJourney: this.isCreatingJourney,
          isEnabled: this.isEnabled,
        });

        // Track the conversion event
        const pageContext = {
          page_url: window.location.href,
          page_title: document.title,
          page_path: currentPageUrl,
        };

        // Call trackConversionEvent and log the result
        this.trackConversionEvent(
          this.conversionConfig.conversion_name,
          1,
          pageContext
        )
          .then(() => {
            logger.info(
              'IW_ANALYTICS_CONV_017',
              'Page visit conversion tracked successfully'
            );
          })
          .catch((err) => {
            logger.error(
              'IW_ANALYTICS_CONV_018',
              'Failed to track page visit conversion',
              {
                error: err.message,
                stack: err.stack,
              }
            );
          });
      } else {
        logger.debug(
          'IW_ANALYTICS_CONV_015',
          'Current page does not match configured conversion URL',
          {
            configured_url: configuredPageUrl,
            current_url: currentPageUrl,
          }
        );
      }
    } catch (error) {
      logger.error(
        'IW_ANALYTICS_CONV_016',
        'Failed to check page visit conversion',
        {
          error: error.message,
        }
      );
    }
  }

  /**
   * Remove conversion listener (cleanup)
   * @private
   */
  _removeConversionListener() {
    if (this.conversionElement && this.conversionListener) {
      this.conversionElement.removeEventListener(
        'click',
        this.conversionListener
      );
      this.conversionElement = null;
      this.conversionListener = null;
      logger.info('IW_ANALYTICS_CONV_012', 'Conversion listener removed');
    }
  }

  /**
   * Destroy analytics instance and cleanup all resources
   * @public
   */
  destroy() {
    try {
      // End session if active (use beacon for guaranteed delivery)
      if (this.isEnabled && this.journeyId && this.isSessionActive) {
        this.endSession('cleanup', true);
      }

      // Clear all intervals (redundant but safe - endSession should have done this)
      this._clearAllIntervals();

      // Remove all event listeners
      this.eventListeners.forEach(({ target, type, handler }) => {
        target.removeEventListener(type, handler);
      });
      this.eventListeners = [];

      // Remove conversion tracking listener
      this._removeConversionListener();

      // Restore original history methods
      if (this.originalPushState && typeof history !== 'undefined') {
        history.pushState = this.originalPushState;
        this.originalPushState = null;
      }

      if (this.originalReplaceState && typeof history !== 'undefined') {
        history.replaceState = this.originalReplaceState;
        this.originalReplaceState = null;
      }

      // Clear queues
      this.eventQueue = [];
      this.retryQueue = [];

      // Reset state
      this.isInitialized = false;
      this.isEnabled = false;
      this.isSessionActive = false;
      this.journeyId = null;
      this.sessionEndTime = null;

      logger.info('IW_ANALYTICS_025', 'Analytics destroyed and cleaned up');
    } catch (error) {
      logger.warn('IW_ANALYTICS_026', 'Failed to destroy analytics', {
        error: error.message,
        stack: error.stack,
      });
    }
  }
}

// Export singleton instance
export default new VisitorJourneyAnalytics();
