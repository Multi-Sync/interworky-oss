const { google } = require('googleapis');
const GoogleCalendarIntegration = require('./google_calendar.model');
const { getConfig } = require('dotenv-handler');

const LOG_PREFIX = '[GoogleCalendarService]';

const GOOGLE_CLIENT_ID = getConfig('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = getConfig('GOOGLE_CLIENT_SECRET');
const GOOGLE_REDIRECT_URI = getConfig('GOOGLE_REDIRECT_URI') || 'https://api.interworky.com/api/google-calendar/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

function createOAuth2Client() {
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

// =============================================================================
// OAuth Flow (follows Wix pattern: install → callback → token storage → refresh)
// =============================================================================

function getAuthUrl(userId, organizationId) {
  const oauth2Client = createOAuth2Client();
  const state = Buffer.from(JSON.stringify({ userId, organizationId })).toString('base64');

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent',
  });
}

async function exchangeCodeForTokens(code) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

async function refreshAccessToken(refreshToken) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

/**
 * Get valid access token (with 5-min buffer auto-refresh — same as Wix pattern)
 */
async function getAccessToken(userId) {
  const integration = await GoogleCalendarIntegration.findOne({
    user_id: userId,
    status: 'active',
  });

  if (!integration) {
    throw new Error('Google Calendar not connected');
  }

  const now = new Date();
  const bufferTime = 5 * 60 * 1000;
  if (integration.access_token && integration.access_token_expires_at > new Date(now.getTime() + bufferTime)) {
    return integration.access_token;
  }

  console.log(`${LOG_PREFIX} Refreshing token for user ${userId}`);
  const tokens = await refreshAccessToken(integration.refresh_token);

  await GoogleCalendarIntegration.findOneAndUpdate(
    { id: integration.id },
    {
      access_token: tokens.access_token,
      access_token_expires_at: new Date(tokens.expiry_date),
      ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
    },
  );

  return tokens.access_token;
}

function getCalendarClient(accessToken) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// =============================================================================
// Integration Management
// =============================================================================

async function createIntegration(userId, organizationId, tokens, email) {
  const existing = await GoogleCalendarIntegration.findOne({ user_id: userId });

  if (existing) {
    existing.refresh_token = tokens.refresh_token || existing.refresh_token;
    existing.access_token = tokens.access_token;
    existing.access_token_expires_at = new Date(tokens.expiry_date);
    existing.google_account_email = email;
    existing.status = 'active';
    existing.organization_id = organizationId;
    await existing.save();
    return existing;
  }

  return GoogleCalendarIntegration.create({
    user_id: userId,
    organization_id: organizationId,
    google_account_email: email,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    access_token_expires_at: new Date(tokens.expiry_date),
    status: 'active',
  });
}

async function getIntegration(userId) {
  return GoogleCalendarIntegration.findOne({ user_id: userId, status: 'active' });
}

async function disconnectIntegration(userId) {
  return GoogleCalendarIntegration.findOneAndUpdate(
    { user_id: userId },
    { status: 'revoked' },
    { new: true },
  );
}

// =============================================================================
// Calendar API Methods
// =============================================================================

async function listCalendars(userId) {
  const accessToken = await getAccessToken(userId);
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.calendarList.list();
  return response.data.items || [];
}

async function listEvents(userId, { timeMin, timeMax, calendarId = 'primary', maxResults = 50 } = {}) {
  const accessToken = await getAccessToken(userId);
  const calendar = getCalendarClient(accessToken);

  const params = {
    calendarId,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults,
  };

  if (timeMin) params.timeMin = new Date(timeMin).toISOString();
  if (timeMax) params.timeMax = new Date(timeMax).toISOString();

  const response = await calendar.events.list(params);
  return (response.data.items || []).map(formatEvent);
}

async function createEvent(userId, eventData, calendarId = 'primary') {
  const accessToken = await getAccessToken(userId);
  const calendar = getCalendarClient(accessToken);

  const event = {
    summary: eventData.title,
    description: eventData.description,
    location: eventData.location,
    start: eventData.isAllDay
      ? { date: eventData.startDate }
      : { dateTime: new Date(eventData.startTime).toISOString(), timeZone: eventData.timeZone },
    end: eventData.isAllDay
      ? { date: eventData.endDate }
      : { dateTime: new Date(eventData.endTime).toISOString(), timeZone: eventData.timeZone },
    attendees: (eventData.attendees || []).map((email) => ({ email })),
  };

  const response = await calendar.events.insert({ calendarId, resource: event });
  return formatEvent(response.data);
}

async function updateEvent(userId, eventId, eventData, calendarId = 'primary') {
  const accessToken = await getAccessToken(userId);
  const calendar = getCalendarClient(accessToken);

  const event = {};
  if (eventData.title) event.summary = eventData.title;
  if (eventData.description !== undefined) event.description = eventData.description;
  if (eventData.location !== undefined) event.location = eventData.location;
  if (eventData.startTime) event.start = { dateTime: new Date(eventData.startTime).toISOString() };
  if (eventData.endTime) event.end = { dateTime: new Date(eventData.endTime).toISOString() };
  if (eventData.attendees) event.attendees = eventData.attendees.map((email) => ({ email }));

  const response = await calendar.events.patch({ calendarId, eventId, resource: event });
  return formatEvent(response.data);
}

async function deleteEvent(userId, eventId, calendarId = 'primary') {
  const accessToken = await getAccessToken(userId);
  const calendar = getCalendarClient(accessToken);
  await calendar.events.delete({ calendarId, eventId });
  return { success: true };
}

// =============================================================================
// Helpers
// =============================================================================

function formatEvent(event) {
  return {
    id: event.id,
    title: event.summary || '',
    description: event.description || '',
    location: event.location || '',
    startTime: event.start?.dateTime || event.start?.date,
    endTime: event.end?.dateTime || event.end?.date,
    isAllDay: !event.start?.dateTime,
    attendees: (event.attendees || []).map((a) => a.email),
    provider: 'google',
    status: event.status,
    htmlLink: event.htmlLink,
  };
}

async function getUserEmail(accessToken) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data.email;
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
