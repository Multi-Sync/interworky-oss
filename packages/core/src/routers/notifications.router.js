// notifications.router.js
const express = require('express');
const notificationsRouter = express.Router();
const sendSlackMessage = require('../utils/slackCVP');
const email_webhook = process.env.SLACK_EMAIL_WEBHOOK_URL;
notificationsRouter.use(express.json());

notificationsRouter.post('/sendgrid/webhook', async (req, res) => {
  const events = req.body;
  for (const event of events) {
    console.log(`Received event: ${event.event} for ${event.email} at ${event.timestamp}`);

    const eventTime = new Date(event.timestamp * 1000).toLocaleString();

    let slackMessage = `SendGrid event: ${event.event}\nEmail: ${event.email}\nTime: ${eventTime}`;

    // if the event is send show the email subject
    if (event.event === 'processed' && event.email) {
      slackMessage += `\nSubject: ${event.subject || 'No subject available'}`;
    }

    // Send the Slack notification
    await sendSlackMessage(slackMessage, email_webhook);
  }

  // Respond with 200 OK to acknowledge receipt of events
  res.sendStatus(200);
});

module.exports = notificationsRouter;
