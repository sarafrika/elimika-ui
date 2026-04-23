import type { UserDomain } from '@/lib/types';

export const ACTIVE_DASHBOARD_COOKIE = 'elimika-active-dashboard';
export const ACTIVE_DASHBOARD_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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

export function buildDashboardSwitchPath(domain: UserDomain, nextPath = '/dashboard/overview') {
  const searchParams = new URLSearchParams({ next: nextPath });
  return `/dashboard/switch/${domain}?${searchParams.toString()}`;
}

export function isInternalDashboardPath(path?: string | null) {
  return Boolean(path?.startsWith('/dashboard'));
}

function splitDashboardPath(path: string) {
  const [pathname, search = ''] = path.split('?');

  return {
    pathname,
    search: search ? `?${search}` : '',
  };
}

function normalizeRequestedDashboardPath(path?: string | null) {
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

function getWorkspaceRouteSegments(path: string) {
  const { pathname } = splitDashboardPath(path);
  const normalizedPath = pathname.replace(/^\/dashboard/, '').replace(/^\//, '');
  const [firstSegment = '', ...restSegments] = normalizedPath.split('/');

  const normalizedFirstSegment = firstSegment === 'all-courses' ? 'courses' : firstSegment;

  return {
    root: normalizedFirstSegment,
    segments: [normalizedFirstSegment, ...restSegments].filter(Boolean),
  };
}

function supportsWorkspaceAliasPath(domain: UserDomain, path: string) {
  const { root, segments } = getWorkspaceRouteSegments(path);

  if (root === 'overview') {
    return true;
  }

  if (root !== 'courses') {
    return false;
  }

  const child = segments[1];

  if (!child) {
    return true;
  }

  if (child === 'my-courses') {
    return domain === 'student';
  }

  if (child === 'instructor') {
    return domain === 'student' || domain === 'instructor' || domain === 'course_creator';
  }

  if (segments.length === 2) {
    return domain === 'student' || domain === 'instructor' || domain === 'course_creator';
  }

  return false;
}

export function buildWorkspaceAliasPath(domain: UserDomain | null, path = '/dashboard/overview') {
  if (!domain || !isInternalDashboardPath(path)) {
    return path;
  }

  const normalizedPath = normalizeRequestedDashboardPath(path);
  const { pathname, search } = splitDashboardPath(normalizedPath);

  if (!supportsWorkspaceAliasPath(domain, pathname)) {
    return `${pathname}${search}`;
  }

  const { segments } = getWorkspaceRouteSegments(pathname);
  const rewrittenPath = segments.join('/');

  return rewrittenPath
    ? `/dashboard/workspace/${domain}/${rewrittenPath}${search}`
    : `/dashboard/workspace/${domain}${search}`;
}

export function resolveWorkspaceSwitchPath(domain: UserDomain | null, requestedPath?: string | null) {
  const fallbackPath = '/dashboard/overview';
  const normalizedRequestedPath = normalizeRequestedDashboardPath(requestedPath);

  if (!domain) {
    return buildWorkspaceAliasPath(null, fallbackPath);
  }

  const { pathname } = splitDashboardPath(normalizedRequestedPath);

  if (supportsWorkspaceAliasPath(domain, pathname)) {
    return buildWorkspaceAliasPath(domain, normalizedRequestedPath);
  }

  return buildWorkspaceAliasPath(domain, fallbackPath);
}
