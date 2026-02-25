const EmailProvider = require('./EmailProvider');
const { registerProvider } = require('../registry');

/**
 * SendGrid email provider — wraps @sendgrid/mail.
 *
 * Env vars:
 *   SENDGRID_API_KEY  — SendGrid API key
 *   SENDGRID_FROM_EMAIL — Default sender address
 */
class SendGridEmailProvider extends EmailProvider {
  constructor() {
    super();
    // Lazy-require so users without SendGrid don't need the dependency
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.sgMail = sgMail;
    this.defaultFrom = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';
  }

  async send(to, subject, html, opts = {}) {
    await this.sgMail.send({
      to,
      from: opts.from || this.defaultFrom,
      subject,
      html,
      text: opts.text,
    });
    console.log(`[SendGrid] Email sent to ${to}`);
  }

  async sendTemplate(to, templateId, vars, opts = {}) {
    await this.sgMail.send({
      to,
      from: opts.from || this.defaultFrom,
      templateId,
      dynamicTemplateData: vars,
      subject: opts.subject,
    });
    console.log(`[SendGrid] Template email sent to ${to} (template: ${templateId})`);
  }
}

registerProvider('email', 'sendgrid', () => new SendGridEmailProvider());

module.exports = SendGridEmailProvider;
