'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, DoorOpen, MapPin, MoreVertical, Pencil, Plus, Power, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
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

  // Graceful degradation: a failed or empty query simply yields an empty list.
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

  const Icon = isVenue ? DoorOpen : Boxes;
  const addLabel = isVenue ? 'Add venue' : 'Add resource';

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-muted-foreground text-sm'>
          {isVenue
            ? 'Classrooms, labs and other spaces where sessions run at this branch.'
            : 'Shared equipment pools available at this branch.'}
        </p>
        <Button size='sm' onClick={openCreateDialog} disabled={!branchUuid}>
          <Plus className='mr-2 h-4 w-4' />
          {addLabel}
        </Button>
      </div>

      {resourcesQuery.isLoading ? (
        <div className='space-y-2'>
          <Skeleton className='h-14 w-full' />
          <Skeleton className='h-14 w-full' />
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={Icon}
          variant='card'
          title={isVenue ? 'No venues yet' : 'No resources yet'}
          description={
            isVenue
              ? 'Add the classrooms and labs available at this branch so classes can be scheduled into them.'
              : 'Add the shared equipment available at this branch so bookings can reserve it.'
          }
          action={
            <Button onClick={openCreateDialog} disabled={!branchUuid}>
              <Plus className='mr-2 h-4 w-4' />
              {addLabel}
            </Button>
          }
        />
      ) : (
        <div className='grid gap-3'>
          {resources.map(resource => (
            <div
              key={resource.uuid}
              className='border-border bg-card flex items-start justify-between gap-3 rounded-lg border p-3'
            >
              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
                  <Icon className='text-primary h-5 w-5' />
                </div>
                <div className='space-y-1'>
                  <div className='text-foreground font-semibold'>{resource.name}</div>
                  <div className='text-muted-foreground flex flex-wrap items-center gap-3 text-xs'>
                    <span className='flex items-center gap-1'>
                      <Users className='h-3.5 w-3.5' />
                      {capacityLabel(resource)}
                    </span>
                    {resource.location_name ? (
                      <span className='flex items-center gap-1'>
                        <MapPin className='h-3.5 w-3.5' />
                        {resource.location_name}
                      </span>
                    ) : null}
                    {resource.is_active === false ? (
                      <Badge variant='outline' className='text-muted-foreground'>
                        Deactivated
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon' className='h-8 w-8'>
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
      )}

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
    </div>
  );
}
