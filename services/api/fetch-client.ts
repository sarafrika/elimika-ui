import { getAuthToken } from '@/services/auth/get-token';
import { pluginToken } from '@zodios/plugins';
import createClient, { type Middleware } from 'openapi-fetch';
import { API_BASE_URL } from './base-url';
import type { paths } from './schema';
import { createApiClient } from './zod-client';

const authMiddleware: Middleware = {
  async onRequest({ request }) {
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

export const zodClient = createApiClient(API_BASE_URL);
zodClient.use(pluginToken({ getToken: getAuthToken }));
