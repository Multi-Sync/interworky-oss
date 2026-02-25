import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function PUT(request, { params }) {
  const { organization_id } = await params;
  const token = await getToken();

  try {
    // Parse the form data from the request
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response('No file uploaded', { status: 400 });
    }

    // Prepare form data for the backend API
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch(`${apiUrl}/api/assistant-info/${organization_id}/image`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendFormData,
    });

    if (!response.ok) {
      console.error('Failed to upload image via backend:', response.statusText);
      return new Response('Failed to upload image', { status: response.status });
    }

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return new Response('Failed to upload image', { status: 500 });
  }
}
