import { Suspense } from 'react';
import { Loader2, UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrganizationUsersList from './_components/OrganizationUsersList';
import OrganizationUserDetailsPanel from './_components/OrganizationUserDetailsPanel';
import { getUsersByOrganisation } from '@/services/client';

function OrganizationUsersLoading() {
  return (
    <div className='bg-background flex h-[calc(100vh-120px)] items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='text-primary mx-auto mb-4 h-8 w-8 animate-spin' />
        <p className='text-muted-foreground text-sm'>Loading organization members...</p>
      </div>
    </div>
  );
}

async function OrganizationUsersContent({
  uuid,
  searchParams,
}: {
  uuid: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const searchQuery = (searchParams?.search as string) ?? '';
  const roleFilter = (searchParams?.role as string) ?? 'all';
  const sortField = (searchParams?.sortField as string) ?? 'created_date';
  const sortOrder = (searchParams?.sortOrder as 'asc' | 'desc') ?? 'desc';

  const { data, error } = await getUsersByOrganisation({
    path: {
      uuid,
    },
    query: {
      pageable: {
        page: 0,
        size: 50,
        sort: [`${sortField},${sortOrder}`],
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch organization users');
  }

  let users = data?.data?.content ?? [];

  // Client-side filtering
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    users = users.filter(
      user =>
        user.first_name?.toLowerCase().includes(query) ||
        user.last_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
  }

  if (roleFilter !== 'all') {
    users = users.filter(user =>
      user.organisation_affiliations?.some(aff => aff.domain_in_organisation === roleFilter)
    );
  }

  const selectedUser = users.find(user => user.uuid === searchParams?.id) ?? users[0] ?? null;

  const organizationName =
    users[0]?.organisation_affiliations?.[0]?.organisation_name ?? 'Organization';

  return (
    <div className='flex min-h-screen flex-col'>
      <div className='bg-background border-b p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex flex-col gap-0.5'>
              <h1 className='text-2xl font-semibold'>{organizationName} - Members</h1>
              <div className='flex gap-1'>
                <UsersIcon className='h-4 w-4' />
                <p className='text-muted-foreground text-sm'>
                  {users.length} {users.length === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>
          </div>
          <Button>Add Member</Button>
        </div>
      </div>

      <div className='bg-background flex flex-1 flex-col lg:flex-row'>
        <OrganizationUsersList
          users={users}
          organizationUuid={uuid}
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          sortField={sortField}
          sortOrder={sortOrder}
          selectedUser={selectedUser}
        />
        <OrganizationUserDetailsPanel user={selectedUser} organizationUuid={uuid} />
      </div>
    </div>
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { uuid } = await params;
  const search = await searchParams;

  return (
    <Suspense fallback={<OrganizationUsersLoading />}>
      <OrganizationUsersContent uuid={uuid} searchParams={search} />
    </Suspense>
  );
}
