const express = require('express');
const authenticateToken = require('../middlewares/auth.middleware');
const outlookService = require('../modules/outlook_calendar/outlook_calendar.service');

const outlookCalendarRouter = express.Router();

// OAuth Flow
outlookCalendarRouter.get('/auth', authenticateToken, async (req, res) => {
  try {
    const authUrl = outlookService.getAuthUrl(req.userId, req.query.organizationId || '');
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('[OutlookCalendar Auth] Error:', error.message);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

outlookCalendarRouter.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).json({ error: 'Missing authorization code' });

    const tokens = await outlookService.exchangeCodeForTokens(code);
    const email = await outlookService.getUserEmail(tokens.access_token);

    let userId, organizationId;
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      userId = decoded.userId;
      organizationId = decoded.organizationId;
    }

    await outlookService.createIntegration(userId, organizationId, tokens, email);
    res.redirect(`interworky://calendar/connected?provider=outlook&email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error('[OutlookCalendar Callback] Error:', error.message);
    res.redirect(`interworky://calendar/error?message=${encodeURIComponent(error.message)}`);
  }
});

outlookCalendarRouter.get('/status', authenticateToken, async (req, res) => {
  try {
    const integration = await outlookService.getIntegration(req.userId);
    if (!integration) return res.json({ connected: false });
    res.json({ connected: true, email: integration.microsoft_account_email, status: integration.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

outlookCalendarRouter.delete('/disconnect', authenticateToken, async (req, res) => {
  try {
    await outlookService.disconnectIntegration(req.userId);
    res.json({ success: true, message: 'Outlook Calendar disconnected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Calendar API
outlookCalendarRouter.get('/calendars', authenticateToken, async (req, res) => {
  try {
    const calendars = await outlookService.listCalendars(req.userId);
    res.json({ success: true, calendars });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list calendars' });
  }
});

outlookCalendarRouter.get('/events', authenticateToken, async (req, res) => {
  try {
    const { start, end, maxResults } = req.query;
    const events = await outlookService.listEvents(req.userId, {
      timeMin: start,
      timeMax: end,
      maxResults: maxResults ? parseInt(maxResults) : 50,
    });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list events' });
  }
});

outlookCalendarRouter.post('/events', authenticateToken, async (req, res) => {
  try {
    const event = await outlookService.createEvent(req.userId, req.body);
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

outlookCalendarRouter.put('/events/:eventId', authenticateToken, async (req, res) => {
  try {
    const event = await outlookService.updateEvent(req.userId, req.params.eventId, req.body);
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

outlookCalendarRouter.delete('/events/:eventId', authenticateToken, async (req, res) => {
  try {
    await outlookService.deleteEvent(req.userId, req.params.eventId);
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = outlookCalendarRouter;
