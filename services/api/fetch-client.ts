import createClient, { type Middleware } from 'openapi-fetch';
import { getAuthToken } from '@/services/auth/get-token';
import {
  ACTING_DOMAIN_HEADER,
  readActingDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';
import { API_BASE_URL } from './base-url';
import type { paths } from './schema';

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    // The dashboard this call was made from. The server uses it to cap the
    // caller's footing — never to raise it — so a multi-role account reads a
    // course as whatever the page they are standing on is entitled to.
    const actingDomain = readActingDomain();
    if (actingDomain) {
      request.headers.set(ACTING_DOMAIN_HEADER, actingDomain);
    }

    // Browser requests go through /api/proxy, which injects the session token
    // itself — fetching it here would cost a server-action round trip per
    // request. Only attach the token for direct server-side calls.
    if (typeof window === 'undefined' && !request.headers.get('Authorization')) {
      const accessToken = await getAuthToken();
      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
      }
    }
    return request;
  },
};

export const fetchClient = createClient<paths>({
  baseUrl: API_BASE_URL,
});

fetchClient.use(authMiddleware);
