import type { UserDomain } from '@/lib/types';
import { dashboardUrl, domainFromPath } from '@/src/features/dashboard/lib/dashboard-url';

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

/**
 * The header every API call carries the active dashboard on.
 *
 * The server used to answer "what is the highest footing this person holds",
 * which is the same answer on every page — so an account that is an admin as
 * well as a student read every course as an admin, including from the student
 * dashboard and including courses they had never enrolled in. This header is the
 * missing half of the question. The server treats it as a request to be given
 * *less*: it caps the footing and never raises one, so it is not a credential
 * and forging it buys nothing.
 */
export const ACTING_DOMAIN_HEADER = 'X-Acting-Domain';

/**
 * The dashboard the browser is currently on, for {@link ACTING_DOMAIN_HEADER}.
 *
 * Read from the URL first and the persisted cookie only as a fallback, because
 * the URL is exact the instant a navigation happens while the cookie is written
 * by an effect a tick later — and a request that goes out during that tick is
 * precisely the one that would carry the dashboard the user has just left.
 *
 * Returns null away from `/dashboard`, which leaves the header off entirely.
 * Public pages such as `/courses/{uuid}` are role-independent by design and have
 * no dashboard to be capped to; omitting the header is how a caller says so, and
 * the server then behaves exactly as it did before acting domains existed.
 */
export function readActingDomain(): UserDomain | null {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname;
  if (!isInternalDashboardPath(pathname)) return null;

  const fromPath = domainFromPath(pathname);
  if (fromPath) return fromPath;

  // A dashboard path with no role segment (`/dashboard/add-profile`, the
  // `/dashboard` entry redirect). The persisted choice is the best answer here.
  const cookieMatch = window.document.cookie
    .split('; ')
    .find(entry => entry.startsWith(`${ACTIVE_DASHBOARD_COOKIE}=`));
  const cookieValue = cookieMatch?.split('=')[1];
  return normalizeStoredUserDomain(cookieValue ? decodeURIComponent(cookieValue) : null);
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

function isNonRoleScopedDashboardPath(pathname: string) {
  return pathname === '/dashboard/add-profile' || pathname.startsWith('/dashboard/add-profile/');
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

  return `${pathname}${search}`;
}

/**
 * Build a role-scoped dashboard URL for `domain` (e.g. `/dashboard/organisation/overview`).
 * Every role is a real URL segment, so this delegates to the canonical `dashboardUrl`
 * helper. A non-role-scoped dashboard path (`/dashboard/add-profile`) is returned as-is;
 * a path with no known role falls back to `/dashboard` (the entry redirect) rather than a
 * bare `/dashboard/<sub>`, which is no longer a real route.
 */
export function roleScopedDashboardPath(domain: UserDomain | null, path = '/dashboard/overview') {
  if (!isInternalDashboardPath(path)) {
    return path;
  }

  const normalizedPath = normalizeRequestedDashboardPath(path);
  const { pathname } = splitDashboardPath(normalizedPath);

  if (isNonRoleScopedDashboardPath(pathname)) {
    return normalizedPath;
  }

  // A dashboard path with no known role can't be role-scoped. Send it to the
  // /dashboard entry, which resolves the caller's domain server-side and
  // redirects to the role overview. Never emit a bare /dashboard/<sub> — those
  // are no longer real routes and would 404.
  if (!domain) {
    return '/dashboard';
  }

  return dashboardUrl(domain, normalizedPath);
}

export function resolveWorkspaceSwitchPath(
  domain: UserDomain | null,
  requestedPath?: string | null
) {
  const normalizedRequestedPath = normalizeRequestedDashboardPath(requestedPath);

  if (!domain) {
    // With no role to scope, keep an already role-scoped path; otherwise hand off to
    // the /dashboard entry (which redirects) rather than emit a bare, non-existent route.
    return domainFromPath(normalizedRequestedPath) ? normalizedRequestedPath : '/dashboard';
  }

  return dashboardUrl(domain, normalizedRequestedPath);
}
