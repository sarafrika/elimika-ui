import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import InstructorProvider from '@/context/instructor-context';
import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const access = await assertRoleAccess('instructor');
  if (access.redirectTo) redirect(access.redirectTo);

  return <InstructorProvider>{children}</InstructorProvider>;
}
