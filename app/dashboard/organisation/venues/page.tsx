'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Pencil, Plus, Trash2, TriangleAlert, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AsyncSection } from '@/components/data/async-section';
import { PageHeader } from '@/components/dashboard';
import { AssignBranchDialog } from '@/components/resourcing/assign-branch-dialog';
import { apiErrorMessage } from '@/components/resourcing/conflicts';
import {
  RESOURCE_QUERY_IDS,
  ResourceFormDialog,
} from '@/components/resourcing/resource-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import type { OrganisationResource, TrainingBranch } from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import {
  deactivateResourceMutation,
  getTrainingBranchesByOrganisationOptions,
  listResourcesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import { OrgPage } from '../_components/org-page';

const UNASSIGNED = '__unassigned__';
const VENUE_QUERY = { resource_type: ResourceTypeEnum.VENUE, pageable: { page: 0, size: 200 } };
const BRANCH_QUERY = { pageable: { page: 0, size: 100 } };

type EditorState = { resource: OrganisationResource | null } | null;

export default function VenuesPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const queryClient = useQueryClient();

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: BRANCH_QUERY,
    }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });
  const branches = useMemo(
    () => extractPage<TrainingBranch>(branchesQuery.data).items,
    [branchesQuery.data]
  );
  const branchName = useMemo(() => {
    const names = new Map<string, string>();
    for (const branch of branches) {
      if (branch.uuid) names.set(branch.uuid, branch.branch_name || 'Untitled branch');
    }
    return names;
  }, [branches]);

  const venuesQuery = useQuery({
    ...listResourcesOptions({ path: { organisationUuid }, query: VENUE_QUERY }),
    enabled: Boolean(organisationUuid),
  });
  const venues = useMemo(
    () => extractPage<OrganisationResource>(venuesQuery.data).items,
    [venuesQuery.data]
  );

  const [editor, setEditor] = useState<EditorState>(null);
  const [assigning, setAssigning] = useState<OrganisationResource | null>(null);

  const deactivate = useMutation({ ...deactivateResourceMutation() });

  const totalSeats = venues.reduce((total, venue) => total + (venue.seat_capacity ?? 0), 0);
  const unassignedCount = venues.filter(venue => !venue.branch_uuid).length;

  const grouped = useMemo(() => {
    const groups = new Map<string, OrganisationResource[]>();
    for (const venue of venues) {
      const key = venue.branch_uuid ?? UNASSIGNED;
      groups.set(key, [...(groups.get(key) ?? []), venue]);
    }
    return [...groups.entries()].sort(
      ([a], [b]) => Number(a === UNASSIGNED) - Number(b === UNASSIGNED)
    );
  }, [venues]);

  const removeVenue = (venue: OrganisationResource) => {
    if (!venue.uuid) return;
    deactivate.mutate(
      { path: { organisationUuid, resourceUuid: venue.uuid } },
      {
        onSuccess: async () => {
          toast.success(`Venue "${venue.name}" removed`);
          await invalidateGeneratedQueryIds(queryClient, RESOURCE_QUERY_IDS);
        },
        onError: error => toast.error(apiErrorMessage(error, 'Could not remove the venue.')),
      }
    );
  };

  const kpiLoading = venuesQuery.isLoading && !venuesQuery.data;

  return (
    <OrgPage className='space-y-6'>
      <PageHeader
        title='Venues'
        description='Rooms, labs, studios and halls inside your branches. Each venue uses its branch’s pin, so you only note where inside the branch it is.'
        actions={
          <Button onClick={() => setEditor({ resource: null })} disabled={!organisationUuid}>
            <Plus className='h-4 w-4' />
            Add venue
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <VenueStat label='Total venues' value={venues.length} loading={kpiLoading} />
        <VenueStat
          label='Total seats'
          value={totalSeats.toLocaleString()}
          loading={kpiLoading}
          accent='border-l-success'
        />
        <VenueStat
          label='Branches'
          value={branches.length}
          loading={branchesQuery.isLoading && !branchesQuery.data}
          accent='border-l-primary/60'
        />
      </div>

      {unassignedCount > 0 ? (
        <div className='border-warning/60 bg-warning/10 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'>
          <TriangleAlert className='text-warning mt-0.5 h-4 w-4 shrink-0' />
          <p>
            <strong className='font-semibold'>
              {unassignedCount === 1 ? '1 venue has' : `${unassignedCount} venues have`} no branch.
            </strong>{' '}
            {unassignedCount === 1 ? 'It won’t' : 'They won’t'} appear in job or class pickers until
            you assign {unassignedCount === 1 ? 'it' : 'them'} to a branch.
          </p>
        </div>
      ) : null}

      <AsyncSection
        loading={venuesQuery.isLoading && !venuesQuery.data}
        error={venuesQuery.error}
        onRetry={() => void venuesQuery.refetch()}
        errorTitle='Couldn’t load venues'
        empty={venues.length === 0}
        skeleton={
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className='h-36 w-full rounded-lg' />
            ))}
          </div>
        }
        emptyState={
          <EmptyState
            variant='card'
            icon={MapPin}
            title='No venues yet'
            description={
              branchesQuery.isSuccess && branches.length === 0
                ? 'Add a training branch first, then add venues to it.'
                : 'Add a venue (room, lab, studio) to one of your branches.'
            }
          />
        }
      >
        <div className='space-y-6'>
          {grouped.map(([groupKey, list]) => (
            <section key={groupKey} className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Building2 className='text-muted-foreground h-4 w-4' />
                <h2 className='text-sm font-semibold'>
                  {groupKey === UNASSIGNED
                    ? 'Unassigned'
                    : (branchName.get(groupKey) ??
                      (branchesQuery.isLoading ? 'Loading…' : 'Unknown branch'))}
                </h2>
                <Badge variant='outline' className='text-[10px]'>
                  {list.length} venue{list.length === 1 ? '' : 's'}
                </Badge>
              </div>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {list.map(venue => (
                  <Card key={venue.uuid} className='gap-0 overflow-hidden py-0'>
                    <CardContent className='space-y-3 p-4'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <h3 className='truncate font-semibold'>{venue.name}</h3>
                          <p className='text-muted-foreground text-xs'>
                            {venue.location_name || 'No note on where inside the branch'}
                          </p>
                        </div>
                        <Badge variant={venue.is_active !== false ? 'success' : 'outline'}>
                          {venue.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className='text-muted-foreground flex flex-wrap items-center gap-3 text-xs'>
                        <span className='flex items-center gap-1'>
                          <Users className='h-3.5 w-3.5' />
                          {venue.seat_capacity != null ? `${venue.seat_capacity} seats` : '—'}
                        </span>
                        {venue.branch_uuid ? null : (
                          <Badge variant='outline' className='border-warning/60 text-warning'>
                            <TriangleAlert />
                            No branch
                          </Badge>
                        )}
                      </div>
                      <div className='flex flex-wrap justify-end gap-1'>
                        {venue.branch_uuid ? null : (
                          <Button variant='outline' size='sm' onClick={() => setAssigning(venue)}>
                            Assign branch
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setEditor({ resource: venue })}
                        >
                          <Pencil className='h-3.5 w-3.5' />
                          Edit
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-destructive hover:text-destructive'
                          onClick={() => removeVenue(venue)}
                          disabled={deactivate.isPending}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </AsyncSection>

      <ResourceFormDialog
        organisationUuid={organisationUuid}
        resourceType={ResourceTypeEnum.VENUE}
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

function VenueStat({
  label,
  value,
  loading,
  accent = 'border-l-primary',
}: {
  label: string;
  value: number | string;
  loading: boolean;
  accent?: string;
}) {
  return (
    <Card className={cn('border-l-4', accent)}>
      <CardContent className='p-6'>
        {loading ? (
          <Skeleton className='h-8 w-16' />
        ) : (
          <div className='text-2xl font-bold'>{value}</div>
        )}
        <div className='text-muted-foreground text-xs'>{label}</div>
      </CardContent>
    </Card>
  );
}
