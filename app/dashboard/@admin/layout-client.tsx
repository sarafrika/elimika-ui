'use client';

import { ReactNode } from 'react';
import { AdminLayoutShell } from '@/components/admin/layout-shell';
import { AdminNavigationNode } from './_components/admin-navigation';

export default function AdminLayoutClient({
  navigation,
  children,
}: {
  navigation: AdminNavigationNode[];
  children: ReactNode;
}) {
  return <AdminLayoutShell navigation={navigation}>{children}</AdminLayoutShell>;
}
