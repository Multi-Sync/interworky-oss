/**
 * SMSProvider — Base class for SMS service providers.
 */
class SMSProvider {
  /**
   * Send an SMS message.
   * @param {string} to - Recipient phone number (E.164 format)
   * @param {string} body - Message content
   * @returns {Promise<void>}
   */
  async send(to, body) {
    throw new Error('send() not implemented');
  }
}

module.exports = SMSProvider;
