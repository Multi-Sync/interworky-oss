const nodemailer = require('nodemailer');
const EmailProvider = require('./EmailProvider');
const { registerProvider } = require('../registry');

/**
 * SMTP email provider — sends via any SMTP server (Gmail, Outlook, self-hosted).
 *
 * Env vars:
 *   SMTP_HOST — SMTP server hostname
 *   SMTP_PORT — SMTP port (default: 587)
 *   SMTP_USER — SMTP username
 *   SMTP_PASS — SMTP password
 *   SMTP_FROM — Default sender address
 */
class SMTPEmailProvider extends EmailProvider {
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    this.defaultFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  }

  async send(to, subject, html, opts = {}) {
    await this.transporter.sendMail({
      from: opts.from || this.defaultFrom,
      to,
      subject,
      html,
      cc: opts.cc,
      bcc: opts.bcc,
      attachments: opts.attachments,
    });
    console.log(`[SMTP] Email sent to ${to}`);
  }

  async sendTemplate(to, templateId, vars, opts = {}) {
    // SMTP doesn't have native templates — render a simple fallback
    const html = `<p>Template: ${templateId}</p><pre>${JSON.stringify(vars, null, 2)}</pre>`;
    const subject = opts.subject || `Notification (${templateId})`;
    await this.send(to, subject, html, opts);
  }
}

registerProvider('email', 'smtp', () => new SMTPEmailProvider());

module.exports = SMTPEmailProvider;
