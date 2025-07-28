import NextAuth, { NextAuthConfig } from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import { search, searchInstructors, searchStudents } from '@/services/client';

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
        session.user = user;
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
          const searchResp = await search({
            query: {
              searchParams: {
                email_eq: session.user?.email,
              },
            },
          });

          const userData = searchResp?.data?.data?.content?.[0];

          if (userData) {
            session.user = {
              ...session.user,
              ...userData,
              id: token.id as string,
              accessToken: token.accessToken as string,
              id_token: token.id_token as string,
            };

            const domains = userData?.user_domain;

            if (domains) {
              for (const domain of domains) {
                if (domain === 'student') {
                  const studentSearch = await searchStudents({
                    query: {
                      searchParams: {
                        user_uuid_eq: userData.uuid,
                      },
                    },
                  });

                  const studentData = studentSearch?.data?.content?.[0];
                  if (studentData) {
                    (session.user as any).studentData = studentData;
                  }
                }

                if (domain === 'instructor') {
                  const instructorSearch = await searchInstructors({
                    query: {
                      searchParams: {
                        user_uuid_eq: userData.uuid,
                      },
                    },
                  });

                  const instructorData = instructorSearch?.data?.content?.[0];
                  if (instructorData) {
                    (session.user as any).instructorData = instructorData;
                  }
                }
              }
            }

            console.log(session.user);
          } else {
            session.user.id = token.id as string;
            session.user.accessToken = token.accessToken as string;
            session.user.id_token = token.id_token as string;
          }
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
        console.warn('No ID token found for Keycloak logout - performing local logout only');
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
        console.warn('⚠️ Failed to logout Keycloak session', err);
      }
    },
  },
};

export const { auth, handlers } = NextAuth(config);