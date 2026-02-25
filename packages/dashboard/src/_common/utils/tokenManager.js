import { cookies } from 'next/headers';
import { auth } from '@/auth';

export async function getToken() {
  try {
    // Try to get token from NextAuth session first
    const session = await auth();

    if (session?.backendToken) {
      return session.backendToken;
    }

    // Try to get token from cookies
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    if (cookieToken) {
      return cookieToken;
    }

    // Fallback to environment variable
    if (process.env.ACCESS_TOKEN) {
      return process.env.ACCESS_TOKEN;
    }

    return null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}
