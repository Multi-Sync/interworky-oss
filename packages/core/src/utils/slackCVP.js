const axios = require('axios');

const sendSlackMessage = async (message, webhookUrl = '') => {
  const slackWebhookUrl = webhookUrl || process.env.SLACK_WEBHOOK_URL;

  if (!slackWebhookUrl) {
    return; // Slack not configured — silently skip
  }

  try {
    await axios.post(slackWebhookUrl, {
      text: `${message}`,
    });
  } catch (error) {
    console.error('Error sending message to Slack:', error);
  }
};

module.exports = sendSlackMessage;
