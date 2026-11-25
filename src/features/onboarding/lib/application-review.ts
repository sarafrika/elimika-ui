import type { UserDomain } from '@/lib/types';

export function reviewDomain(domain: string): string {
  return domain === 'organisation' ? 'organisation_user' : domain;
}

export function sameReviewDomain(left: string | undefined, right: string | undefined): boolean {
  return !!left && !!right && reviewDomain(left) === reviewDomain(right);
}

export function awaitingApprovalPath(domain?: string): string {
  return domain
    ? `/awaiting-approval?${new URLSearchParams({ domain: reviewDomain(domain) })}`
    : '/awaiting-approval';
}

export const REVIEW_PROFILES: Partial<
  Record<
    UserDomain,
    {
      label: string;
      pending: string;
      approved: string;
      firstAction?: { label: string; path: string };
    }
  >
> = {
  student: {
    label: 'Student',
    pending:
      'Your student application is with the Elimika admin. You can start learning once it is approved.',
    approved:
      'Your student application has been approved. You can now explore courses and start learning.',
  },
  instructor: {
    label: 'Instructor',
    pending:
      'Your application and skills wallet are with the Elimika admin. You can schedule classes and teach once your application is approved.',
    approved:
      'Your instructor application has been approved. You can now open your workspace and start teaching.',
  },
  course_creator: {
    label: 'Course Creator',
    pending:
      'Your skills wallet and application are with the Elimika admin. You will be able to create courses once your application is approved.',
    approved:
      'Your application has been approved. You can now create courses and submit each one for approval.',
    firstAction: {
      label: 'Add your first course',
      path: '/dashboard/course-creator/course-management/create-course',
    },
  },
  organisation_user: {
    label: 'Organisation',
    pending:
      'Your organisation application and validation documents are with the Elimika admin. Your institution dashboard will be available once your application is approved.',
    approved:
      'Your organisation application has been approved. You can now manage your institution, instructors and learners.',
  },
  parent: {
    label: 'Parent / Guardian',
    pending:
      'Your guardian application is with the Elimika admin. Your family workspace will be available once your application is approved.',
    approved:
      'Your guardian application has been approved. You can now open your family workspace.',
  },
};

/** The moderation API has no separate changes-requested state. */
export const CHANGES_REQUESTED_PREFIX = 'Changes requested: ';

export function isChangesRequested(reason: string): boolean {
  return reason.startsWith(CHANGES_REQUESTED_PREFIX);
}
