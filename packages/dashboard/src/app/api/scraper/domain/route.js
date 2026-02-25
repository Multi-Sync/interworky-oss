import { NextResponse } from 'next/server';
import { getToken } from '@/_common/utils/tokenManager';

export async function POST(request) {
  try {
    const token = await getToken();
    const body = await request.json(); // Parse the incoming request body

    const domainStatusResponse = await fetch(`${process.env.SCRAPER_URL}/api/domain`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body), // Serialize body to JSON
    });

    if (!domainStatusResponse.ok) {
      const errorBody = await domainStatusResponse.json();
      console.error('Error from scraper server:', errorBody);
      return NextResponse.json(
        {
          success: false,
          message: errorBody.error || 'Error from scraper server',
          status: domainStatusResponse.status,
        },
        { status: domainStatusResponse.status },
      );
    }

    // Parse the response body from the scraper server
    const domainStatusResult = await domainStatusResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Domain Status fetched successfully',
      data: domainStatusResult.result,
      status: domainStatusResult.status,
    });
  } catch (error) {
    console.error('Failed to process request:', error.message);

    // Handle errors, including network issues
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process request',
        status: 500,
      },
      { status: 500 },
    );
  }
}
