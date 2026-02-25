const { getAIProvider } = require('@interworky/providers');
const axios = require('axios');
const NotificationPreference = require('./notification_preference.model');
const pushService = require('../device_token/push_notification.service');
const googleCalendarService = require('../google_calendar/google_calendar.service');

const FUNCTIONS_API_URL = process.env.FUNCTIONS_API_URL || 'http://localhost:45346';

const LOG_PREFIX = '[DailyBriefingService]';

const openai = getAIProvider().getClient();

/**
 * Generate and send a personalized daily briefing for a user
 */
async function generateBriefing(userId) {
  const context = [];

  // Gather today's calendar events
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await googleCalendarService.listEvents(userId, {
      timeMin: today.toISOString(),
      timeMax: tomorrow.toISOString(),
    });

    if (events.length > 0) {
      context.push(`Today's calendar events:\n${events.map((e) =>
        `- ${e.title} at ${new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      ).join('\n')}`);
    } else {
      context.push('No calendar events scheduled for today.');
    }
  } catch {
    context.push('Calendar not connected.');
  }

  // Gather pending tasks via functions API
  try {
    const tasksResponse = await axios.get(`${FUNCTIONS_API_URL}/api/mobile/tasks`, {
      params: { userId, status: 'pending,scheduled', limit: 10 },
    });
    const tasks = tasksResponse.data?.tasks || [];

    if (tasks.length > 0) {
      context.push(`Pending tasks:\n${tasks.map((t) => `- ${t.title} (${t.status})`).join('\n')}`);
    } else {
      context.push('No pending tasks.');
    }
  } catch {
    // Tasks not available
  }

  // Generate briefing with AI
  const prompt = `You are Carla, the user's AI work assistant. Generate a brief, friendly morning briefing (3-5 sentences max). Be concise and actionable.\n\n${context.join('\n\n')}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || 'Good morning! Check your tasks and calendar for today.';
  } catch (error) {
    console.error(`${LOG_PREFIX} AI generation failed:`, error.message);
    return `Good morning! You have ${context.length > 1 ? 'events and tasks' : 'items'} to review today. Open Interworky to see your schedule.`;
  }
}

/**
 * Send daily briefing to a user via push notification
 */
async function sendBriefing(userId) {
  const briefingText = await generateBriefing(userId);

  await pushService.sendPushNotification(userId, {
    title: 'Good Morning! Your Daily Briefing',
    body: briefingText,
    data: { type: 'daily_briefing' },
    category: 'daily_briefing',
    sound: 'default',
  });

  console.log(`${LOG_PREFIX} Briefing sent to user ${userId}`);
}

/**
 * Get users who should receive briefings at the current hour
 */
async function getUsersForBriefing(hour, timezone) {
  const timeStr = `${String(hour).padStart(2, '0')}:00`;
  return NotificationPreference.find({
    daily_briefing_enabled: true,
    daily_briefing_time: timeStr,
    timezone,
  });
}

module.exports = {
  generateBriefing,
  sendBriefing,
  getUsersForBriefing,
};
