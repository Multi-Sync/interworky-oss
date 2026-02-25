const express = require('express');
const authenticateToken = require('../middlewares/auth.middleware');
const googleCalendarService = require('../modules/google_calendar/google_calendar.service');
const { calendarCapabilities } = require('../modules/google_calendar/google_calendar.capabilities');

const googleCalendarRouter = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://interworky.com';

// =============================================================================
// OAuth Flow
// =============================================================================

/**
 * Generate OAuth URL for Google Calendar
 * GET /api/google-calendar/auth
 */
googleCalendarRouter.get('/auth', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.query.organizationId || '';
    const authUrl = googleCalendarService.getAuthUrl(userId, organizationId);
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('[GoogleCalendar Auth] Error:', error.message);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

/**
 * OAuth Callback
 * GET /api/google-calendar/callback
 */
googleCalendarRouter.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).json({ error: 'Missing authorization code' });

    const tokens = await googleCalendarService.exchangeCodeForTokens(code);
    const email = await googleCalendarService.getUserEmail(tokens.access_token);

    let userId, organizationId;
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      userId = decoded.userId;
      organizationId = decoded.organizationId;
    }

    await googleCalendarService.createIntegration(userId, organizationId, tokens, email);

    console.log(`[GoogleCalendar Callback] Connected for user ${userId}`);

    // For mobile: redirect with success scheme
    res.redirect(`interworky://calendar/connected?provider=google&email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error('[GoogleCalendar Callback] Error:', error.message);
    res.redirect(`interworky://calendar/error?message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Get connection status
 * GET /api/google-calendar/status
 */
googleCalendarRouter.get('/status', authenticateToken, async (req, res) => {
  try {
    const integration = await googleCalendarService.getIntegration(req.userId);
    if (!integration) return res.json({ connected: false });

    res.json({
      connected: true,
      email: integration.google_account_email,
      status: integration.status,
      lastSyncAt: integration.last_sync_at,
    });
  } catch (error) {
    console.error('[GoogleCalendar Status] Error:', error.message);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * Disconnect Google Calendar
 * DELETE /api/google-calendar/disconnect
 */
googleCalendarRouter.delete('/disconnect', authenticateToken, async (req, res) => {
  try {
    await googleCalendarService.disconnectIntegration(req.userId);
    res.json({ success: true, message: 'Google Calendar disconnected' });
  } catch (error) {
    console.error('[GoogleCalendar Disconnect] Error:', error.message);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// =============================================================================
// Calendar API
// =============================================================================

/**
 * List calendars
 * GET /api/google-calendar/calendars
 */
googleCalendarRouter.get('/calendars', authenticateToken, async (req, res) => {
  try {
    const calendars = await googleCalendarService.listCalendars(req.userId);
    res.json({ success: true, calendars });
  } catch (error) {
    console.error('[GoogleCalendar] List calendars error:', error.message);
    res.status(500).json({ error: 'Failed to list calendars' });
  }
});

/**
 * List events
 * GET /api/google-calendar/events?start=ISO&end=ISO
 */
googleCalendarRouter.get('/events', authenticateToken, async (req, res) => {
  try {
    const { start, end, calendarId, maxResults } = req.query;
    const events = await googleCalendarService.listEvents(req.userId, {
      timeMin: start,
      timeMax: end,
      calendarId: calendarId || 'primary',
      maxResults: maxResults ? parseInt(maxResults) : 50,
    });
    res.json({ success: true, events });
  } catch (error) {
    console.error('[GoogleCalendar] List events error:', error.message);
    res.status(500).json({ error: 'Failed to list events' });
  }
});

/**
 * Create event
 * POST /api/google-calendar/events
 */
googleCalendarRouter.post('/events', authenticateToken, async (req, res) => {
  try {
    const event = await googleCalendarService.createEvent(req.userId, req.body);
    res.json({ success: true, event });
  } catch (error) {
    console.error('[GoogleCalendar] Create event error:', error.message);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * Update event
 * PUT /api/google-calendar/events/:eventId
 */
googleCalendarRouter.put('/events/:eventId', authenticateToken, async (req, res) => {
  try {
    const event = await googleCalendarService.updateEvent(req.userId, req.params.eventId, req.body);
    res.json({ success: true, event });
  } catch (error) {
    console.error('[GoogleCalendar] Update event error:', error.message);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

/**
 * Delete event
 * DELETE /api/google-calendar/events/:eventId
 */
googleCalendarRouter.delete('/events/:eventId', authenticateToken, async (req, res) => {
  try {
    await googleCalendarService.deleteEvent(req.userId, req.params.eventId);
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('[GoogleCalendar] Delete event error:', error.message);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = googleCalendarRouter;
