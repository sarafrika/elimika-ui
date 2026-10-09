import NextAuth, { type NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Keycloak from 'next-auth/providers/keycloak';
import { clearPrivateBffCacheForUser } from '@/lib/api/private-bff-cache';

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

// Lets the client start the organisation fetch alongside `/me` instead of after it.
function activeOrganisationUuid(
  affiliations: { active?: boolean; organisation_uuid?: string }[] | null | undefined
): string | null {
  const affiliation = affiliations?.find(a => a.active) ?? affiliations?.[0];
  return affiliation?.organisation_uuid ?? null;
}

// Stamp who the caller is into the token so server guards need no `/me` per navigation.
// A failed lookup keeps what the token held; the guards then fall back to the API.
async function stampIdentity(token: JWT): Promise<JWT> {
  if (typeof token.accessToken !== 'string' || token.error) return token;
  try {
    // Imported lazily: the generated client imports this module for its auth hook.
    const { fetchCurrentUser } = await import('@/services/user/current-user');
    const user = await fetchCurrentUser(token.accessToken, AbortSignal.timeout(3_000));
    if (!user?.uuid) return token;
    const rawDomains: unknown[] = Array.isArray(user.user_domain)
      ? user.user_domain
      : [user.user_domain];
    return {
      ...token,
      identity: {
        uuid: user.uuid,
        domains: rawDomains.filter((d): d is string => typeof d === 'string' && d.length > 0),
        hasOrganisationAffiliation: (user.organisation_affiliations?.length ?? 0) > 0,
        organisationUuid: activeOrganisationUuid(user.organisation_affiliations),
      },
    };
  } catch {
    return token;
  }
}

type TokenPatch = Partial<JWT>;
type RefreshEntry = { promise: Promise<TokenPatch>; reuseUntil: number };

const REFRESH_FAILED: TokenPatch = { error: 'RefreshAccessTokenError' };
const REFRESH_EARLY_MS = 60_000;
const FAILED_REFRESH_MEMORY_MS = 5 * 60_000;
const TRANSIENT_FAILURE_MEMORY_MS = 10_000;
const REFRESH_TIMEOUT_MS = 10_000;
// Keycloak outage or timeout: keep the current token and retry shortly, never end the session.
const REFRESH_DEFERRED: TokenPatch = {};

// One map per process, shared by proxy.ts and route handlers; needs both on the Node runtime.
const refreshesKey = Symbol.for('elimika.auth.refreshes');
const refreshes: Map<string, RefreshEntry> =
  ((globalThis as Record<symbol, unknown>)[refreshesKey] as
    | Map<string, RefreshEntry>
    | undefined) ??
  ((globalThis as Record<symbol, unknown>)[refreshesKey] = new Map<string, RefreshEntry>());

/**
 * Swap the refresh token for a fresh access token. A rejected refresh token marks the
 * session `RefreshAccessTokenError`; network errors and 5xx keep the current token.
 */
async function refreshAccessToken(token: JWT): Promise<TokenPatch> {
  try {
    const issuer = process.env.KEYCLOAK_ISSUER;
    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
    const refreshToken = token.refreshToken;

    if (!issuer || !clientId || !clientSecret || typeof refreshToken !== 'string') {
      return REFRESH_FAILED;
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
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    });

    if (!response.ok && response.status !== 400 && response.status !== 401) {
      return REFRESH_DEFERRED;
    }

    const refreshed = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      id_token?: string;
    };

    if (!response.ok || !refreshed.access_token) {
      return REFRESH_FAILED;
    }

    const decoded = decodeJWT(refreshed.access_token);

    return {
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
    return REFRESH_DEFERRED;
  }
}

function pruneRefreshes(now: number) {
  for (const [key, entry] of refreshes) {
    if (entry.reuseUntil <= now) refreshes.delete(key);
  }
}

/**
 * Refresh at most once per refresh token: concurrent and later callers still holding
 * the old cookie reuse the same result, so Keycloak sees one call and a rotated
 * refresh token is never replayed. Failures are remembered too, so they are not retried.
 */
async function refreshOnce(token: JWT): Promise<JWT> {
  const key = token.refreshToken;
  if (typeof key !== 'string') return { ...token, ...REFRESH_FAILED };

  const now = Date.now();
  pruneRefreshes(now);

  let entry = refreshes.get(key);
  if (!entry) {
    // Identity is re-stamped inside the shared promise so one refresh costs one `/me`.
    const promise = refreshAccessToken(token).then(async patch =>
      patch.accessToken
        ? { ...patch, identity: (await stampIdentity({ ...token, ...patch })).identity }
        : patch
    );
    const pending: RefreshEntry = { promise, reuseUntil: Number.POSITIVE_INFINITY };
    entry = pending;
    refreshes.set(key, pending);
    void promise.then(patch => {
      pending.reuseUntil =
        typeof patch.accessTokenExpires === 'number'
          ? patch.accessTokenExpires - REFRESH_EARLY_MS
          : Date.now() + (patch.error ? FAILED_REFRESH_MEMORY_MS : TRANSIENT_FAILURE_MEMORY_MS);
    });
  }

  return { ...token, ...(await entry.promise) };
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
      if (trigger === 'update' && session) {
        session.user = user;
      }

      // Initial sign in
      if (account && user) {
        const decodedToken = decodeJWT(account.access_token!);
        return stampIdentity({
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
        });
      }

      // A failed refresh was already reported once; drop the session instead of retrying.
      if (token.error) {
        return null;
      }

      // Refresh a minute early so a call in flight never carries an expired token.
      const expiresAt = token.accessTokenExpires as number | undefined;
      if (typeof expiresAt === 'number' && Date.now() < expiresAt - REFRESH_EARLY_MS) {
        // Onboarding and role changes call `update()`; re-read identity so guards see the new domain.
        return trigger === 'update' ? stampIdentity(token) : token;
      }

      return refreshOnce(token);
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

      if (token.identity) {
        session.identity = token.identity;
      }

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

export const { auth, handlers } = NextAuth(config);
