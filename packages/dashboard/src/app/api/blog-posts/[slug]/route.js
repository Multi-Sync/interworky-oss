import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { slug } = params;

  //pass token
  const token = process.env.STRAPI_TOKEN;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${process.env.STRAPI_URL}/api/blogs?filters\[Slug\][$eq]=${slug}&populate=*`, {
    method: 'GET',
    headers,
  });

  const json = await res.json();
  const post = json.data[0];
  return NextResponse.json(post);
}
