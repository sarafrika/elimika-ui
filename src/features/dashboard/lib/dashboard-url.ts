import type { UserDomain } from '@/lib/types';

/**
 * Canonical routing helpers for the de-parallelised dashboard.
 *
 * Background: the dashboard used to be built on Next.js parallel routes (`@role`
 * slots), so the URL never encoded which role's page was showing — the active slot
 * was chosen from a cookie. That made deep links un-shareable. The new scheme puts
 * the role in the URL as a real segment (`/dashboard/<segment>/...`), and external
 * sharing uses the public, role-independent routes (`/courses/...`, `/profile-user/...`).
 *
 * This module is the single source of truth for building those URLs. It is a pure
 * module (no 'use client' / 'server-only') so it can be used from both server and
 * client components.
 */

export type RoleSegment =
  | 'student'
  | 'instructor'
  | 'admin'
  | 'parent'
  | 'course-creator'
  | 'organisation';

const DOMAIN_TO_SEGMENT: Record<UserDomain, RoleSegment> = {
  student: 'student',
  instructor: 'instructor',
  admin: 'admin',
  parent: 'parent',
  course_creator: 'course-creator',
  organisation: 'organisation',
  organisation_user: 'organisation',
};

const SEGMENT_TO_DOMAIN: Record<RoleSegment, UserDomain> = {
  student: 'student',
  instructor: 'instructor',
  admin: 'admin',
  parent: 'parent',
  'course-creator': 'course_creator',
  // Two domains share the organisation segment; `organisation` is the canonical one.
  // Role access checks must accept `organisation_user` as well (see the guard helper).
  organisation: 'organisation',
};

export const ROLE_SEGMENTS = Object.keys(SEGMENT_TO_DOMAIN) as RoleSegment[];

/** Map a `user_domain` value to its URL segment. */
export function domainToRouteSegment(domain: UserDomain): RoleSegment {
  return DOMAIN_TO_SEGMENT[domain];
}

/** Map a URL segment back to its canonical `user_domain`, or null if unknown. */
export function routeSegmentToDomain(segment: string): UserDomain | null {
  return (SEGMENT_TO_DOMAIN as Record<string, UserDomain | undefined>)[segment] ?? null;
}

/** True when `segment` is one of the known role segments. */
export function isRoleSegment(segment: string): segment is RoleSegment {
  return Object.prototype.hasOwnProperty.call(SEGMENT_TO_DOMAIN, segment);
}

/**
 * Extract the role segment from a dashboard pathname, e.g.
 * `/dashboard/instructor/training-hub` -> `instructor`. Returns null for
 * non-role-scoped paths (`/dashboard`, `/dashboard/add-profile`, ...).
 */
export function routeSegmentFromPath(pathname?: string | null): RoleSegment | null {
  if (!pathname) return null;
  const [withoutQuery = ''] = pathname.split('?');
  const segments = withoutQuery.split('/').filter(Boolean);
  // ['dashboard', '<segment>', ...]
  if (segments[0] !== 'dashboard') return null;
  const candidate = segments[1];
  return candidate && isRoleSegment(candidate) ? candidate : null;
}

/** The active `user_domain` implied by a dashboard pathname, or null. */
export function domainFromPath(pathname?: string | null): UserDomain | null {
  const segment = routeSegmentFromPath(pathname);
  return segment ? routeSegmentToDomain(segment) : null;
}

/**
 * Build a role-scoped dashboard URL.
 *
 * `path` may be given with or without a leading slash and with or without a
 * `/dashboard` prefix; any existing role segment is stripped so callers can pass
 * either a bare sub-path (`classes`) or a legacy path (`/dashboard/classes`).
 *
 *   dashboardUrl('instructor', 'training-hub')          -> /dashboard/instructor/training-hub
 *   dashboardUrl('organisation', '/dashboard/courses')  -> /dashboard/organisation/courses
 */
export function dashboardUrl(domain: UserDomain, path = 'overview'): string {
  const segment = domainToRouteSegment(domain);

  const [rawPath = '', query = ''] = path.split('?');
  let rest = rawPath.replace(/^\/+/, '');
  rest = rest.replace(/^dashboard\/?/, '');

  // Drop a leading role segment if the caller accidentally included one.
  const firstSegment = rest.split('/')[0] ?? '';
  if (firstSegment && isRoleSegment(firstSegment)) {
    rest = rest.slice(firstSegment.length).replace(/^\/+/, '');
  }

  const suffix = rest ? `/${rest}` : '';
  const search = query ? `?${query}` : '';
  return `/dashboard/${segment}${suffix}${search}`;
}

/**
 * Strip the role segment from a dashboard pathname so it can be matched against
 * the bare menu urls (`/dashboard/courses`), e.g.
 * `/dashboard/organisation/courses` -> `/dashboard/courses`.
 */
export function toBareDashboardPath(pathname?: string | null): string {
  if (!pathname) return '/dashboard';
  const segment = routeSegmentFromPath(pathname);
  if (!segment) return pathname;
  const bare = pathname.replace(`/dashboard/${segment}`, '/dashboard');
  return bare || '/dashboard';
}

/** Public, role-independent, shareable course URL. Works outside any dashboard. */
export function publicCourseUrl(courseUuid: string): string {
  return `/courses/${encodeURIComponent(courseUuid)}`;
}

/** Domains the public profile page understands via its `?domain=` query param. */
export type ProfileShareDomain =
  | 'instructor'
  | 'student'
  | 'course_creator'
  | 'admin'
  | 'organisation';

/**
 * Public, role-independent, shareable profile URL (`/profile-user/<id>?domain=<d>`).
 * Mirrors the existing `useProfileShareUrl` helper so both stay in sync.
 */
export function publicProfileUrl(
  userId: string,
  domain: ProfileShareDomain = 'instructor'
): string {
  return `/profile-user/${encodeURIComponent(userId)}?domain=${domain}`;
}

/** Absolute variant for copy-to-clipboard "Share" actions (client only). */
export function absoluteUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}
