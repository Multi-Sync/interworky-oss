import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { apiUrl } from './_common/constants';
import { sendSlackMessage } from './_common/utils/sendSlackMessage';
import { jwtDecode } from 'jwt-decode';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        };
      },
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const response = await fetch(`${apiUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              backendToken: data.token,
              hasOrg: data.user.hasOrg,
            };
          }
          return null;
        } catch (error) {
          console.error('Error during credentials authorization:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    // Set session to expire in 7 days (604800 seconds)
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        try {
          // Send Google profile to your backend to create/update user
          const response = await fetch(`${apiUrl}/api/provider`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }),
          });

          if (!response.ok) {
            return false;
          }

          const data = await response.json();
          // Store the JWT token from your backend
          user.backendToken = data.token;
          user.id = data.id;
          user.hasOrg = data.hasOrg;
          user.email = profile.email;

          // Send Slack message directly
          await sendSlackMessage(`${profile?.email} has logged in using Google`);

          return true;
        } catch (error) {
          console.error('Error during Google sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.backendToken) {
        token.backendToken = user.backendToken;
        token.id = user.id;
        token.hasOrg = user.hasOrg;
        token.email = user.email;
      }

      // Allow manual updates to organizationId via session update
      if (trigger === 'update' && session?.organizationId) {
        token.organizationId = session.organizationId;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.backendToken) {
        try {
          const decoded = jwtDecode(token.backendToken);
          const currentTime = Math.floor(Date.now() / 1000);

          if (decoded.exp && decoded.exp < currentTime) {
            return null;
          }

          session.backendToken = token.backendToken;
          session.id = token.id;
          session.hasOrg = token.hasOrg;
          session.email = token.email;

          // Fetch organization ID if user has an organization and it's not already in the token
          if (token.hasOrg && !token.organizationId) {
            try {
              const orgResponse = await fetch(`${apiUrl}/api/organizations/creator-id/${token.id}`, {
                headers: {
                  Authorization: `Bearer ${token.backendToken}`,
                },
              });

              if (orgResponse.ok) {
                const orgData = await orgResponse.json();
                if (orgData?.organization?.id) {
                  token.organizationId = orgData.organization.id;
                  session.organizationId = orgData.organization.id;
                }
              }
            } catch (error) {
              console.error('Error fetching organization ID:', error);
            }
          } else if (token.organizationId) {
            session.organizationId = token.organizationId;
          }

          return session;
        } catch (error) {
          console.error('Error validating token:', error);
          return null;
        }
      }
      return null; // No token present, force logout
    },
    async signOut({ token, session }) {
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      if (sessionStorage) {
        sessionStorage.clear();
      }
      token = null;
      session = null;
      return true;
    },
  },
});
