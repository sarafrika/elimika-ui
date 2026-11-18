import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import InstructorProvider from '@/context/instructor-context';
import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';
import { ApplicationWaitingScreen } from '@/src/features/onboarding/components/ApplicationWaitingScreen';

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const access = await assertRoleAccess('instructor');
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
  return <InstructorProvider>{children}</InstructorProvider>;
}
