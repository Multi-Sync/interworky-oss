const { generateTemplate } = require('./appointment_notification.utils');
const { templates, actionMap } = require('./appointment_notification.constants');
const { getEmailProvider, getSMSProvider } = require('@interworky/providers');
const { getConfig } = require('dotenv-handler');

// Strategy Interface (for understanding)
class NotificationStrategy {
  compose(template, data) {
    throw new Error('Method not implemented');
  }
}

// Email Strategy
class EmailStrategy extends NotificationStrategy {
  constructor() {
    super();
    this.type = 'email';
  }

  compose(template, data) {
    const subject = generateTemplate(template.subject, data);
    const body = generateTemplate(template.body, data);
    return { subject, body };
  }
}

// SMS Strategy
class SMSStrategy extends NotificationStrategy {
  constructor() {
    super();
    this.type = 'sms';
  }

  compose(template, data) {
    const body = generateTemplate(template.body, data);
    return { body };
  }
}

// Notification Composer (Context)
class NotificationComposer {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  composeNotification(type, data) {
    const templateType = this.strategy.type;
    if (!templates[type]) {
      throw new Error(`Template type "${type}" not found`);
    }
    if (!templates[type][templateType]) {
      throw new Error(`Template for message type "${templateType}" not found in "${type}"`);
    }
    const template = templates[type][templateType];
    return this.strategy.compose(template, data);
  }
}

// Notification Dispatcher

class NotificationDispatcher {
  constructor() {
    // You can inject dependencies like notification services here if needed
  }

  /**
   *
   * @param {keyof actionMap} status
   * @param {{
   * 'Patient Name': string,
   * 'Doctor Name': string,
   * 'Clinic Name': string,
   * 'Appointment Type': string,
   * 'Requested Date/Time': string,
   * 'Confirmed Date/Time': string,
   * 'Clinic Phone Number': string,
   * 'Clinic Admin/Contact': string,
   * 'New Date/Time': string,
   * 'Appointment Date': string,
   * 'Link to Feedback Form': string,
   * 'Link to Feedback Page': string,
   * }} data
   * @param {{
   * Doctor: { email: string, phone: string },
   * Patient: { email: string, phone: string },
   * }} recipients
   * @returns
   */

  dispatch(status, data, recipients) {
    const actions = actionMap[status];
    console.log(actions);
    if (!actions || actions.length === 0) {
      console.log(`No actions defined for status: ${status}`);
      return;
    }

    actions.forEach(action => {
      const recipientInfo = recipients[action.recipient];
      if (!recipientInfo) {
        console.error(`Recipient information for ${action.recipient} not provided.`);
        return;
      }

      action.channels.forEach(channel => {
        let strategy;
        if (channel === 'email') {
          strategy = new EmailStrategy();
        } else if (channel === 'sms') {
          strategy = new SMSStrategy();
        } else {
          console.error(`Unsupported channel: ${channel}`);
          return;
        }

        const composer = new NotificationComposer(strategy);

        try {
          const notification = composer.composeNotification(action.templateKey, data);
          this.sendNotification(channel, notification, recipientInfo);
        } catch (error) {
          console.error(`Error composing notification: ${error.message}`);
        }
      });
    });
  }

  sendNotification(channel, notification, recipientInfo) {
    if (channel === 'email') {
      const emailProvider = getEmailProvider();
      emailProvider
        .send(recipientInfo.email, notification.subject, notification.body, {
          from: process.env.SENDGRID_FROM_EMAIL,
        })
        .catch(error => {
          console.error(`Error sending email to ${recipientInfo.email}`, error);
        });
    } else if (channel === 'sms') {
      if (recipientInfo.phone) {
        const smsProvider = getSMSProvider();
        smsProvider.send(recipientInfo.phone, notification.body).catch(error => {
          console.error(`Error sending SMS to ${recipientInfo.phone}`, error);
        });
      } else {
        console.error(`Phone number not provided for ${recipientInfo.email}`);
      }
    }
  }
}

module.exports = {
  NotificationDispatcher,
  NotificationComposer,
  EmailStrategy,
  SMSStrategy,
};
