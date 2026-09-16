'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, MoreHorizontal, Pencil, Plus, TriangleAlert, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { PageHeader } from '@/components/dashboard';
import { AssignBranchDialog } from '@/components/resourcing/assign-branch-dialog';
import { branchHasPin, ResourceFormDialog } from '@/components/resourcing/resource-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage } from '@/lib/api-helpers';
import { townFromAddress } from '@/lib/geocoding';
import { STALE_TIMES } from '@/lib/query-client';
import type { OrganisationResource, TrainingBranch } from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import {
  getTrainingBranchesByOrganisationOptions,
  listResourcesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { OrgPage } from '../_components/org-page';

const ALL_BRANCHES = 'all';
const UNASSIGNED = 'unassigned';
const EQUIPMENT_QUERY = {
  resource_type: ResourceTypeEnum.EQUIPMENT_POOL,
  pageable: { page: 0, size: 200 },
};
const BRANCH_QUERY = { pageable: { page: 0, size: 100 } };

type EditorState = { resource: OrganisationResource | null } | null;

export default function OrganisationEquipmentPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const resourcesQuery = useQuery({
    ...listResourcesOptions({ path: { organisationUuid }, query: EQUIPMENT_QUERY }),
    enabled: Boolean(organisationUuid),
  });
  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: BRANCH_QUERY,
    }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });

  const equipment = useMemo(
    () => extractPage<OrganisationResource>(resourcesQuery.data).items,
    [resourcesQuery.data]
  );
  const branches = useMemo(
    () => extractPage<TrainingBranch>(branchesQuery.data).items,
    [branchesQuery.data]
  );
  const branchByUuid = useMemo(
    () =>
      new Map<string, TrainingBranch>(
        branches.flatMap(branch => (branch.uuid ? [[branch.uuid, branch] as const] : []))
      ),
    [branches]
  );
  const unassignedCount = equipment.filter(item => !item.branch_uuid).length;

  const [filter, setFilter] = useState(ALL_BRANCHES);
  const [editor, setEditor] = useState<EditorState>(null);
  const [assigning, setAssigning] = useState<OrganisationResource | null>(null);

  const filters = useMemo(() => {
    const withItems = branches.filter(
      branch => branch.uuid && equipment.some(item => item.branch_uuid === branch.uuid)
    );
    return [
      { key: ALL_BRANCHES, label: 'All branches' },
      ...withItems.map(branch => ({
        key: branch.uuid as string,
        label: branch.branch_name || 'Untitled branch',
      })),
      ...(unassignedCount ? [{ key: UNASSIGNED, label: `Unassigned (${unassignedCount})` }] : []),
    ];
  }, [branches, equipment, unassignedCount]);

  const activeFilter = filters.some(option => option.key === filter) ? filter : ALL_BRANCHES;
  const rows = equipment.filter(item => {
    if (activeFilter === ALL_BRANCHES) return true;
    if (activeFilter === UNASSIGNED) return !item.branch_uuid;
    return item.branch_uuid === activeFilter;
  });

  return (
    <OrgPage className='space-y-6'>
      <PageHeader
        title='Equipment'
        description='Equipment pools kept at your branches. Jobs and classes book equipment from the branch it belongs to.'
        actions={
          <Button onClick={() => setEditor({ resource: null })} disabled={!organisationUuid}>
            <Plus className='h-4 w-4' />
            Add equipment
          </Button>
        }
      />

      {unassignedCount > 0 ? (
        <div className='border-warning/60 bg-warning/10 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'>
          <TriangleAlert className='text-warning mt-0.5 h-4 w-4 shrink-0' />
          <p>
            <strong className='font-semibold'>
              {unassignedCount === 1 ? '1 item has' : `${unassignedCount} items have`} no branch.
            </strong>{' '}
            {unassignedCount === 1 ? 'It won’t' : 'They won’t'} appear in job or class pickers until
            you assign {unassignedCount === 1 ? 'it' : 'them'} to a branch.
          </p>
        </div>
      ) : null}

      {filters.length > 1 ? (
        <Tabs value={activeFilter} onValueChange={setFilter}>
          <TabsList className='h-auto flex-wrap justify-start'>
            {filters.map(option => (
              <TabsTrigger key={option.key} value={option.key}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      <AsyncSection
        loading={resourcesQuery.isLoading && !resourcesQuery.data}
        error={resourcesQuery.error}
        onRetry={() => void resourcesQuery.refetch()}
        errorTitle='Couldn’t load equipment'
        empty={equipment.length === 0}
        skeleton={<EquipmentTableSkeleton />}
        emptyState={
          <EmptyState
            variant='card'
            icon={Wrench}
            title='No equipment yet'
            description={
              branchesQuery.isSuccess && branches.length === 0
                ? 'Add a branch first, then add the equipment kept there.'
                : 'Add the equipment pools kept at your branches so jobs and classes can book them.'
            }
            action={
              <Button onClick={() => setEditor({ resource: null })} disabled={!organisationUuid}>
                <Plus className='h-4 w-4' />
                Add equipment
              </Button>
            }
          />
        }
      >
        <div className='border-border/70 bg-card overflow-x-auto rounded-md border shadow-sm'>
          <Table className='min-w-[760px]'>
            <TableHeader>
              <TableRow className='bg-muted/40'>
                <TableHead>Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Units</TableHead>
                <TableHead className='hidden md:table-cell'>Where in the branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='w-12'>
                  <span className='sr-only'>Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(item => {
                const branch = item.branch_uuid ? branchByUuid.get(item.branch_uuid) : undefined;
                return (
                  <TableRow key={item.uuid}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-md'>
                          <Wrench className='h-4 w-4' />
                        </div>
                        {item.uuid ? (
                          <Link
                            href={dashboardUrl('organisation', `resources/${item.uuid}`)}
                            className='text-foreground font-medium hover:underline'
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span className='font-medium'>{item.name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.branch_uuid ? (
                        <div className='min-w-0'>
                          <div className='flex items-center gap-1.5'>
                            <Building2 className='text-muted-foreground h-3.5 w-3.5 shrink-0' />
                            <span className='truncate'>
                              {branch?.branch_name ||
                                (branchesQuery.isLoading ? 'Loading…' : 'Unknown branch')}
                            </span>
                          </div>
                          {branch ? (
                            <div className='text-muted-foreground pl-5 text-xs'>
                              {branchHasPin(branch)
                                ? (townFromAddress(branch.address) ?? '')
                                : 'No pin yet'}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge variant='outline' className='border-warning/60 text-warning'>
                            <TriangleAlert />
                            No branch
                          </Badge>
                          <Button variant='outline' size='sm' onClick={() => setAssigning(item)}>
                            Assign branch
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='font-mono tabular-nums'>
                      {item.total_quantity ?? '—'}
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden md:table-cell'>
                      {item.location_name || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active !== false ? 'success' : 'outline'}>
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            aria-label={`Actions for ${item.name}`}
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => setEditor({ resource: item })}>
                            <Pencil className='mr-2 h-4 w-4' />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAssigning(item)}>
                            <Building2 className='mr-2 h-4 w-4' />
                            Assign branch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </AsyncSection>

      <ResourceFormDialog
        organisationUuid={organisationUuid}
        resourceType={ResourceTypeEnum.EQUIPMENT_POOL}
        branches={branches}
        resource={editor?.resource}
        open={editor !== null}
        onOpenChange={open => {
          if (!open) setEditor(null);
        }}
      />

      <AssignBranchDialog
        organisationUuid={organisationUuid}
        resource={assigning}
        branches={branches}
        open={assigning !== null}
        onOpenChange={open => {
          if (!open) setAssigning(null);
        }}
      />
    </OrgPage>
  );
}

function EquipmentTableSkeleton() {
  return (
    <div className='border-border/70 bg-card space-y-3 rounded-md border p-4 shadow-sm'>
      <Skeleton className='h-6 w-full' />
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className='flex items-center gap-3'>
          <Skeleton className='h-8 w-8 rounded-md' />
          <Skeleton className='h-4 flex-1' />
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-12' />
        </div>
      ))}
    </div>
  );
}
