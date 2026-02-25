import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  const { message } = await req.json();
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!slackWebhookUrl) {
    console.error('SLACK_WEBHOOK_URL is missing.');
    return NextResponse.json({ error: 'Webhook URL is not configured' }, { status: 500 });
  }

  try {
    const response = await axios.post(slackWebhookUrl, { text: message });
    return NextResponse.json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error('❌ Error sending Slack message:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
