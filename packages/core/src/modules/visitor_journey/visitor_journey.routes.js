// src/modules/visitor_journey/visitor_journey.routes.js
const express = require('express');
const visitorJourneyRouter = express.Router();

const {
  createVisitorJourney,
  getVisitorJourney,
  updateVisitorJourney,
  deleteVisitorJourney,
  listVisitorJourneys,
  getVisitorJourneyBySession,
  getVisitorJourneysByVisitor,
  getOrganizationAnalytics,
  getTrafficSourcesBreakdown,
  getRetentionCohorts,
  getConversionFunnel,
  getTrafficPerformance,
  getAnalyticsTrends,
  getCustomConversionFunnel,
  addPageToJourney,
  addConversionEvent,
  addBounceEvent,
  addSearchQuery,
  updateSessionStatus,
  syncCriticalData,
} = require('./visitor_journey.controllers');

const { getAnalyticsSummary } = require('./visitor_journey.summary.controller');
const { generateAnalyticsReport } = require('./visitor_journey.report.controller');

const authenticateToken = require('../../middlewares/auth.middleware');

const {
  updateVisitorJourneyValidator,
  getVisitorJourneyValidator,
  deleteVisitorJourneyValidator,
  listVisitorJourneysValidator,
  getVisitorJourneyBySessionValidator,
  getVisitorJourneyByVisitorValidator,
  addPageToJourneyValidator,
  addConversionEventValidator,
  addSearchQueryValidator,
  updateSessionStatusValidator,
  getOrganizationAnalyticsValidator,
} = require('./visitor_journey.validators');

visitorJourneyRouter.post('/', authenticateToken, createVisitorJourney);

visitorJourneyRouter.get('/', authenticateToken, listVisitorJourneysValidator, listVisitorJourneys);

// New unified analytics summary endpoint
visitorJourneyRouter.get('/analytics/summary/:organization_id', authenticateToken, getAnalyticsSummary);

// AI-powered analytics report endpoint
visitorJourneyRouter.get('/analytics/report/:organization_id', authenticateToken, generateAnalyticsReport);

visitorJourneyRouter.get(
  '/analytics/organization/:organization_id',
  authenticateToken,
  getOrganizationAnalyticsValidator,
  getOrganizationAnalytics,
);

visitorJourneyRouter.get('/analytics/traffic-sources/:organization_id', authenticateToken, getTrafficSourcesBreakdown);

visitorJourneyRouter.get(
  '/analytics/retention-cohorts/:organization_id',
  authenticateToken,
  getOrganizationAnalyticsValidator,
  getRetentionCohorts,
);

visitorJourneyRouter.get(
  '/analytics/conversion-funnel/:organization_id',
  authenticateToken,
  getOrganizationAnalyticsValidator,
  getConversionFunnel,
);

visitorJourneyRouter.get(
  '/analytics/traffic-performance/:organization_id',
  authenticateToken,
  getOrganizationAnalyticsValidator,
  getTrafficPerformance,
);

visitorJourneyRouter.get(
  '/analytics/trends/:organization_id',
  authenticateToken,
  getOrganizationAnalyticsValidator,
  getAnalyticsTrends,
);

// Custom conversion funnel with awareness, consideration, conversion stages
visitorJourneyRouter.get('/analytics/custom-funnel/:organization_id', authenticateToken, getCustomConversionFunnel);

visitorJourneyRouter.get(
  '/session/:session_id',
  authenticateToken,
  getVisitorJourneyBySessionValidator,
  getVisitorJourneyBySession,
);

visitorJourneyRouter.get(
  '/visitor/:visitor_id',
  authenticateToken,
  getVisitorJourneyByVisitorValidator,
  getVisitorJourneysByVisitor,
);

visitorJourneyRouter.get('/:id', authenticateToken, getVisitorJourneyValidator, getVisitorJourney);

visitorJourneyRouter.put('/:id', authenticateToken, updateVisitorJourneyValidator, updateVisitorJourney);

visitorJourneyRouter.post('/:id/pages', authenticateToken, addPageToJourneyValidator, addPageToJourney);

visitorJourneyRouter.post('/:id/conversions', authenticateToken, addConversionEventValidator, addConversionEvent);

visitorJourneyRouter.post('/:id/bounce-event', authenticateToken, addBounceEvent);

visitorJourneyRouter.post('/:id/search-query', authenticateToken, addSearchQueryValidator, addSearchQuery);

visitorJourneyRouter.post('/:id/session-status', authenticateToken, updateSessionStatusValidator, updateSessionStatus);

visitorJourneyRouter.post('/:id/sync-critical', authenticateToken, syncCriticalData);

visitorJourneyRouter.delete('/:id', authenticateToken, deleteVisitorJourneyValidator, deleteVisitorJourney);

module.exports = visitorJourneyRouter;
