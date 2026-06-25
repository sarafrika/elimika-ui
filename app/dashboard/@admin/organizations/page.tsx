import { Suspense } from 'react';
import { fetchAdminOrganisations, type AdminOrganisation } from '@/services/admin';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { SectionCardSkeleton } from '../_components/ui/SectionCard';
import { OrganizationsTable } from './_components/OrganizationsTable';

async function OrganizationsSection() {
  const result = await fetchAdminOrganisations({ size: 200 }).catch(() => ({ items: [] }));
  const organisations = (result.items ?? []) as AdminOrganisation[];
  return <OrganizationsTable organisations={organisations} />;
}

export default function OrganizationsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Organisations'
          description='Review organisation accounts, verify them, and manage their branches and members.'
        />
        <Suspense fallback={<SectionCardSkeleton rows={6} />}>
          <OrganizationsSection />
        </Suspense>
      </div>
    </main>
  );
}
