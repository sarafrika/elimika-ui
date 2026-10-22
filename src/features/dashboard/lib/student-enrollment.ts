import type { UserDomain } from '@/lib/types';
import { buildDashboardSwitchPath } from './active-domain-storage';
import { dashboardUrl, toBareDashboardPath } from './dashboard-url';

export const STUDENT_COURSES_PATH = dashboardUrl('student', 'courses');

export const STUDENT_PROFILE_PROMPT = {
  title: 'Create a student profile to enroll',
  description:
    'Classes are joined using your student profile. Add one to this account, then return here to choose a class and enroll.',
} as const;

export function studentClassEnrollmentPath(classItem: {
  uuid?: string;
  course_uuid?: string | null;
  program_uuid?: string | null;
}) {
  const parent = classItem.program_uuid ?? classItem.course_uuid;
  if (!classItem.uuid || !parent) return STUDENT_COURSES_PATH;
  const section = classItem.program_uuid ? 'available-programs' : 'available-classes';
  const query = new URLSearchParams({ id: classItem.uuid });
  return `${STUDENT_COURSES_PATH}/${section}/${encodeURIComponent(parent)}/enroll?${query.toString()}`;
}

/** Only course and class destinations can be resumed after adding a student profile. */
export function studentCoursePath(path?: string | null) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return STUDENT_COURSES_PATH;
  }

  let url: URL;
  try {
    url = new URL(path, 'https://elimika.invalid');
  } catch {
    return STUDENT_COURSES_PATH;
  }
  if (url.origin !== 'https://elimika.invalid') return STUDENT_COURSES_PATH;
  const barePath = toBareDashboardPath(url.pathname);
  if (barePath !== '/dashboard/courses' && !barePath.startsWith('/dashboard/courses/')) {
    return STUDENT_COURSES_PATH;
  }

  return dashboardUrl('student', `${barePath}${url.search}`);
}

export function studentProfileSetupHref(nextPath: string) {
  const params = new URLSearchParams({ next: studentCoursePath(nextPath) });
  return `/dashboard/add-profile/student?${params.toString()}`;
}

/** A role-independent entry can prompt before the student route's access guard runs. */
export function studentEnrollmentHref(nextPath: string) {
  const params = new URLSearchParams({ next: studentCoursePath(nextPath) });
  return `/dashboard/start-course?${params.toString()}`;
}

export function studentEnrollmentSwitchHref(nextPath: string) {
  return buildDashboardSwitchPath('student', studentCoursePath(nextPath));
}

type StudentEnrollmentAccount = {
  isLoading: boolean;
  accountUuid?: string;
  studentUuid?: string;
  domains: readonly UserDomain[];
  activeDomain: UserDomain | null;
};

export function studentEnrollmentState(account: StudentEnrollmentAccount) {
  if (account.isLoading) return 'loading';
  if (!account.accountUuid) return 'unavailable';
  if (!account.studentUuid) {
    return account.domains.includes('student') ? 'unavailable' : 'create-profile';
  }
  return account.activeDomain === 'student' ? 'ready' : 'switch-profile';
}
