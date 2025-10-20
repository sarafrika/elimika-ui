import { Button } from '@/components/ui/button';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import TrainingBranchesList from '@/app/dashboard/@admin/organizations/[uuid]/branches/_components/TrainingBranchesList';
import TrainingBranchDetailsPanel from '@/app/dashboard/@admin/organizations/[uuid]/branches/_components/TrainingBranchDetailsPanel';
import { getTrainingBranchesByOrganisation } from '@/services/client';
import { Suspense } from 'react';

function TrainingBranchesLoading() {
  return (
    <div className='bg-background flex h-[calc(100vh-120px)] items-center justify-center'>
      <div className='text-center'>
        <Loader2Icon className='text-primary mx-auto mb-4 h-8 w-8 animate-spin' />
        <p className='text-muted-foreground text-sm'>Loading training branches...</p>
      </div>
    </div>
  );
}

async function TrainingBranchesContent({
  uuid,
  searchParams,
}: {
  uuid: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const searchQuery = (searchParams?.search as string) ?? '';
  const activeFilter = (searchParams?.active as string) ?? 'all';
  const sortField = (searchParams?.sortField as string) ?? 'branch_name';
  const sortOrder = (searchParams?.sortOrder as 'asc' | 'desc') ?? 'asc';

  const { data, error } = await getTrainingBranchesByOrganisation({
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
    throw new Error(error.message || 'Failed to fetch training branches');
  }

  let branches = data?.data?.content ?? [];

  // Client-side filtering
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    branches = branches.filter(
      branch =>
        branch.branch_name?.toLowerCase().includes(query) ||
        branch.address?.toLowerCase().includes(query) ||
        branch.poc_name?.toLowerCase().includes(query)
    );
  }

  if (activeFilter !== 'all') {
    branches = branches.filter(branch => branch.active === (activeFilter === 'true'));
  }

  const selectedBranch =
    branches.find(branch => branch.uuid === searchParams?.id) ?? branches[0] ?? null;

  const organizationName = 'Organization'; // You might want to fetch this separately

  return (
    <div className='flex min-h-screen flex-col'>
      {/* Header */}
      <div className='bg-background border-b p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div>
              <h1 className='text-2xl font-semibold'>{organizationName} - Training Branches</h1>
              <p className='text-muted-foreground text-sm'>
                {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
              </p>
            </div>
          </div>
          <Button>
            <PlusIcon className='mr-2 h-4 w-4' />
            Add Branch
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className='bg-background flex flex-1 flex-col lg:flex-row'>
        <TrainingBranchesList
          branches={branches}
          organizationUuid={uuid}
          searchQuery={searchQuery}
          activeFilter={activeFilter}
          sortField={sortField}
          sortOrder={sortOrder}
          selectedBranch={selectedBranch}
        />

        <TrainingBranchDetailsPanel branch={selectedBranch} />
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
    <Suspense fallback={<TrainingBranchesLoading />}>
      <TrainingBranchesContent uuid={uuid} searchParams={search} />
    </Suspense>
  );
}
