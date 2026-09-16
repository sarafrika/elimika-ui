'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Power,
  Presentation,
  Users,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AsyncSection } from '@/components/data/async-section';
import { apiErrorMessage } from '@/components/resourcing/conflicts';
import {
  RESOURCE_QUERY_IDS,
  ResourceFormDialog,
} from '@/components/resourcing/resource-form-dialog';
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
import { extractPage } from '@/lib/api-helpers';
import type { OrganisationResource, TrainingBranch } from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import {
  deactivateResourceMutation,
  listResourcesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';

const RESOURCE_PAGE_SIZE = 100;

type BranchResourcesProps = {
  branch: TrainingBranch;
  resourceType: ResourceTypeEnum;
};

function capacityLabel(resource: OrganisationResource): string {
  if (resource.resource_type === ResourceTypeEnum.VENUE) {
    return resource.seat_capacity != null ? `${resource.seat_capacity} seats` : '—';
  }
  return resource.total_quantity != null ? `${resource.total_quantity} units` : '—';
}

/**
 * Lists and manages the resources of a single Training Branch. `resourceType` fixes
 * it to venues or equipment pools; everything created here is locked to this branch.
 */
export default function BranchResources({ branch, resourceType }: BranchResourcesProps) {
  const queryClient = useQueryClient();
  const organisationUuid = branch.organisation_uuid ?? '';
  const branchUuid = branch.uuid ?? '';
  const isVenue = resourceType === ResourceTypeEnum.VENUE;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<OrganisationResource | null>(null);

  const resourcesListOptions = useMemo(
    () => ({
      path: { organisationUuid },
      query: {
        pageable: { page: 0, size: RESOURCE_PAGE_SIZE },
        resource_type: resourceType,
        branch_uuid: branchUuid,
      },
    }),
    [organisationUuid, branchUuid, resourceType]
  );

  const resourcesQuery = useQuery({
    ...listResourcesOptions(resourcesListOptions),
    enabled: Boolean(organisationUuid && branchUuid),
  });

  const resources = useMemo(
    () => extractPage<OrganisationResource>(resourcesQuery.data).items,
    [resourcesQuery.data]
  );

  const invalidateResources = () => invalidateGeneratedQueryIds(queryClient, RESOURCE_QUERY_IDS);

  const deactivateMutation = useMutation({
    ...deactivateResourceMutation(),
    onSuccess: async () => {
      toast.success('Deactivated.');
      await invalidateResources();
    },
    onError: error => {
      toast.error(
        apiErrorMessage(error, 'Unable to deactivate. Release its future bookings first.')
      );
    },
  });

  const openCreateDialog = () => {
    setEditingResource(null);
    setDialogOpen(true);
  };

  const openEditDialog = (resource: OrganisationResource) => {
    setEditingResource(resource);
    setDialogOpen(true);
  };

  const handleDeactivate = (resource: OrganisationResource) => {
    if (!resource.uuid) return;
    deactivateMutation.mutate({
      path: { organisationUuid, resourceUuid: resource.uuid },
    });
  };

  const Icon = isVenue ? Presentation : Wrench;
  const SizeIcon = isVenue ? Users : Package;
  const branchName = branch.branch_name || 'this branch';
  const addLabel = isVenue ? 'Add venue' : 'Add equipment';

  return (
    <section className='border-border/70 bg-card rounded-md border shadow-sm'>
      <div className='border-border/60 flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4'>
        <div className='min-w-0 space-y-1'>
          <h2 className='text-foreground text-base font-semibold'>
            {isVenue ? 'Venues' : 'Equipment'}
          </h2>
          <p className='text-muted-foreground text-sm'>
            {isVenue
              ? `Rooms and spaces inside ${branchName}. They share the branch pin, so you only note where inside the branch they are.`
              : `Equipment kept at ${branchName}. Jobs and classes here can book it.`}
          </p>
        </div>
        <Button size='sm' onClick={openCreateDialog} disabled={!branchUuid}>
          <Plus className='h-4 w-4' />
          {addLabel}
        </Button>
      </div>

      <div className='p-5'>
        <AsyncSection
          loading={resourcesQuery.isLoading && !resourcesQuery.data}
          error={resourcesQuery.error}
          onRetry={() => void resourcesQuery.refetch()}
          errorTitle={isVenue ? 'Couldn’t load venues' : 'Couldn’t load equipment'}
          empty={resources.length === 0}
          skeleton={
            <div className='grid gap-2.5'>
              <Skeleton className='h-16 w-full rounded-lg' />
              <Skeleton className='h-16 w-full rounded-lg' />
            </div>
          }
          emptyState={
            <EmptyState
              icon={Icon}
              variant='compact'
              title={isVenue ? 'No venues yet' : 'No equipment yet'}
              description={
                isVenue
                  ? 'Add the rooms and spaces at this branch so classes can be scheduled into them.'
                  : 'Add the equipment kept at this branch so jobs and classes can book it.'
              }
            />
          }
        >
          <div className='grid gap-2.5'>
            {resources.map(resource => (
              <div
                key={resource.uuid}
                className='border-border/70 flex items-center gap-3 rounded-lg border px-3.5 py-3'
              >
                <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
                  <Icon className='h-5 w-5' />
                </div>
                <div className='min-w-0 flex-1 space-y-0.5'>
                  <div className='text-foreground truncate font-semibold'>{resource.name}</div>
                  <div className='text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                    <span className='flex items-center gap-1'>
                      <SizeIcon className='h-3.5 w-3.5' />
                      {capacityLabel(resource)}
                    </span>
                    <span className='flex items-center gap-1'>
                      <Layers className='h-3.5 w-3.5' />
                      {resource.location_name || 'No note on where inside the branch'}
                    </span>
                  </div>
                </div>
                <Badge variant={resource.is_active !== false ? 'success' : 'outline'}>
                  {resource.is_active !== false ? 'Active' : 'Deactivated'}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      aria-label={`Actions for ${resource.name}`}
                    >
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => openEditDialog(resource)}>
                      <Pencil className='mr-2 h-4 w-4' />
                      Edit
                    </DropdownMenuItem>
                    {resource.is_active !== false ? (
                      <DropdownMenuItem
                        className='text-destructive focus:text-destructive'
                        disabled={deactivateMutation.isPending}
                        onClick={() => handleDeactivate(resource)}
                      >
                        <Power className='mr-2 h-4 w-4' />
                        Deactivate
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </AsyncSection>
      </div>

      <ResourceFormDialog
        organisationUuid={organisationUuid}
        resourceType={resourceType}
        branches={[branch]}
        lockedBranch={branch}
        resource={editingResource}
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);
          if (!open) setEditingResource(null);
        }}
      />
    </section>
  );
}
