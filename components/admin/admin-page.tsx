import { ReactNode } from 'react';
import { AdminPageMetadata } from './layout-context';
import { AdminPageRegister } from './admin-page-register';

export function AdminPage({ meta, children }: { meta: AdminPageMetadata; children: ReactNode }) {
  return (
    <>
      <AdminPageRegister meta={meta} />
      {children}
    </>
  );
}
