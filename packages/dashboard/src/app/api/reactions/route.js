import { sendSlackMessage } from '@/_common/utils/sendSlackMessage';

export async function POST(req) {
  try {
    const { conversationId, patientId, reaction } = await req.json();
    if (!conversationId || !patientId || !reaction) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }

    let message;
    if (reaction === 'thumbsup') {
      message = `👍 Patient ${patientId} likes conversation ${conversationId}👍`;
    } else if (reaction === 'thumbsdown') {
      message = `👎 Patient ${patientId} doesn't like conversation ${conversationId}👎`;
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Invalid reaction type' }), { status: 400 });
    }

    const slackResponse = await sendSlackMessage(message);
    return new Response(JSON.stringify({ success: true, message: 'Reaction sent to Slack' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
