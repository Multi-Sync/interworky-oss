import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  const { organization_id } = await params;
  const token = await getToken();

  try {
    const response = await fetch(`${apiUrl}/api/assistant-info/${organization_id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const assistantInfo = await response.json();
    return new Response(JSON.stringify(assistantInfo), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching assistant-info.json:', error);
    return new Response('Failed to fetch AI Agent Info', { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { organization_id } = await params;
  const token = await getToken();

  const data = await request.json();

  try {
    const response = await fetch(`${apiUrl}/api/assistant-info/${organization_id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const assistantInfoResponse = await response.json();
    return new Response(JSON.stringify(assistantInfoResponse), {
      status: response.status,
    });
  } catch (error) {
    console.error('Error updating assistant-info.json:', error);
    return new Response('Failed to update AI Agent info', { status: 500 });
  }
}
