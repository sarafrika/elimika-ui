import type { UserDomain } from '@/lib/types';
import { dashboardUrl, routeSegmentFromPath } from './dashboard-url';

const USER_DOMAINS = new Set<string>([
  'student',
  'instructor',
  'admin',
  'parent',
  'course_creator',
  'organisation_user',
  'organisation',
]);

const isUserDomain = (value: string | null | undefined): value is UserDomain =>
  !!value && USER_DOMAINS.has(value);

const orgDomain = (domain: UserDomain) =>
  domain === 'organisation' || domain === 'organisation_user';

// Older notifications stored role-less `/dashboard/...` links that now 404 or bounce.
function classDetail(domain: UserDomain, classUuid: string): string {
  if (domain === 'student') return dashboardUrl(domain, `schedule/classes/${classUuid}`);
  if (domain === 'instructor') return dashboardUrl(domain, `classes/class-training/${classUuid}`);
  if (orgDomain(domain)) return dashboardUrl(domain, `classes?highlight=${classUuid}`);
  if (domain === 'admin') return dashboardUrl(domain, `classes?class=${classUuid}`);
  return dashboardUrl(domain);
}

function classInstance(domain: UserDomain, instanceUuid: string): string {
  if (domain === 'student') return dashboardUrl(domain, 'schedule');
  if (domain === 'instructor') return dashboardUrl(domain, `class-instance/${instanceUuid}`);
  if (orgDomain(domain) || domain === 'admin') return dashboardUrl(domain, 'classes');
  return dashboardUrl(domain);
}

function classAssignment(domain: UserDomain, classUuid: string, assignmentUuid: string): string {
  if (domain === 'student') return dashboardUrl(domain, `assignment/${assignmentUuid}`);
  if (domain === 'instructor') {
    return dashboardUrl(domain, `assignment/assignment_${assignmentUuid}?classId=${classUuid}`);
  }
  if (orgDomain(domain)) return dashboardUrl(domain, 'assignments');
  return classDetail(domain, classUuid);
}

const TRANSACTIONS_PATH: Record<UserDomain, string> = {
  student: 'wallet',
  parent: 'billing',
  instructor: 'revenue/transaction-list',
  course_creator: 'wallet',
  organisation: 'revenue',
  organisation_user: 'revenue',
  admin: 'sales',
};

/**
 * Map a notification `action_url` onto a live route for `domain`. Role-scoped,
 * non-dashboard and absolute urls pass through unchanged.
 */
export function normalizeLegacyActionUrl(
  url: string | null | undefined,
  domain: string | null | undefined
): string {
  const raw = url?.trim() ?? '';
  if (!raw.startsWith('/dashboard/') || raw.startsWith('//')) return raw;
  if (routeSegmentFromPath(raw) || !isUserDomain(domain)) return raw;

  const [path = ''] = raw.split(/[?#]/);
  const parts = path.split('/').filter(Boolean).slice(1);
  const [head, a, b, c] = parts;

  if (head === 'classes' && a === 'schedule' && b) return classInstance(domain, b);
  if (head === 'classes' && a && b === 'assignments' && c) {
    return classAssignment(domain, a, c);
  }
  if (head === 'classes' && a && !b) return classDetail(domain, a);
  if (head === 'transactions') return dashboardUrl(domain, TRANSACTIONS_PATH[domain]);

  return dashboardUrl(domain, raw);
}
