import AdministratorsList from '@/app/dashboard/@admin/administrators/_components/AdministratorsList';
import { search } from '@/services/client';
import AdministratorDetailsPanel from '@/app/dashboard/@admin/administrators/_components/AdministratorDetailsPanel';
import { AdminPage } from '@/components/admin/admin-page';
import { adminRouteMap } from '../_components/admin-navigation';
import type { Metadata } from 'next';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const searchQuery = (params?.search as string) ?? '';
  const activeFilter = (params?.active as string) ?? 'all';
  const sortField = (params?.sortField as string) ?? 'created_date';
  const sortOrder = (params?.sortOrder as 'asc' | 'desc') ?? 'desc';

  const searchParameters: Record<string, unknown> = {
    'domainMappings.userDomain.domainName': 'admin',
  };

  if (searchQuery) {
    searchParameters.first_name_like = searchQuery;
    searchParameters.last_name_like = searchQuery;
    searchParameters.email_like = searchQuery;
    searchParameters.username_like = searchQuery;
  }

  if (activeFilter !== 'all') {
    searchParameters.active_eq = activeFilter === 'true';
  }

  const { data, error } = await search({
    query: {
      searchParams: searchParameters,
      pageable: {
        page: 0,
        size: 20,
        sort: [`${sortField},${sortOrder}`],
      },
    },
  });

  const administrators = data?.data?.content ?? [];

  const selectedAdministrator =
    administrators.find(administrator => administrator.uuid === params?.id) ??
    administrators[0] ??
    null;

  return (
    <AdminPage meta={adminRouteMap.administrators}>
      <div className='flex flex-col gap-6 lg:flex-row lg:gap-8'>
        <AdministratorsList
          administrators={administrators}
          searchQuery={searchQuery}
          activeFilter={activeFilter}
          sortField={sortField}
          sortOrder={sortOrder}
          selectedAdministrator={selectedAdministrator}
        />

        <AdministratorDetailsPanel administrator={selectedAdministrator} />
      </div>
    </AdminPage>
  );
}

export const metadata: Metadata = {
  title: `${adminRouteMap.administrators.title} | Admin Dashboard`,
  description: adminRouteMap.administrators.description,
};
