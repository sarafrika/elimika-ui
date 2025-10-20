import OrganizationsList from '@/app/dashboard/@admin/organizations/_components/OrganizationsList';
import { getAllOrganisations } from '@/services/client';
import OrganizationDetailsPanel from '@/app/dashboard/@admin/organizations/_components/OrganizationDetailsPanel';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function OrganizationsLoading() {
  return (
    <div className='bg-background flex h-[calc(100vh-120px)] flex-col lg:flex-row'>
      <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <Loader2 className='text-primary mx-auto mb-4 h-8 w-8 animate-spin' />
            <p className='text-muted-foreground text-sm'>Loading organizations...</p>
          </div>
        </div>
      </div>
      <div className='hidden flex-1 lg:block' />
    </div>
  );
}

async function OrganizationsContent({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const searchQuery = (searchParams?.search as string) ?? '';
  const activeFilter = (searchParams?.active as string) ?? 'all';
  const verifiedFilter = (searchParams?.verified as string) ?? 'all';
  const sortField = (searchParams?.sortField as string) ?? 'created_date';
  const sortOrder = (searchParams?.sortOrder as 'asc' | 'desc') ?? 'desc';

  const { data, error } = await getAllOrganisations({
    query: {
      pageable: {
        page: 0,
        size: 20,
        sort: [`${sortField},${sortOrder}`],
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch organizations');
  }

  let organizations = data?.data?.content ?? [];

  // Client-side filtering (if API doesn't support these filters)
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    organizations = organizations.filter(
      org =>
        org.name?.toLowerCase().includes(query) ||
        org.description?.toLowerCase().includes(query) ||
        org.location?.toLowerCase().includes(query)
    );
  }

  if (activeFilter !== 'all') {
    organizations = organizations.filter(org => org.active === (activeFilter === 'true'));
  }

  if (verifiedFilter !== 'all') {
    organizations = organizations.filter(org => org.admin_verified === (verifiedFilter === 'true'));
  }

  const selectedOrganization =
    organizations.find(org => org.uuid === searchParams?.id) ?? organizations[0] ?? null;

  return (
    <div className='bg-background flex h-[calc(100vh-120px)] flex-col lg:flex-row'>
      <OrganizationsList
        organizations={organizations}
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        verifiedFilter={verifiedFilter}
        sortField={sortField}
        sortOrder={sortOrder}
        selectedOrganization={selectedOrganization}
      />
      <OrganizationDetailsPanel organization={selectedOrganization} />
    </div>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <Suspense fallback={<OrganizationsLoading />}>
      <OrganizationsContent searchParams={params} />
    </Suspense>
  );
}
