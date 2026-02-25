import { NextResponse } from 'next/server';

export async function GET() {
  //pass token
  const token = process.env.STRAPI_TOKEN;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Add cache-busting query parameter
  const timestamp = new Date().getTime();
  const url = `${process.env.STRAPI_URL}/api/blogs?populate=*&timestamp=${timestamp}`;
  const res = await fetch(url, {
    method: 'GET',
    headers,
    // Revalidate once per day (86400 seconds)
    next: { revalidate: 86400 },
  });

  const json = await res.json();
  // return just the array of posts
  return NextResponse.json(json.data);
}
