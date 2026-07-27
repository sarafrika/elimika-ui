import InstructorProvider from '@/context/instructor-context';
import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const { redirectTo } = await assertRoleAccess('instructor');
  if (redirectTo) redirect(redirectTo);
  return <InstructorProvider>{children}</InstructorProvider>;
}
