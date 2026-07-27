import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';

export default async function ParentSegmentLayout({ children }: { children: ReactNode }) {
  const { redirectTo } = await assertRoleAccess('parent');
  if (redirectTo) redirect(redirectTo);
  return <>{children}</>;
}
