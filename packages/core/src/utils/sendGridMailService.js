// src/utils/sendGridMailService.js
const sgMail = require('@sendgrid/mail');
const { getConfig } = require('dotenv-handler');

class SendGridMailService {
  constructor() {
    sgMail.setApiKey(getConfig('SENDGRID_API_KEY'));
  }

  async sendEmail({ to, from, templateId, dynamicTemplateData, text, subject, html }) {
    try {
      const emailData = {
        to,
        from,
        subject,
      };

      // If using a template
      if (templateId) {
        emailData.templateId = templateId;
        emailData.dynamicTemplateData = dynamicTemplateData;
      } else {
        emailData.text = text;
        emailData.html = html;
      }
      await sgMail.send(emailData);
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error(`Error sending email to ${to}`, error);
      throw new Error('Failed to send email');
    }
  }
}

module.exports = SendGridMailService;
