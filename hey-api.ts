import { client } from '@/services/client/client.gen';
import { getAuthToken } from './services/auth/get-token';
import { CreateClientConfig } from '@/services/client/client';


export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  auth: () => getAuthToken()
});