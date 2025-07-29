import NextAuth, { NextAuthConfig } from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import { User } from '@/services/client';

function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const base64Url = parts[1];
    if (!base64Url) {
      throw new Error('Invalid JWT payload');
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return {};
  }
}

async function fetchUserData<T>(
  endpoint: string,
  queryParams: Record<string, string | undefined>,
  accessToken: string
): Promise<T | undefined> {
  const url = new URL(endpoint);
  for (const key in queryParams) {
    const value = queryParams[key];
    if (value !== undefined) {
      url.searchParams.append(key, value);
    }
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const jsonResponse = await response.json();
    return jsonResponse.data?.content?.[0] || jsonResponse.content?.[0];
  } catch (error) {
    return undefined;
  }
}

const config: NextAuthConfig = {
  session: { strategy: 'jwt' },
  providers: [
    Keycloak({
      name: 'Sarafrika',
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
      authorization: {
        params: {
          scope: 'openid profile email',
          response_type: 'code',
          code_challenge_method: 'S256',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, session, trigger }) {
      if (trigger === 'update') {
      }

      if (account && user) {
        const decodedToken = decodeJWT(account.access_token!);

        return {
          ...token,
          id: account.providerAccountId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 60 * 60 * 1000,
          id_token: account.id_token,
          realm_access: decodedToken.realm_access,
          resource_access: decodedToken.resource_access,
          organisation: decodedToken.organisation,
          'organisation-slug': decodedToken['organisation-slug'],
        };
      }

      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
          const userAccessToken = token.accessToken as string;

          const userEmail = session.user.email || '';

          const userDataResults = await fetchUserData<User>(
            `${apiBaseUrl}/users/search`,
            { email_eq: userEmail },
            userAccessToken
          );

          let studentData: User | undefined;
          let instructorData: User | undefined;

          if (userDataResults?.user_domain?.length && userDataResults.uuid) {
            for (const domain of userDataResults.user_domain) {
              if (domain === 'student') {
                studentData = await fetchUserData<User>(
                  `${apiBaseUrl}/students/search`,
                  { user_uuid_eq: userDataResults.uuid },
                  userAccessToken
                );
              }
              if (domain === 'instructor') {
                instructorData = await fetchUserData<User>(
                  `${apiBaseUrl}/instructors/search`,
                  { user_uuid_eq: userDataResults.uuid },
                  userAccessToken
                );
              }
            }
          }

          // Assign values carefully, using optional chaining and nullish coalescing
          session.user = {
            ...session.user,
            ...(userDataResults || {}),
            student_uuid: studentData?.uuid || '',
            instructor_uuid: instructorData?.uuid || '',
            id: token.id as string,
            accessToken: token.accessToken as string,
            id_token: token.id_token as string,
          };

        } catch (e) {
          session.user.id = token.id as string;
          session.user.accessToken = token.accessToken as string;
          session.user.id_token = token.id_token as string;
        }
      }

      session.decoded = {
        ...token,
        realm_access: token.realm_access,
        resource_access: token.resource_access,
        organisation: token.organisation,
        'organisation-slug': token['organisation-slug'],
      };

      if (token.error) {
        session.error = token.error as 'RefreshAccessTokenError';
      }

      return session;
    },
  },
  events: {
    async signOut(event) {
      let idToken: string | undefined;

      if ('token' in event && event.token?.id_token) {
        idToken = event.token.id_token as string;
      } else if ('session' in event && event.session) {
        const customSession = event.session as any;
        idToken = customSession.user?.id_token;
      }

      if (!idToken) {
        return;
      }

      const logoutUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;
      try {
        await fetch(logoutUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.KEYCLOAK_CLIENT_ID!,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
            id_token_hint: idToken,
          }),
        });
      } catch (err) {
      }
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(config);