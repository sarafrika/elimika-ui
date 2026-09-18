'use client';

import { Building2, Info, Video } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useId, useState } from 'react';

import { branchHasPin, BranchSelect } from '@/components/resourcing/resource-form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrainingBranch } from '@/services/client';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import type { Delivery } from '../location-venue';
import { BranchLocationSummary } from './branch-location-summary';
import { BranchPinMissing } from './branch-pin-missing';
import { EquipmentChecklist } from './equipment-checklist';
import { useBranchResources, useOrganisationBranches } from './use-branch-resources';
import { VenueRadioList } from './venue-radio-list';

export type WhereItHappensValue = {
  branchUuid: string;
  delivery: Delivery;
  meetingLink: string;
  venueUuid: string;
  equipmentUuids: string[];
};

export const isPhysicalDelivery = (delivery: Delivery) => delivery !== 'ONLINE';

/** Why a job can't be posted from this section yet, in the order an organiser would fix them. */
export function whereItHappensBlockers(
  value: WhereItHappensValue,
  branch?: TrainingBranch | null
): string[] {
  if (!value.branchUuid) return ['Pick the branch this job runs at.'];
  if (isPhysicalDelivery(value.delivery) && branch && !branchHasPin(branch)) {
    return [`${branch.branch_name || 'This branch'} needs a pin for an in-person job.`];
  }
  return [];
}

export function WhereItHappens({
  organisationUuid,
  value,
  onChange,
  maxParticipants,
  readOnly = false,
  notice,
}: {
  organisationUuid: string;
  value: WhereItHappensValue;
  onChange: (patch: Partial<Omit<WhereItHappensValue, 'delivery'>>) => void;
  maxParticipants?: number;
  readOnly?: boolean;
  /** Shown above the fields, e.g. when an older job never had a branch. */
  notice?: ReactNode;
}) {
  const fieldId = useId();
  const { branches, query: branchesQuery } = useOrganisationBranches(organisationUuid);
  const branch = branches.find(item => item.uuid === value.branchUuid);
  const { venues, equipment, venuesQuery, equipmentQuery } = useBranchResources(
    organisationUuid,
    value.branchUuid
  );
  const [clearedFrom, setClearedFrom] = useState<string | null>(null);

  const physical = isPhysicalDelivery(value.delivery);
  const pinned = branchHasPin(branch);
  const branchName = branch?.branch_name || 'this branch';

  const changeBranch = (branchUuid: string) => {
    if (branchUuid === value.branchUuid) return;
    const hadPicks = Boolean(value.venueUuid || value.equipmentUuids.length);
    setClearedFrom(hadPicks && branch ? branch.branch_name || 'the previous branch' : null);
    onChange({ branchUuid, venueUuid: '', equipmentUuids: [] });
  };

  return (
    <div className='flex min-w-0 flex-col gap-4'>
      {notice}

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='flex min-w-0 flex-col gap-2'>
          <Label htmlFor={`${fieldId}-branch`}>
            Branch <span className='text-destructive'>*</span>
          </Label>
          {branchesQuery.isLoading && !branchesQuery.data ? (
            <Skeleton className='h-9 w-full' />
          ) : branchesQuery.error ? (
            <p className='text-destructive text-xs'>
              Couldn’t load your branches.{' '}
              <button
                type='button'
                className='font-medium underline'
                onClick={() => branchesQuery.refetch()}
              >
                Try again
              </button>
            </p>
          ) : branches.length === 0 ? (
            <p className='text-muted-foreground text-xs'>
              No branches yet.{' '}
              <Link
                href={dashboardUrl('organisation', 'branches')}
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
              value={value.branchUuid}
              onChange={changeBranch}
              disabled={readOnly}
              showAddress
            />
          )}
          <p className='text-muted-foreground text-xs'>
            {physical
              ? 'Its pin is where the training happens.'
              : 'The branch owns the class and its students.'}
          </p>
        </div>

        {value.delivery !== 'IN_PERSON' ? (
          <div className='flex min-w-0 flex-col gap-2'>
            <Label htmlFor={`${fieldId}-link`}>Meeting link</Label>
            <div className='relative'>
              <Video className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                id={`${fieldId}-link`}
                type='url'
                value={value.meetingLink}
                onChange={event => onChange({ meetingLink: event.target.value })}
                placeholder='https://meet.…'
                className='pl-9'
                disabled={readOnly}
              />
            </div>
          </div>
        ) : null}
      </div>

      {value.delivery === 'ONLINE' ? (
        <div className='border-primary/30 bg-primary/5 text-foreground flex items-start gap-2 rounded-md border px-3 py-2 text-sm'>
          <Info className='text-primary mt-0.5 h-4 w-4 shrink-0' />
          Online jobs don't hold venues or equipment. The branch still owns the class and its
          students.
        </div>
      ) : null}

      {!value.branchUuid && physical ? (
        <div className='border-border bg-muted/30 text-muted-foreground flex flex-col items-center gap-1.5 rounded-md border border-dashed px-4 py-6 text-center text-sm'>
          <Building2 className='h-5 w-5' />
          <p className='text-foreground font-semibold'>Pick a branch</p>
          <p className='max-w-md'>
            You'll see where the training happens and the venues and equipment you can hold there.
          </p>
        </div>
      ) : null}

      {branch && physical && !pinned ? <BranchPinMissing branch={branch} /> : null}
      {branch && physical && pinned ? <BranchLocationSummary branch={branch} /> : null}

      {clearedFrom && physical ? (
        <div className='border-primary/30 bg-primary/5 text-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm'>
          <Info className='text-primary h-4 w-4 shrink-0' />
          Venue and equipment cleared — they belong to {clearedFrom}.
        </div>
      ) : null}

      {branch && physical && pinned ? (
        <div className='grid gap-4 md:grid-cols-2'>
          <VenueRadioList
            venues={venues}
            branchName={branchName}
            value={value.venueUuid}
            onChange={venueUuid => {
              setClearedFrom(null);
              onChange({ venueUuid });
            }}
            maxParticipants={maxParticipants}
            loading={venuesQuery.isLoading && !venuesQuery.data}
            disabled={readOnly}
          />
          <EquipmentChecklist
            equipment={equipment}
            branchName={branchName}
            value={value.equipmentUuids}
            onChange={equipmentUuids => {
              setClearedFrom(null);
              onChange({ equipmentUuids });
            }}
            loading={equipmentQuery.isLoading && !equipmentQuery.data}
            disabled={readOnly}
          />
        </div>
      ) : null}
    </div>
  );
}
