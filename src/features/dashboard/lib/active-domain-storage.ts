import type { UserDomain } from '@/lib/types';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

export const ACTIVE_DASHBOARD_COOKIE = 'elimika-active-dashboard';
export const ACTIVE_DASHBOARD_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const DASHBOARD_STORAGE_KEY_PREFIX = 'elimika-dashboard-view:';

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

  const cookieMatch = window.document.cookie
    .split('; ')
    .find(entry => entry.startsWith(`${ACTIVE_DASHBOARD_COOKIE}=`));
  const cookieValue = cookieMatch?.split('=')[1];
  const normalizedCookieValue = normalizeStoredUserDomain(
    cookieValue ? decodeURIComponent(cookieValue) : null
  );

  if (normalizedCookieValue) {
    window.localStorage.setItem(storageKey, normalizedCookieValue);
    return normalizedCookieValue;
  }

  const localValue = window.localStorage.getItem(storageKey);
  const normalizedLocalValue = normalizeStoredUserDomain(localValue);
  if (normalizedLocalValue) {
    return normalizedLocalValue;
  }

  return null;
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

export function clearAllPersistedDashboardDomains() {
  if (typeof window === 'undefined') return;

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(DASHBOARD_STORAGE_KEY_PREFIX)) {
      window.localStorage.removeItem(key);
    }
  }

  window.document.cookie = `${ACTIVE_DASHBOARD_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function buildDashboardSwitchPath(domain: UserDomain, nextPath = '/dashboard/overview') {
  const searchParams = new URLSearchParams({ next: nextPath });
  return `/dashboard/switch/${domain}?${searchParams.toString()}`;
}

export function isInternalDashboardPath(path?: string | null) {
  return Boolean(path?.startsWith('/dashboard'));
}

function splitDashboardPath(path: string) {
  const [pathname = '', search = ''] = path.split('?');

  return {
    pathname,
    search: search ? `?${search}` : '',
  };
}

export function normalizeRequestedDashboardPath(path?: string | null) {
  if (!path || !isInternalDashboardPath(path)) {
    return '/dashboard/overview';
  }

  const { pathname, search } = splitDashboardPath(path);

  if (pathname.startsWith('/dashboard/workspace/')) {
    const segments = pathname.split('/');
    const remainder = segments.slice(4).filter(Boolean);
    const workspacePath = remainder.length ? `/dashboard/${remainder.join('/')}` : '/dashboard/overview';
    return `${workspacePath}${search}`;
  }

  return `${pathname}${search}`;
}

/**
 * Build a role-scoped dashboard URL for `domain`. Formerly this produced
 * `/dashboard/workspace/<domain>/...`; now every role has a real URL segment, so
 * it delegates to the canonical `dashboardUrl` helper. Kept under the old name so
 * the ~85 existing call sites (sidebar nav, breadcrumbs, shared course pages) all
 * emit segment URLs without edits.
 */
export function buildWorkspaceAliasPath(domain: UserDomain | null, path = '/dashboard/overview') {
  if (!domain || !isInternalDashboardPath(path)) {
    return path;
  }

  return dashboardUrl(domain, normalizeRequestedDashboardPath(path));
}

export function resolveWorkspaceSwitchPath(domain: UserDomain | null, requestedPath?: string | null) {
  const normalizedRequestedPath = normalizeRequestedDashboardPath(requestedPath);

  if (!domain) {
    return normalizedRequestedPath;
  }

  return dashboardUrl(domain, normalizedRequestedPath);
}
