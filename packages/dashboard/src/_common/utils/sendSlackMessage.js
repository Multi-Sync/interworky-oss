import axios from 'axios';

// For server-side use: sends message directly to Slack webhook
export const sendSlackMessage = async message => {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    throw new Error('Webhook URL is not configured');
  }
  try {
    const response = await axios.post(slackWebhookUrl, { text: message });
    return response;
  } catch (error) {
    console.error('error while saving analytics');
  }
};
