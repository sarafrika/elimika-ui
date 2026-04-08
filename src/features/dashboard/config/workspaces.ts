import type { DashboardView } from '@/components/dashboard-view-context';
import type { DashboardChildrenTypes, UserDomain } from '@/lib/types';

export type KnownDomain = UserDomain | 'organization';

export const domainToSlotKeyMap: Record<KnownDomain, keyof DashboardChildrenTypes> = {
  student: 'student',
  admin: 'admin',
  parent: 'parent',
  instructor: 'instructor',
  course_creator: 'course_creator',
  organisation: 'organization',
  organisation_user: 'organization',
  organization: 'organization',
};

export const domainToDashboardViewMap: Record<KnownDomain, DashboardView> = {
  student: 'student',
  admin: 'admin',
  parent: 'parent',
  instructor: 'instructor',
  course_creator: 'course_creator',
  organisation: 'organization',
  organisation_user: 'organization',
  organization: 'organization',
};
