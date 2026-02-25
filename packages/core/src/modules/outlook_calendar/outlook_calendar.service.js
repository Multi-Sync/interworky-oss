const axios = require('axios');
const OutlookCalendarIntegration = require('./outlook_calendar.model');
const { getConfig } = require('dotenv-handler');

const LOG_PREFIX = '[OutlookCalendarService]';

const MICROSOFT_CLIENT_ID = getConfig('MICROSOFT_CLIENT_ID');
const MICROSOFT_CLIENT_SECRET = getConfig('MICROSOFT_CLIENT_SECRET');
const MICROSOFT_TENANT_ID = getConfig('MICROSOFT_TENANT_ID') || 'common';
const MICROSOFT_REDIRECT_URI = getConfig('MICROSOFT_REDIRECT_URI') || 'https://api.interworky.com/api/outlook-calendar/callback';

const MICROSOFT_AUTH_URL = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0`;
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

const SCOPES = 'Calendars.ReadWrite User.Read offline_access';

// =============================================================================
// OAuth Flow (follows Wix pattern)
// =============================================================================

function getAuthUrl(userId, organizationId) {
  const state = Buffer.from(JSON.stringify({ userId, organizationId })).toString('base64');
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: MICROSOFT_REDIRECT_URI,
    scope: SCOPES,
    state,
    response_mode: 'query',
    prompt: 'consent',
  });
  return `${MICROSOFT_AUTH_URL}/authorize?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
  const response = await axios.post(`${MICROSOFT_AUTH_URL}/token`, new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    code,
    redirect_uri: MICROSOFT_REDIRECT_URI,
    grant_type: 'authorization_code',
    scope: SCOPES,
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  return {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    expires_in: response.data.expires_in,
  };
}

async function refreshAccessToken(refreshToken) {
  const response = await axios.post(`${MICROSOFT_AUTH_URL}/token`, new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: SCOPES,
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  return {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token || refreshToken,
    expires_in: response.data.expires_in,
  };
}

async function getAccessToken(userId) {
  const integration = await OutlookCalendarIntegration.findOne({ user_id: userId, status: 'active' });
  if (!integration) throw new Error('Outlook Calendar not connected');

  const now = new Date();
  const bufferTime = 5 * 60 * 1000;
  if (integration.access_token && integration.access_token_expires_at > new Date(now.getTime() + bufferTime)) {
    return integration.access_token;
  }

  console.log(`${LOG_PREFIX} Refreshing token for user ${userId}`);
  const tokens = await refreshAccessToken(integration.refresh_token);

  await OutlookCalendarIntegration.findOneAndUpdate(
    { id: integration.id },
    {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000),
    },
  );

  return tokens.access_token;
}

// =============================================================================
// Integration Management
// =============================================================================

async function createIntegration(userId, organizationId, tokens, email) {
  const existing = await OutlookCalendarIntegration.findOne({ user_id: userId });
  if (existing) {
    existing.refresh_token = tokens.refresh_token || existing.refresh_token;
    existing.access_token = tokens.access_token;
    existing.access_token_expires_at = new Date(Date.now() + tokens.expires_in * 1000);
    existing.microsoft_account_email = email;
    existing.status = 'active';
    existing.organization_id = organizationId;
    await existing.save();
    return existing;
  }

  return OutlookCalendarIntegration.create({
    user_id: userId,
    organization_id: organizationId,
    microsoft_account_email: email,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000),
    status: 'active',
  });
}

async function getIntegration(userId) {
  return OutlookCalendarIntegration.findOne({ user_id: userId, status: 'active' });
}

async function disconnectIntegration(userId) {
  return OutlookCalendarIntegration.findOneAndUpdate({ user_id: userId }, { status: 'revoked' }, { new: true });
}

// =============================================================================
// Graph API Helpers
// =============================================================================

async function graphRequest(accessToken, method, endpoint, data = null) {
  const config = {
    method,
    url: `${GRAPH_API_URL}${endpoint}`,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  };
  if (data) config.data = data;
  const response = await axios(config);
  return response.data;
}

// =============================================================================
// Calendar API Methods
// =============================================================================

async function listCalendars(userId) {
  const accessToken = await getAccessToken(userId);
  const data = await graphRequest(accessToken, 'GET', '/me/calendars');
  return (data.value || []).map((c) => ({ id: c.id, name: c.name, color: c.color, isDefault: c.isDefaultCalendar }));
}

async function listEvents(userId, { timeMin, timeMax, maxResults = 50 } = {}) {
  const accessToken = await getAccessToken(userId);
  let endpoint = `/me/calendarview?startDateTime=${encodeURIComponent(timeMin)}&endDateTime=${encodeURIComponent(timeMax)}&$top=${maxResults}&$orderby=start/dateTime`;
  const data = await graphRequest(accessToken, 'GET', endpoint);
  return (data.value || []).map(formatEvent);
}

async function createEvent(userId, eventData) {
  const accessToken = await getAccessToken(userId);
  const event = {
    subject: eventData.title,
    body: { contentType: 'Text', content: eventData.description || '' },
    start: { dateTime: eventData.startTime, timeZone: eventData.timeZone || 'UTC' },
    end: { dateTime: eventData.endTime, timeZone: eventData.timeZone || 'UTC' },
    location: eventData.location ? { displayName: eventData.location } : undefined,
    attendees: (eventData.attendees || []).map((email) => ({
      emailAddress: { address: email },
      type: 'required',
    })),
    isAllDay: eventData.isAllDay || false,
  };
  const data = await graphRequest(accessToken, 'POST', '/me/events', event);
  return formatEvent(data);
}

async function updateEvent(userId, eventId, eventData) {
  const accessToken = await getAccessToken(userId);
  const event = {};
  if (eventData.title) event.subject = eventData.title;
  if (eventData.description !== undefined) event.body = { contentType: 'Text', content: eventData.description };
  if (eventData.startTime) event.start = { dateTime: eventData.startTime, timeZone: 'UTC' };
  if (eventData.endTime) event.end = { dateTime: eventData.endTime, timeZone: 'UTC' };
  if (eventData.location !== undefined) event.location = { displayName: eventData.location };

  const data = await graphRequest(accessToken, 'PATCH', `/me/events/${eventId}`, event);
  return formatEvent(data);
}

async function deleteEvent(userId, eventId) {
  const accessToken = await getAccessToken(userId);
  await graphRequest(accessToken, 'DELETE', `/me/events/${eventId}`);
  return { success: true };
}

async function getUserEmail(accessToken) {
  const data = await graphRequest(accessToken, 'GET', '/me');
  return data.mail || data.userPrincipalName;
}

function formatEvent(event) {
  return {
    id: event.id,
    title: event.subject || '',
    description: event.body?.content || '',
    location: event.location?.displayName || '',
    startTime: event.start?.dateTime,
    endTime: event.end?.dateTime,
    isAllDay: event.isAllDay || false,
    attendees: (event.attendees || []).map((a) => a.emailAddress?.address),
    provider: 'outlook',
    status: event.isCancelled ? 'cancelled' : 'confirmed',
  };
}

module.exports = {
  getAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getAccessToken,
  createIntegration,
  getIntegration,
  disconnectIntegration,
  listCalendars,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getUserEmail,
};
