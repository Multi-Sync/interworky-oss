/**
 * EmailProvider — Base class for email service providers.
 */
class EmailProvider {
  /**
   * Send an email.
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} html - HTML body
   * @param {object} [opts] - Additional options (from, cc, bcc, attachments)
   * @returns {Promise<void>}
   */
  async send(to, subject, html, opts = {}) {
    throw new Error('send() not implemented');
  }

  /**
   * Send an email using a provider-specific template.
   * @param {string} to - Recipient email address
   * @param {string} templateId - Template identifier
   * @param {object} vars - Template variables
   * @param {object} [opts] - Additional options (from, subject)
   * @returns {Promise<void>}
   */
  async sendTemplate(to, templateId, vars, opts = {}) {
    throw new Error('sendTemplate() not implemented');
  }
}

module.exports = EmailProvider;
