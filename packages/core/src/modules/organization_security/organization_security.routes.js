const express = require('express');
const router = express.Router();
const {
  getAlerts,
  getSecuritySummary,
  updateAlertStatus,
  ignoreAlert,
  getKnownCVEs,
  triggerCVECheck,
} = require('./organization_security.controllers');
const {
  organizationIdValidator,
  alertIdValidator,
  alertsQueryValidator,
  updateAlertStatusValidator,
} = require('./organization_security.validators');
const authenticateToken = require('../../middlewares/auth.middleware');

/**
 * Organization Security Routes (Simplified)
 *
 * Main flow is automatic:
 * - Cron job runs every 12 hours
 * - Fetches CVEs, checks orgs, sends to WS-Assistant
 * - WS-Assistant creates PRs and updates alert status
 *
 * These endpoints are for:
 * - Viewing alerts in dashboard
 * - WS-Assistant callbacks
 * - Manual testing
 */

// Dashboard endpoints
router.get('/:organization_id/alerts', authenticateToken, alertsQueryValidator, getAlerts);
router.get('/:organization_id/summary', authenticateToken, organizationIdValidator, getSecuritySummary);

// Alert management
router.put('/alerts/:alert_id/status', authenticateToken, updateAlertStatusValidator, updateAlertStatus);
router.post('/alerts/:alert_id/ignore', authenticateToken, alertIdValidator, ignoreAlert);

// Utility endpoints
router.get('/known-cves', authenticateToken, getKnownCVEs);
router.post('/trigger-check', authenticateToken, triggerCVECheck);

module.exports = router;
