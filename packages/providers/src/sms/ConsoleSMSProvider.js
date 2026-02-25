const SMSProvider = require('./SMSProvider');
const { registerProvider } = require('../registry');

/**
 * Console SMS provider — logs SMS messages to stdout.
 * Zero-config default for development and self-hosting.
 */
class ConsoleSMSProvider extends SMSProvider {
  async send(to, body) {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║           💬  SMS SENT                   ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  To:   ${to}`);
    console.log(`║  Body: ${body}`);
    console.log('╚══════════════════════════════════════════╝\n');
  }
}

registerProvider('sms', 'console', () => new ConsoleSMSProvider());
registerProvider('sms', 'default', () => new ConsoleSMSProvider());

module.exports = ConsoleSMSProvider;
