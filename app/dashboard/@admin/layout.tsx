import { ReactNode } from 'react';
import AdminLayoutClient from './layout-client';
import { adminNavigation } from './_components/admin-navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient navigation={adminNavigation}>{children}</AdminLayoutClient>;
}
