/**
 * Google Calendar AI assistant capabilities
 * Auto-registered when user connects Google Calendar
 */

const calendarCapabilities = [
  {
    method_name: 'list_calendar_events',
    description: 'List events from the user\'s Google Calendar for a given date range',
    category: 'calendar',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date/time in ISO 8601 format' },
        endDate: { type: 'string', description: 'End date/time in ISO 8601 format' },
        maxResults: { type: 'number', description: 'Maximum number of events to return (default 20)' },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    method_name: 'create_calendar_event',
    description: 'Create a new event on the user\'s Google Calendar',
    category: 'calendar',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title' },
        startTime: { type: 'string', description: 'Start time in ISO 8601 format' },
        endTime: { type: 'string', description: 'End time in ISO 8601 format' },
        description: { type: 'string', description: 'Event description' },
        location: { type: 'string', description: 'Event location' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'List of attendee emails' },
        isAllDay: { type: 'boolean', description: 'Whether this is an all-day event' },
      },
      required: ['title', 'startTime', 'endTime'],
    },
  },
  {
    method_name: 'update_calendar_event',
    description: 'Update an existing event on the user\'s Google Calendar',
    category: 'calendar',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Event ID to update' },
        title: { type: 'string', description: 'Updated title' },
        startTime: { type: 'string', description: 'Updated start time' },
        endTime: { type: 'string', description: 'Updated end time' },
        description: { type: 'string', description: 'Updated description' },
        location: { type: 'string', description: 'Updated location' },
      },
      required: ['eventId'],
    },
  },
  {
    method_name: 'delete_calendar_event',
    description: 'Delete an event from the user\'s Google Calendar',
    category: 'calendar',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Event ID to delete' },
      },
      required: ['eventId'],
    },
  },
  {
    method_name: 'check_availability',
    description: 'Check the user\'s availability for a given time range',
    category: 'calendar',
    parameters: {
      type: 'object',
      properties: {
        startTime: { type: 'string', description: 'Start of time range to check' },
        endTime: { type: 'string', description: 'End of time range to check' },
      },
      required: ['startTime', 'endTime'],
    },
  },
  {
    method_name: 'find_free_time',
    description: 'Find free time slots in the user\'s calendar for a given date',
    category: 'calendar',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date to check for free time (YYYY-MM-DD)' },
        durationMinutes: { type: 'number', description: 'Desired slot duration in minutes (default 30)' },
        workingHoursStart: { type: 'string', description: 'Working hours start (default 09:00)' },
        workingHoursEnd: { type: 'string', description: 'Working hours end (default 17:00)' },
      },
      required: ['date'],
    },
  },
];

module.exports = { calendarCapabilities };
