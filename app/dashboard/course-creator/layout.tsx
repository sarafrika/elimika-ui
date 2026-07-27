import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import CourseCreatorLayoutHook from './layout-hook';

export default async function CourseCreatorLayout({ children }: { children: ReactNode }) {
  const { redirectTo } = await assertRoleAccess('course-creator');
  if (redirectTo) redirect(redirectTo);
  return <CourseCreatorLayoutHook>{children}</CourseCreatorLayoutHook>;
}
