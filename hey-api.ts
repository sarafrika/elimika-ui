import type { CreateClientConfig } from '@/services/client/client';
import { createQuerySerializer } from '@/services/client/client/utils.gen';
import { API_BASE_URL } from './services/api/base-url';
import { getAuthToken } from './services/auth/get-token';

export const createClientConfig: CreateClientConfig = config => ({
  ...config,
  baseUrl: API_BASE_URL,
  auth: async () => await getAuthToken(),
  next: { revalidate: process.env.PRODUCTION ? 1000 * 60 * 15 : 0.5 },
  querySerializer: createQuerySerializer(),
});
