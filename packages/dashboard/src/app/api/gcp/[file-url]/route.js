import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    // Decode the URL passed as the dynamic segment
    const awaitedParams = await params;
    const encodedUrl = awaitedParams['file-url'];
    const fileUrl = decodeURIComponent(encodedUrl);

    // Fetch the file from Google Cloud Storage
    const res = await fetch(fileUrl);
    if (!res.ok) {
      console.error(`Failed to fetch ${fileUrl}: ${res.status} ${res.statusText}`);
      // Return empty on error
      return new NextResponse('', { status: 200 });
    }

    const text = await res.text();
    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error in GET /api/gcp/[file-url]:', error);
    return new NextResponse('', { status: 200 });
  }
}
