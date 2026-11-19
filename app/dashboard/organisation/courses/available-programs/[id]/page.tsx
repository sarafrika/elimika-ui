'use client';

import { Building2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useOrganisation, useOrganisationLoading } from '@/context/organisation-context';
import { cn } from '@/lib/utils';
import { DashboardPageSkeleton } from '@/src/features/dashboard/components/dashboard-page-skeleton';
import { ProgramRecordPage } from '@/src/features/program-record';

const CATALOGUE_HREF = '/dashboard/organisation/courses/catalog';

export default function OrganisationAvailableProgramRoute() {
  const params = useParams<{ id: string }>();
  const programUuid = params?.id ?? '';
  const organisation = useOrganisation();
  const organisationLoading = useOrganisationLoading();
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/organisation/overview' },
      { id: 'catalogue', title: 'Catalogue', url: CATALOGUE_HREF },
      {
        id: 'program-details',
        title: 'Programme details',
        url: `/dashboard/organisation/courses/available-programs/${encodeURIComponent(programUuid)}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, programUuid]);

  if (!organisation && organisationLoading) return <DashboardPageSkeleton />;
  if (!organisation) {
    return (
      <EmptyState
        icon={Building2}
        title='No organisation on this account'
        description='Switch to an organisation workspace, or ask your administrator to add you to one, to view programme details.'
      />
    );
  }
  if (!programUuid) return null;

  return (
    <div className={cn(surfaceTheme.pageWide, 'flex flex-col gap-4 py-4 pb-10')}>
      <ProgramRecordPage
        programUuid={programUuid}
        backHref={CATALOGUE_HREF}
        backLabel='Back to catalogue'
      />
    </div>
  );
}
