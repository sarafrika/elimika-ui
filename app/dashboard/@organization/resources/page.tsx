'use client';

import { apiErrorMessage } from '@/components/resourcing/conflicts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useOrganisation } from '@/context/organisation-context';
import { extractPage } from '@/lib/api-helpers';
import type { OrganisationResource, TrainingBranch } from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import {
  createResourceMutation,
  deactivateResourceMutation,
  getTrainingBranchesByOrganisationOptions,
  listResourcesOptions,
  listResourcesQueryKey,
  updateResourceMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Boxes,
  CalendarDays,
  DoorOpen,
  Loader2,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  Users,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const RESOURCE_PAGE_SIZE = 100;
const NO_BRANCH = 'none';

type ResourceFormState = {
  name: string;
  resource_type: ResourceTypeEnum;
  seat_capacity: string;
  total_quantity: string;
  branch_uuid: string;
  location_name: string;
  description: string;
  is_active: boolean;
};

function emptyForm(): ResourceFormState {
  return {
    name: '',
    resource_type: ResourceTypeEnum.VENUE,
    seat_capacity: '',
    total_quantity: '',
    branch_uuid: NO_BRANCH,
    location_name: '',
    description: '',
    is_active: true,
  };
}

function formFromResource(resource: OrganisationResource): ResourceFormState {
  return {
    name: resource.name ?? '',
    resource_type: resource.resource_type ?? ResourceTypeEnum.VENUE,
    seat_capacity: resource.seat_capacity != null ? String(resource.seat_capacity) : '',
    total_quantity: resource.total_quantity != null ? String(resource.total_quantity) : '',
    branch_uuid: resource.branch_uuid ?? NO_BRANCH,
    location_name: resource.location_name ?? '',
    description: resource.description ?? '',
    is_active: resource.is_active !== false,
  };
}

export function resourceCapacityLabel(resource: OrganisationResource): string {
  if (resource.resource_type === ResourceTypeEnum.VENUE) {
    return resource.seat_capacity != null ? `${resource.seat_capacity} seats` : '—';
  }
  return resource.total_quantity != null ? `${resource.total_quantity} units` : '—';
}

function createResourceColumns(
  onEdit: (resource: OrganisationResource) => void,
  onDeactivate: (resource: OrganisationResource) => void,
  branchNameByUuid: Map<string, string>,
  isDeactivating: boolean
): ColumnDef<OrganisationResource>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Resource',
      cell: ({ row }) => {
        const isVenue = row.original.resource_type === ResourceTypeEnum.VENUE;
        const Icon = isVenue ? DoorOpen : Boxes;
        return (
          <Link
            href={`/dashboard/resources/${row.original.uuid}`}
            className='group flex items-center gap-3'
          >
            <div className='bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
              <Icon className='text-primary h-5 w-5' />
            </div>
            <div>
              <div className='text-foreground font-semibold group-hover:underline'>
                {row.original.name}
              </div>
              <div className='text-muted-foreground text-xs'>
                {isVenue ? 'Venue' : 'Equipment pool'}
              </div>
            </div>
          </Link>
        );
      },
    },
    {
      id: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => (
        <div className='text-foreground flex items-center gap-1.5 text-sm'>
          <Users className='text-muted-foreground h-3.5 w-3.5' />
          <span>{resourceCapacityLabel(row.original)}</span>
        </div>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const branchName = row.original.branch_uuid
          ? branchNameByUuid.get(row.original.branch_uuid)
          : undefined;
        return (
          <div className='text-muted-foreground flex items-center gap-1.5 text-sm'>
            <MapPin className='h-3.5 w-3.5' />
            <span>{row.original.location_name || branchName || 'Not specified'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) =>
        row.original.is_active !== false ? (
          <Badge variant='outline' className='border-success/40 bg-success/10 text-success'>
            Active
          </Badge>
        ) : (
          <Badge variant='outline' className='text-muted-foreground'>
            Deactivated
          </Badge>
        ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8'>
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/resources/${row.original.uuid}`}>
                <CalendarDays className='mr-2 h-4 w-4' />
                Calendar & bookings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className='mr-2 h-4 w-4' />
              Edit
            </DropdownMenuItem>
            {row.original.is_active !== false ? (
              <DropdownMenuItem
                className='text-destructive focus:text-destructive'
                disabled={isDeactivating}
                onClick={() => onDeactivate(row.original)}
              >
                <Power className='mr-2 h-4 w-4' />
                Deactivate
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

export default function OrganisationResourcesPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<'all' | ResourceTypeEnum>('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<OrganisationResource | null>(null);
  const [form, setForm] = useState<ResourceFormState>(emptyForm());

  const resourcesListOptions = useMemo(
    () => ({
      path: { organisationUuid },
      query: {
        pageable: { page: 0, size: RESOURCE_PAGE_SIZE },
        ...(typeFilter !== 'all' ? { resource_type: typeFilter } : {}),
      },
    }),
    [organisationUuid, typeFilter]
  );

  const resourcesQuery = useQuery({
    ...listResourcesOptions(resourcesListOptions),
    enabled: Boolean(organisationUuid),
  });
  const resources = useMemo(
    () => extractPage<OrganisationResource>(resourcesQuery.data).items,
    [resourcesQuery.data]
  );

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
  });
  const branches = useMemo(
    () => extractPage<TrainingBranch>(branchesQuery.data).items,
    [branchesQuery.data]
  );
  const branchNameByUuid = useMemo(() => {
    const map = new Map<string, string>();
    for (const branch of branches) {
      if (branch.uuid && branch.branch_name) map.set(branch.uuid, branch.branch_name);
    }
    return map;
  }, [branches]);

  const invalidateResources = async () => {
    await queryClient.invalidateQueries({
      queryKey: listResourcesQueryKey(resourcesListOptions),
    });
  };

  const createMutation = useMutation({
    ...createResourceMutation(),
    onSuccess: async () => {
      toast.success('Resource registered successfully.');
      setIsSheetOpen(false);
      await invalidateResources();
    },
    onError: error => {
      toast.error(apiErrorMessage(error, 'Unable to register this resource.'));
    },
  });

  const updateMutation = useMutation({
    ...updateResourceMutation(),
    onSuccess: async () => {
      toast.success('Resource updated successfully.');
      setIsSheetOpen(false);
      await invalidateResources();
    },
    onError: error => {
      toast.error(apiErrorMessage(error, 'Unable to update this resource.'));
    },
  });

  const deactivateMutation = useMutation({
    ...deactivateResourceMutation(),
    onSuccess: async () => {
      toast.success('Resource deactivated.');
      await invalidateResources();
    },
    onError: error => {
      toast.error(
        apiErrorMessage(
          error,
          'Unable to deactivate this resource. Release its future bookings first.'
        )
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
    if (!organisationUuid) {
      toast.error('No organisation is available.');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Please enter a resource name.');
      return;
    }
    const isVenue = form.resource_type === ResourceTypeEnum.VENUE;
    const seatCapacity = Number.parseInt(form.seat_capacity, 10);
    const totalQuantity = Number.parseInt(form.total_quantity, 10);
    if (isVenue && (!Number.isFinite(seatCapacity) || seatCapacity < 1)) {
      toast.error('Please enter the venue seat capacity (at least 1).');
      return;
    }
    if (!isVenue && (!Number.isFinite(totalQuantity) || totalQuantity < 1)) {
      toast.error('Please enter the number of units in the equipment pool (at least 1).');
      return;
    }

    const body: OrganisationResource = {
      name: form.name.trim(),
      resource_type: form.resource_type,
      seat_capacity: isVenue ? seatCapacity : null,
      total_quantity: isVenue ? null : totalQuantity,
      branch_uuid: form.branch_uuid !== NO_BRANCH ? form.branch_uuid : null,
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

  const columns = useMemo(
    () =>
      createResourceColumns(
        openEditSheet,
        handleDeactivate,
        branchNameByUuid,
        deactivateMutation.isPending
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [branchNameByUuid, deactivateMutation.isPending, organisationUuid]
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isVenueForm = form.resource_type === ResourceTypeEnum.VENUE;

  return (
    <main className='mx-auto w-full max-w-[1520px] space-y-6 px-4 py-6 sm:px-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-foreground text-2xl font-bold tracking-tight'>Resources</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Register venues and equipment pools, manage their availability calendars, and keep job
            postings from double-booking them.
          </p>
        </div>
        <Button onClick={openCreateSheet}>
          <Plus className='mr-2 h-4 w-4' />
          New resource
        </Button>
      </div>

      <div className='flex items-center gap-2'>
        {(
          [
            { value: 'all', label: 'All' },
            { value: ResourceTypeEnum.VENUE, label: 'Venues' },
            { value: ResourceTypeEnum.EQUIPMENT_POOL, label: 'Equipment' },
          ] as const
        ).map(option => (
          <Button
            key={option.value}
            variant={typeFilter === option.value ? 'default' : 'outline'}
            size='sm'
            onClick={() => setTypeFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {resourcesQuery.isLoading ? (
        <div className='space-y-3'>
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          variant='card'
          title='No bookable resources yet'
          description='Register your classrooms, labs and shared equipment so class job postings can reserve them automatically while you recruit.'
          action={
            <Button onClick={openCreateSheet}>
              <Plus className='mr-2 h-4 w-4' />
              Register your first resource
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={resources}
          searchKey='name'
          searchPlaceholder='Search resources…'
          pageSize={10}
        />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side='right'
          className='flex w-[min(98vw,540px)] max-w-none flex-col overflow-y-auto p-4 sm:max-w-none sm:p-6'
        >
          <SheetHeader className='space-y-2 pr-10 text-left'>
            <SheetTitle>{editingResource ? 'Edit resource' : 'Register a resource'}</SheetTitle>
            <SheetDescription>
              Venues are booked exclusively per time slot; equipment pools are reserved by
              quantity. Manage opening hours and blackouts from the resource calendar after saving.
            </SheetDescription>
          </SheetHeader>

          <div className='mt-4 grid gap-4'>
            <div className='grid gap-2'>
              <Label>Name *</Label>
              <Input
                value={form.name}
                placeholder='e.g. Physics Lab B'
                onChange={event => updateField('name', event.target.value)}
              />
            </div>

            <div className='grid gap-2'>
              <Label>Type *</Label>
              <Select
                value={form.resource_type}
                onValueChange={value => updateField('resource_type', value as ResourceTypeEnum)}
                disabled={Boolean(editingResource)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ResourceTypeEnum.VENUE}>Venue (classroom, lab)</SelectItem>
                  <SelectItem value={ResourceTypeEnum.EQUIPMENT_POOL}>
                    Equipment pool (laptops, instruments)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isVenueForm ? (
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
                  Class postings using this venue cannot admit more participants than this.
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
              <Label>Branch</Label>
              <Select
                value={form.branch_uuid}
                onValueChange={value => updateField('branch_uuid', value)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='No branch' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_BRANCH}>No branch</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.uuid} value={branch.uuid ?? ''}>
                      {branch.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                placeholder='Equipment available, access notes…'
                onChange={event => updateField('description', event.target.value)}
              />
            </div>

            {editingResource ? (
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div>
                  <Label>Active</Label>
                  <p className='text-muted-foreground text-xs'>
                    Inactive resources cannot be attached to new job postings.
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
              {editingResource ? 'Save changes' : 'Register resource'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
