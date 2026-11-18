import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';
import { ApplicationWaitingScreen } from '@/src/features/onboarding/components/ApplicationWaitingScreen';
import CourseCreatorLayoutHook from './layout-hook';

export default async function CourseCreatorLayout({ children }: { children: ReactNode }) {
  const access = await assertRoleAccess('course-creator');
  if (access.redirectTo) redirect(access.redirectTo);
  if (access.application) {
    return (
      <ApplicationWaitingScreen
        domain={access.application.domain}
        status={access.application.status}
        reason={access.application.reason}
      />
    );
  }
  return <CourseCreatorLayoutHook>{children}</CourseCreatorLayoutHook>;
}
