import { sendPostRequest } from './baseMethods';

export async function getSessionKey(instructions = '') {
  const path = 'api/session-provider/session-key';
  const body = {
    instructions: instructions,
  };
  try {
    const response = await sendPostRequest(path, body);
    return response;
  } catch (error) {
    console.error('Error in getSessionKey:', error);
  }
}

// POST  SDP to OpenAI to get the answer
export async function answerSdpRequest(key, sdp) {
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const realtimeModel = process.env.AI_REALTIME_MODEL || 'gpt-4o-realtime-preview';
  const url = `${baseUrl}/realtime?model=${realtimeModel}`;
  const token = key;
  const body = sdp;

  try {
    const response = await sendPostRequest(
      '',
      body,
      url,
      token,
      'application/sdp'
    );
    return response;
  } catch (error) {
    console.error('Error in answerSdp:', error);
  }
}
