import { signOut } from '@/auth.js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();
  cookieStore.delete('access_token');
  await signOut();

  return NextResponse.json({ success: true });
}
