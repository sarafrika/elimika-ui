import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';

export default async function AdminSegmentLayout({ children }: { children: ReactNode }) {
  const { redirectTo } = await assertRoleAccess('admin');
  if (redirectTo) redirect(redirectTo);
  return <>{children}</>;
}
