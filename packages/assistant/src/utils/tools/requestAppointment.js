/**
 * Tool definition for requesting appointments
 * This tool allows the OpenAI agent to capture appointment requests with client contact information
 */
export const requestAppointmentTool = {
  type: 'function',
  description:
    'Request an appointment with preferred date, time, and optional client contact info',
  name: 'request_appointment',
  parameters: {
    type: 'object',
    properties: {
      preferred_date: {
        type: 'string',
        description: 'Preferred appointment date in YYYY-MM-DD format',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      },
      preferred_time: {
        type: 'string',
        description: 'Preferred appointment time in HH:MM format (24-hour)',
        pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
      },
      urgency: {
        type: 'string',
        description: 'Urgency level of the appointment',
        enum: ['low', 'medium', 'high', 'urgent'],
      },
      client_notes: {
        type: 'string',
        description: 'Additional notes from the client',
        maxLength: 1000,
      },
      client_email: {
        type: 'string',
        description: 'Client email address (if not already collected)',
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      client_phone: {
        type: 'string',
        description: 'Client phone number (if not already collected)',
        pattern: '^\\+?[1-9]\\d{1,14}$',
      },
      client_first_name: {
        type: 'string',
        description: 'Client first name (if not already collected)',
        maxLength: 255,
      },
      client_last_name: {
        type: 'string',
        description: 'Client last name (if not already collected)',
        maxLength: 255,
      },
    },
    required: ['preferred_date', 'preferred_time'],
  },
};
