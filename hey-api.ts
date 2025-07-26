import { CreateClientConfig } from '@/services/client/client';
import { getAuthToken } from './services/auth/get-token';

export const createClientConfig: CreateClientConfig = config => ({
  ...config,
  auth: () => getAuthToken(),
});
