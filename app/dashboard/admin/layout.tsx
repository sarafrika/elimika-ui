import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { assertRoleAccess } from '@/src/features/dashboard/server/entry-target';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { redirectTo } = await assertRoleAccess('admin');
  if (redirectTo) redirect(redirectTo);

  return <>{children}</>;
}
