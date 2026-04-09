import type { CreateClientConfig } from '@/services/client/client';
import { API_BASE_URL } from './services/api/base-url';
import { getAuthToken } from './services/auth/get-token';

function appendQueryParam(parts: string[], name: string, value: unknown) {
  if (value === undefined || value === null) {
    return;
  }

  if (value instanceof Date) {
    parts.push(`${name}=${encodeURIComponent(value.toISOString())}`);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryParam(parts, name, item);
    }
    return;
  }

  if (typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      appendQueryParam(parts, `${name}[${key}]`, nestedValue);
    }
    return;
  }

  parts.push(`${name}=${encodeURIComponent(String(value))}`);
}

function serializeQuery(queryParams: unknown) {
  if (!queryParams || typeof queryParams !== 'object') {
    return '';
  }

  const parts: string[] = [];

  for (const [name, value] of Object.entries(queryParams)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (name === 'pageable' || name === 'searchParams')
    ) {
      for (const [nestedName, nestedValue] of Object.entries(value)) {
        appendQueryParam(parts, nestedName, nestedValue);
      }
      continue;
    }

    appendQueryParam(parts, name, value);
  }

  return parts.join('&');
}

export const createClientConfig: CreateClientConfig = config => ({
  ...config,
  baseUrl: API_BASE_URL,
  auth: async () => await getAuthToken(),
  next: { revalidate: process.env.PRODUCTION ? 1000 * 60 * 15 : 0.5 },
  querySerializer: serializeQuery,
});
