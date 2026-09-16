'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Info, Lock, MapPin, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useId, useState } from 'react';
import { toast } from 'sonner';

import { apiErrorMessage } from '@/components/resourcing/conflicts';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { extractEntity } from '@/lib/api-helpers';
import type { OrganisationResource, TrainingBranch } from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import {
  createResourceMutation,
  updateResourceMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';

export const RESOURCE_QUERY_IDS = ['listResources', 'getResource'] as const;

type ResourceType = (typeof ResourceTypeEnum)[keyof typeof ResourceTypeEnum];

export function branchHasPin(branch?: TrainingBranch | null) {
  return Number.isFinite(branch?.latitude) && Number.isFinite(branch?.longitude);
}

/** PUT replaces the whole resource, so send every writable field and none of the read-only ones. */
export function toResourceBody(
  resource: OrganisationResource,
  overrides: Partial<OrganisationResource> = {}
): OrganisationResource {
  const {
    uuid: _uuid,
    organisation_uuid: _organisationUuid,
    created_date: _createdDate,
    updated_date: _updatedDate,
    ...body
  } = resource;
  return { ...body, ...overrides };
}

export function BranchSelect({
  id,
  branches,
  value,
  onChange,
}: {
  id?: string;
  branches: TrainingBranch[];
  value: string;
  onChange: (branchUuid: string) => void;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className='w-full'>
        <Building2 className='text-muted-foreground' />
        <SelectValue placeholder='Select a branch' />
      </SelectTrigger>
      <SelectContent>
        {branches
          .filter(branch => branch.uuid)
          .map(branch => (
            <SelectItem key={branch.uuid} value={branch.uuid as string}>
              {branch.branch_name || 'Untitled branch'}
              {branchHasPin(branch) ? null : (
                <span className='text-muted-foreground text-xs'>· No pin yet</span>
              )}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

/** Tells the organiser which pin the resource inherits, or that its branch has none yet. */
export function BranchPinNote({ branch }: { branch: TrainingBranch }) {
  const name = branch.branch_name || 'This branch';

  if (!branchHasPin(branch)) {
    return (
      <div className='border-warning/60 bg-warning/10 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'>
        <TriangleAlert className='text-warning mt-0.5 h-4 w-4 shrink-0' />
        <p>
          <strong className='font-semibold'>{name}</strong> has no pin yet, so jobs and classes
          booking this can’t show where they train.{' '}
          {branch.uuid ? (
            <Link
              href={dashboardUrl('organisation', `branches/edit/${branch.uuid}`)}
              className='text-primary font-medium hover:underline'
            >
              Set the branch location
            </Link>
          ) : null}
        </p>
      </div>
    );
  }

  return (
    <div className='border-primary/30 bg-primary/5 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'>
      <MapPin className='text-primary mt-0.5 h-4 w-4 shrink-0' />
      <p>
        Uses <strong className='font-semibold'>{name}</strong>’s pin
        {branch.address ? ` · ${branch.address}` : ''}. It only shows in job and class pickers for
        this branch.
      </p>
    </div>
  );
}

export type ResourceFormDialogProps = {
  organisationUuid: string;
  resourceType: ResourceType;
  branches: TrainingBranch[];
  /** Fixes the branch (e.g. on the branch page); the field becomes read-only. */
  lockedBranch?: TrainingBranch;
  resource?: OrganisationResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (resource: OrganisationResource | null) => void;
};

export function ResourceFormDialog({ open, onOpenChange, ...props }: ResourceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
        {open ? (
          <ResourceForm
            key={props.resource?.uuid ?? 'new-resource'}
            onOpenChange={onOpenChange}
            {...props}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type ResourceFormState = {
  name: string;
  branchUuid: string;
  size: string;
  locationName: string;
  description: string;
  isActive: boolean;
};

function initialState(
  resourceType: ResourceType,
  resource?: OrganisationResource | null,
  lockedBranch?: TrainingBranch
): ResourceFormState {
  const size =
    resourceType === ResourceTypeEnum.VENUE ? resource?.seat_capacity : resource?.total_quantity;
  return {
    name: resource?.name ?? '',
    branchUuid: lockedBranch?.uuid ?? resource?.branch_uuid ?? '',
    size: size != null ? String(size) : '',
    locationName: resource?.location_name ?? '',
    description: resource?.description ?? '',
    isActive: resource?.is_active !== false,
  };
}

function ResourceForm({
  organisationUuid,
  resourceType,
  branches,
  lockedBranch,
  resource,
  onOpenChange,
  onSaved,
}: Omit<ResourceFormDialogProps, 'open'>) {
  const queryClient = useQueryClient();
  const fieldId = useId();
  const isVenue = resourceType === ResourceTypeEnum.VENUE;
  const isEdit = Boolean(resource?.uuid);
  const noun = isVenue ? 'venue' : 'equipment';

  const [form, setForm] = useState(() => initialState(resourceType, resource, lockedBranch));
  const [submitted, setSubmitted] = useState(false);
  const update = <K extends keyof ResourceFormState>(key: K, value: ResourceFormState[K]) =>
    setForm(previous => ({ ...previous, [key]: value }));

  const branch = lockedBranch ?? branches.find(item => item.uuid === form.branchUuid);
  const size = Number(form.size);
  const nameError = submitted && !form.name.trim() ? 'Give it a name.' : null;
  const sizeError =
    submitted && (!Number.isInteger(size) || size < 1)
      ? isVenue
        ? 'Enter a seat capacity of at least 1.'
        : 'Enter at least 1 unit.'
      : null;

  const handleError = (error: unknown) =>
    toast.error(apiErrorMessage(error, `Unable to save this ${noun}.`));
  const createMutation = useMutation({ ...createResourceMutation(), onError: handleError });
  const updateMutation = useMutation({ ...updateResourceMutation(), onError: handleError });
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSaved = async (response: unknown) => {
    await invalidateGeneratedQueryIds(queryClient, RESOURCE_QUERY_IDS);
    toast.success(isEdit ? 'Changes saved' : isVenue ? 'Venue added' : 'Equipment added', {
      description: form.name.trim(),
    });
    onSaved?.(extractEntity<OrganisationResource>(response));
    onOpenChange(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (!branch?.uuid || !form.name.trim() || !Number.isInteger(size) || size < 1) return;

    const body: OrganisationResource = {
      name: form.name.trim(),
      resource_type: resourceType,
      branch_uuid: branch.uuid,
      seat_capacity: isVenue ? size : null,
      total_quantity: isVenue ? null : size,
      location_name: form.locationName.trim() || null,
      description: form.description.trim() || null,
      is_active: isEdit ? form.isActive : true,
    };

    if (resource?.uuid) {
      updateMutation.mutate(
        { path: { organisationUuid, resourceUuid: resource.uuid }, body },
        { onSuccess: handleSaved }
      );
      return;
    }
    createMutation.mutate({ path: { organisationUuid }, body }, { onSuccess: handleSaved });
  };

  const lockedName = lockedBranch?.branch_name || 'this branch';
  const title = `${isEdit ? 'Edit' : 'Add'} ${noun}`;
  const description = lockedBranch
    ? isVenue
      ? `A room or space at ${lockedName} that sessions can book.`
      : `A pool of equipment kept at ${lockedName}.`
    : isVenue
      ? 'Venues belong to one branch. Jobs and classes at that branch can book them.'
      : 'Equipment belongs to one branch. Jobs and classes at that branch can book it.';

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className='grid gap-2'>
        <Label htmlFor={`${fieldId}-name`}>
          Name <span className='text-destructive'>*</span>
        </Label>
        <Input
          id={`${fieldId}-name`}
          value={form.name}
          onChange={event => update('name', event.target.value)}
          placeholder={isVenue ? 'e.g. Eagle Room' : 'e.g. Projector kit'}
          aria-invalid={Boolean(nameError)}
        />
        {nameError ? <p className='text-destructive text-xs'>{nameError}</p> : null}
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='grid content-start gap-2'>
          <Label htmlFor={`${fieldId}-branch`}>
            Branch {lockedBranch ? null : <span className='text-destructive'>*</span>}
          </Label>
          {lockedBranch ? (
            <div
              id={`${fieldId}-branch`}
              aria-readonly='true'
              className='border-input bg-muted/50 text-foreground flex h-9 items-center gap-2 rounded-md border px-3 text-sm'
            >
              <Building2 className='text-muted-foreground h-4 w-4 shrink-0' />
              <span className='truncate'>{lockedName}</span>
              <Lock className='text-muted-foreground ml-auto h-3.5 w-3.5 shrink-0' />
            </div>
          ) : branches.length === 0 ? (
            <p className='text-muted-foreground text-xs'>
              No branches yet.{' '}
              <Link
                href={dashboardUrl('organisation', 'settings?tab=branches')}
                className='text-primary font-medium hover:underline'
              >
                Add a branch
              </Link>{' '}
              first.
            </p>
          ) : (
            <BranchSelect
              id={`${fieldId}-branch`}
              branches={branches}
              value={form.branchUuid}
              onChange={value => update('branchUuid', value)}
            />
          )}
        </div>

        <div className='grid content-start gap-2'>
          <Label htmlFor={`${fieldId}-size`}>
            {isVenue ? 'Seat capacity' : 'Total units'} <span className='text-destructive'>*</span>
          </Label>
          <Input
            id={`${fieldId}-size`}
            type='number'
            inputMode='numeric'
            min={1}
            value={form.size}
            onChange={event => update('size', event.target.value)}
            placeholder={isVenue ? '30' : '10'}
            aria-invalid={Boolean(sizeError)}
          />
          {sizeError ? <p className='text-destructive text-xs'>{sizeError}</p> : null}
        </div>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor={`${fieldId}-where`}>Where inside the branch</Label>
        <Input
          id={`${fieldId}-where`}
          value={form.locationName}
          onChange={event => update('locationName', event.target.value)}
          placeholder={isVenue ? 'e.g. Block C, 2nd floor' : 'e.g. AV store, Block A'}
        />
        <p className='text-muted-foreground text-xs'>
          Where to find it on site. No address or map pin needed.
        </p>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor={`${fieldId}-description`}>Description</Label>
        <Textarea
          id={`${fieldId}-description`}
          rows={3}
          value={form.description}
          onChange={event => update('description', event.target.value)}
          placeholder='Optional notes for instructors'
        />
      </div>

      {isEdit ? (
        <div className='border-border/70 flex items-center justify-between gap-3 rounded-md border p-3'>
          <div>
            <Label htmlFor={`${fieldId}-active`}>Active</Label>
            <p className='text-muted-foreground text-xs'>
              Inactive items can’t be attached to new bookings.
            </p>
          </div>
          <Switch
            id={`${fieldId}-active`}
            checked={form.isActive}
            onCheckedChange={checked => update('isActive', checked)}
          />
        </div>
      ) : null}

      {branch ? <BranchPinNote branch={branch} /> : null}

      <div className='flex flex-wrap items-center justify-end gap-2'>
        {!branch ? (
          <span className='text-muted-foreground mr-auto flex items-center gap-1.5 text-xs'>
            <Info className='h-3.5 w-3.5' />
            Pick a branch to save
          </span>
        ) : null}
        <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type='submit' disabled={!branch || isPending}>
          {isPending ? <Spinner className='h-4 w-4' /> : null}
          {isEdit ? 'Save changes' : title}
        </Button>
      </div>
    </form>
  );
}
