import type { CreateClientConfig } from '@/services/client/client';
import {
  ACTING_DOMAIN_HEADER,
  readActingDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';
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

/**
 * Stamps every request with the dashboard it was made from.
 *
 * Wired here, at the one place the generated client is configured, rather than
 * onto the handful of calls the course record happens to make today: the acting
 * domain qualifies every read, and any endpoint that learns to cap itself later
 * would otherwise need its call sites revisited one at a time.
 *
 * It has to be the `fetch` hook rather than a `headers` entry because this config
 * is built once, when the module loads, while the answer changes every time the
 * user switches dashboards. Reading it per request is the point.
 */
const actingDomainFetch: typeof globalThis.fetch = (input, init) => {
  const actingDomain = readActingDomain();
  if (!actingDomain) {
    return globalThis.fetch(input, init);
  }

  const headers = new Headers(init?.headers);
  headers.set(ACTING_DOMAIN_HEADER, actingDomain);
  return globalThis.fetch(input, { ...init, headers });
};

export const createClientConfig: CreateClientConfig = config => ({
  ...config,
  baseUrl: API_BASE_URL,
  fetch: actingDomainFetch,
  // Only attach the token when running on the server (direct upstream calls).
  // In the browser, requests go through /api/proxy which injects the session
  // token itself — calling getAuthToken() here would add a server-action
  // round trip to every single API request.
  auth: typeof window === 'undefined' ? async () => await getAuthToken() : undefined,
  next: { revalidate: process.env.PRODUCTION ? 1000 * 60 * 15 : 0.5 },
  querySerializer: serializeQuery,
});
