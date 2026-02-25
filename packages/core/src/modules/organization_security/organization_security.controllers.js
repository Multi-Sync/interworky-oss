const { CVEAlert } = require('./organization_security.model');
const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const securityService = require('./organization_security.service');

/**
 * Organization Security Controller
 *
 * Simplified endpoints for security alerts.
 * Main work is done by cron job + WS-Assistant.
 */

/**
 * Get security alerts for an organization
 * GET /api/organization-security/:organization_id/alerts
 */
exports.getAlerts = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { status, limit } = req.query;

  const alerts = await securityService.getAlerts(organization_id, status, limit || 50);

  res.status(200).json({
    success: true,
    data: alerts,
    count: alerts.length,
  });
}, 'Failed to get alerts');

/**
 * Get security summary for an organization
 * GET /api/organization-security/:organization_id/summary
 */
exports.getSecuritySummary = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const summary = await securityService.getSecuritySummary(organization_id);

  res.status(200).json({
    success: true,
    data: summary,
  });
}, 'Failed to get security summary');

/**
 * Update alert status (called by WS-Assistant after fix)
 * PUT /api/organization-security/alerts/:alert_id/status
 */
exports.updateAlertStatus = asyncHandler(async (req, res) => {
  const { alert_id } = req.params;
  const { status, pr_url, pr_number, error_message } = req.body;

  const alert = await CVEAlert.findOne({ id: alert_id });
  if (!alert) {
    throw new HttpError('Alert not found').NotFound();
  }

  // Update fields
  alert.status = status;

  if (status === 'resolved' && pr_url) {
    alert.pr_created = true;
    alert.pr_url = pr_url;
    alert.pr_number = pr_number;
    alert.resolved_at = new Date();
  }

  if (status === 'failed' && error_message) {
    alert.error_message = error_message;
  }

  await alert.save();

  res.status(200).json({
    success: true,
    data: alert,
  });
}, 'Failed to update alert status');

/**
 * Ignore an alert
 * POST /api/organization-security/alerts/:alert_id/ignore
 */
exports.ignoreAlert = asyncHandler(async (req, res) => {
  const { alert_id } = req.params;

  const alert = await CVEAlert.findOneAndUpdate(
    { id: alert_id },
    { status: 'ignored' },
    { new: true },
  );

  if (!alert) {
    throw new HttpError('Alert not found').NotFound();
  }

  res.status(200).json({
    success: true,
    data: alert,
  });
}, 'Failed to ignore alert');

/**
 * Get known Next.js CVEs
 * GET /api/organization-security/known-cves
 */
exports.getKnownCVEs = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: securityService.NEXTJS_CRITICAL_CVES,
  });
}, 'Failed to get known CVEs');

/**
 * Manually trigger CVE check (admin/testing only)
 * POST /api/organization-security/trigger-check
 */
exports.triggerCVECheck = asyncHandler(async (req, res) => {
  // Run async, don't block
  securityService.checkForNewCVEs().catch(err => {
    console.error('[Security] Manual CVE check failed:', err.message);
  });

  res.status(202).json({
    success: true,
    message: 'CVE check triggered. Check logs for progress.',
  });
}, 'Failed to trigger CVE check');
