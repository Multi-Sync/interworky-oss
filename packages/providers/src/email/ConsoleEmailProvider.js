const EmailProvider = require('./EmailProvider');
const { registerProvider } = require('../registry');

/**
 * Console email provider — logs emails to stdout.
 * Zero-config default for development and self-hosting.
 */
class ConsoleEmailProvider extends EmailProvider {
  async send(to, subject, html, opts = {}) {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║           📧  EMAIL SENT                 ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  To:      ${to}`);
    console.log(`║  From:    ${opts.from || '(default)'}`);
    console.log(`║  Subject: ${subject}`);
    console.log('╠══════════════════════════════════════════╣');
    console.log(html);
    console.log('╚══════════════════════════════════════════╝\n');
  }

  async sendTemplate(to, templateId, vars, opts = {}) {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║        📧  TEMPLATE EMAIL SENT           ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  To:       ${to}`);
    console.log(`║  From:     ${opts.from || '(default)'}`);
    console.log(`║  Template: ${templateId}`);
    console.log(`║  Vars:     ${JSON.stringify(vars, null, 2)}`);
    console.log('╚══════════════════════════════════════════╝\n');
  }
}

registerProvider('email', 'console', () => new ConsoleEmailProvider());
registerProvider('email', 'default', () => new ConsoleEmailProvider());

module.exports = ConsoleEmailProvider;
