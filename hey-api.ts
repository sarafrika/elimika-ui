import { CreateClientConfig } from '@/services/client/client';
import { getAuthToken } from './services/auth/get-token';

export const createClientConfig: CreateClientConfig = config => ({
  ...config,
  auth: () => getAuthToken(),
  next: { revalidate: 1000 * 60 * 60 },
  querySerializer: (qp) => {
    const serialize = (obj: { [key: string]: string }): string => Object.keys(obj)
      .map((key: string) => {
        return typeof obj[key] === 'object' ? serialize(obj[key]) : `${encodeURIComponent(key)}=${encodeURIComponent(obj[key] as string)}`
      })
      .join('&');

    const queryString = serialize(qp as { [key: string]: any });
    return queryString;
  }
});
