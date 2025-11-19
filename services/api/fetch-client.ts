import { getAuthToken } from '@/services/auth/get-token';
import { pluginToken } from '@zodios/plugins';
import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';
import { createApiClient } from './zod-client';

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    // fetch token, if it doesn’t exist
    const token = request.headers.get('Authorization');
    if (!token) {
      const accessToken = await getAuthToken();
      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
      } else {
        // handle auth error
        //console.log('No access token');
      }
    }
    // (optional) add logic here to refresh token when it expires
    // add Authorization header to every request
    return request;
  },
};

export const fetchClient = createClient<paths>({
  baseUrl: 'https://api.elimika.sarafrika.com',
});

fetchClient.use(authMiddleware);

export const zodClient = createApiClient('https://api.elimika.sarafrika.com');
zodClient.use(pluginToken({ getToken: getAuthToken }));
