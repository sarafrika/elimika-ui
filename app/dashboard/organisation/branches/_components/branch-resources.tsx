'use client';

import { apiErrorMessage } from '@/components/resourcing/conflicts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { extractPage } from '@/lib/api-helpers';
import type { OrganisationResource } from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import {
  createResourceMutation,
  deactivateResourceMutation,
  listResourcesOptions,
  listResourcesQueryKey,
  updateResourceMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, DoorOpen, Loader2, MapPin, MoreVertical, Pencil, Plus, Power, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const RESOURCE_PAGE_SIZE = 100;

type BranchResourcesProps = {
  organisationUuid: string;
  branchUuid: string;
  resourceType: ResourceTypeEnum;
};

type ResourceFormState = {
  name: string;
  seat_capacity: string;
  total_quantity: string;
  location_name: string;
  description: string;
  is_active: boolean;
};

function emptyForm(): ResourceFormState {
  return {
    name: '',
    seat_capacity: '',
    total_quantity: '',
    location_name: '',
    description: '',
    is_active: true,
  };
}

function formFromResource(resource: OrganisationResource): ResourceFormState {
  return {
    name: resource.name ?? '',
    seat_capacity: resource.seat_capacity != null ? String(resource.seat_capacity) : '',
    total_quantity: resource.total_quantity != null ? String(resource.total_quantity) : '',
    location_name: resource.location_name ?? '',
    description: resource.description ?? '',
    is_active: resource.is_active !== false,
  };
}

function capacityLabel(resource: OrganisationResource): string {
  if (resource.resource_type === ResourceTypeEnum.VENUE) {
    return resource.seat_capacity != null ? `${resource.seat_capacity} seats` : '—';
  }
  return resource.total_quantity != null ? `${resource.total_quantity} units` : '—';
}

/**
 * Lists and manages the branch-scoped resources of a single Training Branch.
 * `resourceType` fixes it to venues (classrooms) or equipment pools; the branch
 * is locked to `branchUuid` so everything created here belongs to this branch.
 */
export default function BranchResources({
  organisationUuid,
  branchUuid,
  resourceType,
}: BranchResourcesProps) {
  const queryClient = useQueryClient();
  const isVenue = resourceType === ResourceTypeEnum.VENUE;

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<OrganisationResource | null>(null);
  const [form, setForm] = useState<ResourceFormState>(emptyForm());

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

  const invalidateResources = async () => {
    await queryClient.invalidateQueries({
      queryKey: listResourcesQueryKey(resourcesListOptions),
    });
  };

  const createMutation = useMutation({
    ...createResourceMutation(),
    onSuccess: async () => {
      toast.success(isVenue ? 'Venue added to this branch.' : 'Resource added to this branch.');
      setIsSheetOpen(false);
      await invalidateResources();
    },
    onError: error => {
      toast.error(apiErrorMessage(error, 'Unable to save this item.'));
    },
  });

  const updateMutation = useMutation({
    ...updateResourceMutation(),
    onSuccess: async () => {
      toast.success('Changes saved.');
      setIsSheetOpen(false);
      await invalidateResources();
    },
    onError: error => {
      toast.error(apiErrorMessage(error, 'Unable to save this item.'));
    },
  });

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

  const openCreateSheet = () => {
    setEditingResource(null);
    setForm(emptyForm());
    setIsSheetOpen(true);
  };

  const openEditSheet = (resource: OrganisationResource) => {
    setEditingResource(resource);
    setForm(formFromResource(resource));
    setIsSheetOpen(true);
  };

  const handleDeactivate = (resource: OrganisationResource) => {
    if (!resource.uuid) return;
    deactivateMutation.mutate({
      path: { organisationUuid, resourceUuid: resource.uuid },
    });
  };

  const updateField = <K extends keyof ResourceFormState>(key: K, value: ResourceFormState[K]) => {
    setForm(previous => ({ ...previous, [key]: value }));
  };

  const handleSubmit = () => {
    if (!organisationUuid || !branchUuid) {
      toast.error('No branch is available.');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Please enter a name.');
      return;
    }
    const seatCapacity = Number.parseInt(form.seat_capacity, 10);
    const totalQuantity = Number.parseInt(form.total_quantity, 10);
    if (isVenue && (!Number.isFinite(seatCapacity) || seatCapacity < 1)) {
      toast.error('Please enter the seat capacity (at least 1).');
      return;
    }
    if (!isVenue && (!Number.isFinite(totalQuantity) || totalQuantity < 1)) {
      toast.error('Please enter the number of units (at least 1).');
      return;
    }

    const body: OrganisationResource = {
      name: form.name.trim(),
      resource_type: resourceType,
      seat_capacity: isVenue ? seatCapacity : null,
      total_quantity: isVenue ? null : totalQuantity,
      branch_uuid: branchUuid,
      location_name: form.location_name.trim() || null,
      description: form.description.trim() || null,
      is_active: form.is_active,
    };

    if (editingResource?.uuid) {
      updateMutation.mutate({
        path: { organisationUuid, resourceUuid: editingResource.uuid },
        body,
      });
      return;
    }
    createMutation.mutate({ path: { organisationUuid }, body });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
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
        <Button size='sm' onClick={openCreateSheet} disabled={!branchUuid}>
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
            <Button onClick={openCreateSheet} disabled={!branchUuid}>
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
                  <DropdownMenuItem onClick={() => openEditSheet(resource)}>
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side='right'
          className='flex w-[min(98vw,540px)] max-w-none flex-col overflow-y-auto p-4 sm:max-w-none sm:p-6'
        >
          <SheetHeader className='space-y-2 pr-10 text-left'>
            <SheetTitle>
              {editingResource
                ? isVenue
                  ? 'Edit venue'
                  : 'Edit resource'
                : isVenue
                  ? 'Add a venue'
                  : 'Add a resource'}
            </SheetTitle>
            <SheetDescription>
              {isVenue
                ? 'Venues are booked exclusively per time slot. Manage opening hours and blackouts from the resource calendar after saving.'
                : 'Equipment pools are reserved by quantity across overlapping bookings.'}
            </SheetDescription>
          </SheetHeader>

          <div className='mt-4 grid gap-4'>
            <div className='grid gap-2'>
              <Label>Name *</Label>
              <Input
                value={form.name}
                placeholder={isVenue ? 'e.g. Physics Lab B' : 'e.g. Laptop cart'}
                onChange={event => updateField('name', event.target.value)}
              />
            </div>

            {isVenue ? (
              <div className='grid gap-2'>
                <Label>Seat capacity *</Label>
                <Input
                  type='number'
                  min={1}
                  value={form.seat_capacity}
                  placeholder='e.g. 30'
                  onChange={event => updateField('seat_capacity', event.target.value)}
                />
                <p className='text-muted-foreground text-xs'>
                  Classes using this venue cannot admit more participants than this.
                </p>
              </div>
            ) : (
              <div className='grid gap-2'>
                <Label>Total units *</Label>
                <Input
                  type='number'
                  min={1}
                  value={form.total_quantity}
                  placeholder='e.g. 25'
                  onChange={event => updateField('total_quantity', event.target.value)}
                />
                <p className='text-muted-foreground text-xs'>
                  Overlapping bookings can reserve units until the pool is exhausted.
                </p>
              </div>
            )}

            <div className='grid gap-2'>
              <Label>Location</Label>
              <Input
                value={form.location_name}
                placeholder='e.g. Main campus, Block C, Room 12'
                onChange={event => updateField('location_name', event.target.value)}
              />
            </div>

            <div className='grid gap-2'>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                rows={3}
                placeholder='Access notes, equipment available…'
                onChange={event => updateField('description', event.target.value)}
              />
            </div>

            {editingResource ? (
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div>
                  <Label>Active</Label>
                  <p className='text-muted-foreground text-xs'>
                    Inactive items cannot be attached to new bookings.
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={checked => updateField('is_active', checked)}
                />
              </div>
            ) : null}

            <Button onClick={handleSubmit} disabled={isSaving} className='mt-2'>
              {isSaving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              {editingResource ? 'Save changes' : addLabel}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
