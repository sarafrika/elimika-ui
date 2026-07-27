import StudentContextProvider from '@/context/student-context';
import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const { redirectTo } = await assertRoleAccess('student');
  if (redirectTo) redirect(redirectTo);
  return <StudentContextProvider>{children}</StudentContextProvider>;
}
