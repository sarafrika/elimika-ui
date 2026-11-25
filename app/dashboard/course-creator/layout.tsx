import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';
import CourseCreatorLayoutHook from './layout-hook';

export default async function CourseCreatorLayout({ children }: { children: ReactNode }) {
  const access = await assertRoleAccess('course-creator');
  if (access.redirectTo) redirect(access.redirectTo);

  return <CourseCreatorLayoutHook>{children}</CourseCreatorLayoutHook>;
}
