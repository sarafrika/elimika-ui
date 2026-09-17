import { clearPrivateBffCacheForUser } from '@/lib/api/private-bff-cache';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Keycloak from 'next-auth/providers/keycloak';

/**
 * Decode JWT token to extract claims
 */
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
        .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (_error) {
    //console.log('Error decoding JWT:', error);
    return {};
  }
}

type SessionWithUser = {
  user?: {
    email?: string | null;
    id?: string | null;
    id_token?: string | null;
  };
};

function getFirstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0);
}

function getSessionIdToken(session: unknown): string | undefined {
  if (!session || typeof session !== 'object') {
    return undefined;
  }

  const user = (session as SessionWithUser).user;
  if (!user || typeof user !== 'object') {
    return undefined;
  }

  const idToken = user.id_token;
  return typeof idToken === 'string' ? idToken : undefined;
}

function getSessionCacheUserId(session: unknown): string | undefined {
  if (!session || typeof session !== 'object') {
    return undefined;
  }

  const user = (session as SessionWithUser).user;
  if (!user || typeof user !== 'object') {
    return undefined;
  }

  return getFirstString(user.id, user.email);
}

function getTokenCacheUserId(token: unknown): string | undefined {
  if (!token || typeof token !== 'object') {
    return undefined;
  }

  const typedToken = token as { email?: unknown; id?: unknown };
  return getFirstString(typedToken.id, typedToken.email);
}

/**
 * Swap the refresh token for a fresh access token. Without this an admin session dies
 * quietly after an hour: the expired token is still sent and every call returns 401.
 * On failure the session carries `RefreshAccessTokenError` so the UI can ask for a new
 * sign-in instead of showing empty pages.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const issuer = process.env.KEYCLOAK_ISSUER;
    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
    const refreshToken = token.refreshToken;

    if (!issuer || !clientId || !clientSecret || typeof refreshToken !== 'string') {
      return { ...token, error: 'RefreshAccessTokenError' };
    }

    const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    const refreshed = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      id_token?: string;
    };

    if (!response.ok || !refreshed.access_token) {
      return { ...token, error: 'RefreshAccessTokenError' };
    }

    const decoded = decodeJWT(refreshed.access_token);

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? refreshToken,
      accessTokenExpires: Date.now() + (refreshed.expires_in ?? 300) * 1000,
      id_token: refreshed.id_token ?? token.id_token,
      realm_access: decoded.realm_access ?? token.realm_access,
      resource_access: decoded.resource_access ?? token.resource_access,
      organisation: decoded.organisation ?? token.organisation,
      'organisation-slug': decoded['organisation-slug'] ?? token['organisation-slug'],
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
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

      // Initial sign in
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

      // Refresh a minute early so a call in flight never carries an expired token.
      const expiresAt = token.accessTokenExpires as number | undefined;
      if (typeof expiresAt === 'number' && Date.now() < expiresAt - 60_000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          accessToken: token.accessToken as string,
          id_token: token.id_token as string,
        };
      }

      // Include decoded token information in session
      session.decoded = {
        ...token,
        realm_access: token.realm_access,
        resource_access: token.resource_access,
        organisation: token.organisation,
        'organisation-slug': token['organisation-slug'],
      };

      // Include error state if token refresh failed
      if (token.error) {
        session.error = token.error as 'RefreshAccessTokenError';
      }

      return session;
    },
  },
  events: {
    async signOut(event) {
      const cacheUserId =
        'token' in event
          ? getTokenCacheUserId(event.token)
          : 'session' in event
            ? getSessionCacheUserId(event.session)
            : undefined;

      if (cacheUserId) {
        clearPrivateBffCacheForUser(cacheUserId);
      }

      // Try to get ID token from either source
      let idToken: string | undefined;

      // Check if event has token property (JWT strategy)
      if ('token' in event && event.token?.id_token) {
        idToken = event.token.id_token as string;
      }
      // Check if event has session property (database strategy)
      else if ('session' in event && event.session) {
        idToken = getSessionIdToken(event.session);
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
        //console.log('✅ Keycloak session cleared.');
      } catch (_err) {}
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(config);
