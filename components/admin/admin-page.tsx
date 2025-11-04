import { ReactNode } from 'react';
import { AdminPageMetadata } from './layout-context';
import { AdminPageRegister } from './admin-page-register';

export function AdminPage({ meta, children }: { meta: AdminPageMetadata; children: ReactNode }) {
  const pageMeta: AdminPageMetadata = {
    id: meta.id,
    title: meta.title,
    description: meta.description,
    breadcrumbs: meta.breadcrumbs,
  };

  return (
    <>
      <AdminPageRegister meta={pageMeta} />
      {children}
    </>
  );
}
