import type { UserDomain } from '@/lib/types';

export const ACTIVE_DASHBOARD_COOKIE = 'elimika-active-dashboard';
const ACTIVE_DASHBOARD_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const ALLOWED_DOMAINS: UserDomain[] = [
  'student',
  'instructor',
  'admin',
  'parent',
  'course_creator',
  'organisation_user',
  'organisation',
] as const;

export function normalizeStoredUserDomain(domain: unknown): UserDomain | null {
  if (typeof domain !== 'string') return null;
  const normalized = domain === 'organization' ? 'organisation' : domain;
  return ALLOWED_DOMAINS.includes(normalized as UserDomain) ? (normalized as UserDomain) : null;
}

export function readPersistedDashboardDomain(storageKey: string): UserDomain | null {
  if (typeof window === 'undefined') return null;

  const localValue = window.localStorage.getItem(storageKey);
  const normalizedLocalValue = normalizeStoredUserDomain(localValue);
  if (normalizedLocalValue) {
    return normalizedLocalValue;
  }

  const cookieMatch = window.document.cookie
    .split('; ')
    .find(entry => entry.startsWith(`${ACTIVE_DASHBOARD_COOKIE}=`));
  const cookieValue = cookieMatch?.split('=')[1];

  return normalizeStoredUserDomain(cookieValue ? decodeURIComponent(cookieValue) : null);
}

export function persistDashboardDomain(storageKey: string, domain: UserDomain) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(storageKey, domain);
  window.document.cookie = `${ACTIVE_DASHBOARD_COOKIE}=${encodeURIComponent(domain)}; path=/; max-age=${ACTIVE_DASHBOARD_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearPersistedDashboardDomain(storageKey: string) {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(storageKey);
  window.document.cookie = `${ACTIVE_DASHBOARD_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
