const SMSProvider = require('./SMSProvider');
const { registerProvider } = require('../registry');

/**
 * Twilio SMS provider.
 *
 * Env vars:
 *   TWILIO_ACCOUNT_SID  — Twilio Account SID
 *   TWILIO_AUTH_TOKEN    — Twilio Auth Token
 *   TWILIO_PHONE_NUMBER  — Twilio sender phone number
 */
class TwilioSMSProvider extends SMSProvider {
  constructor() {
    super();
    // Lazy-require so users without Twilio don't need the dependency
    const twilio = require('twilio');
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.from = process.env.TWILIO_PHONE_NUMBER;
  }

  async send(to, body) {
    try {
      await this.client.messages.create({
        body,
        to,
        from: this.from,
      });
      console.log(`[Twilio] SMS sent to ${to}`);
    } catch (error) {
      console.error(`[Twilio] Failed to send SMS to ${to}:`, error.message);
      throw new Error('Failed to send SMS');
    }
  }
}

registerProvider('sms', 'twilio', () => new TwilioSMSProvider());

module.exports = TwilioSMSProvider;
