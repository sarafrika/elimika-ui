import UsersList from '@/app/dashboard/@admin/users/_components/UsersList';
import { getAllUsers, search } from '@/services/client';
import UserDetailsPanel from '@/app/dashboard/@admin/users/_components/UserDetailsPanel';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminPage } from '@/components/admin/admin-page';
import { adminRouteMap } from '../_components/admin-navigation';
import type { Metadata } from 'next';

// Loading Component
function UsersLoading() {
  return (
    <div className='flex flex-col gap-6 lg:flex-row lg:gap-8'>
      <div className='flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-dashed bg-card/40 p-6'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <Loader2 className='text-primary mx-auto mb-4 h-6 w-6 animate-spin' />
            <p className='text-muted-foreground text-sm'>Loading users…</p>
          </div>
        </div>
      </div>
      <div className='hidden flex-1 rounded-xl border border-dashed lg:block' />
    </div>
  );
}

// Actual data fetching component
async function UsersContent({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const searchQuery = (searchParams?.search as string) ?? '';
  const activeFilter = (searchParams?.active as string) ?? 'all';
  const domainFilter = (searchParams?.domain as string) ?? 'all';
  const sortField = (searchParams?.sortField as string) ?? 'created_date';
  const sortOrder = (searchParams?.sortOrder as 'asc' | 'desc') ?? 'desc';

  // Check if any filters are active
  const hasFilters = searchQuery || activeFilter !== 'all' || domainFilter !== 'all';

  let data, error;

  if (hasFilters) {
    // Use search endpoint when filters are applied
    const searchParameters: Record<string, unknown> = {};

    // Add search query if provided
    if (searchQuery) {
      searchParameters.first_name_like = searchQuery;
      searchParameters.last_name_like = searchQuery;
      searchParameters.email_like = searchQuery;
      searchParameters.username_like = searchQuery;
    }

    // Add active filter if not 'all'
    if (activeFilter !== 'all') {
      searchParameters.active_eq = activeFilter === 'true';
    }

    // Add domain filter if not 'all'
    if (domainFilter !== 'all') {
      searchParameters.user_domain_eq = domainFilter;
    }

    const response = await search({
      query: {
        searchParams: searchParameters,
        pageable: {
          page: 0,
          size: 20,
          sort: [`${sortField},${sortOrder}`],
        },
      },
    });

    data = response.data;
    error = response.error;
  } else {
    // Use getAllUsers endpoint when no filters are applied
    const response = await getAllUsers({
      query: {
        pageable: {
          page: 0,
          size: 20,
          sort: [`${sortField},${sortOrder}`],
        },
      },
    });

    data = response.data;
    error = response.error;
  }

  // Handle API errors
  /*if (error) {
    throw new Error(error.message || 'Failed to fetch users');
  }*/

  const users = data?.data?.content ?? [];
  const selectedUser = users.find(user => user.uuid === searchParams?.id) ?? users[0] ?? null;

  return (
    <div className='flex flex-col gap-6 lg:flex-row lg:gap-8'>
      <UsersList
        users={users}
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        domainFilter={domainFilter}
        sortField={sortField}
        sortOrder={sortOrder}
        selectedUser={selectedUser}
      />
      <UserDetailsPanel user={selectedUser} />
    </div>
  );
}

// Main Page Component
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <AdminPage meta={adminRouteMap.users}>
      <Suspense fallback={<UsersLoading />}>
        <UsersContent searchParams={params} />
      </Suspense>
    </AdminPage>
  );
}

export const metadata: Metadata = {
  title: `${adminRouteMap.users.title} | Admin Dashboard`,
  description: adminRouteMap.users.description,
};
