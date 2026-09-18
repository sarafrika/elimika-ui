'use client';

import Link from 'next/link';
import { useId } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { OrganisationResource } from '@/services/client';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

export function EquipmentChecklist({
  equipment,
  branchName,
  value,
  onChange,
  loading,
  disabled,
}: {
  equipment: OrganisationResource[];
  branchName: string;
  value: string[];
  onChange: (equipmentUuids: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const fieldId = useId();
  const toggle = (uuid: string, on: boolean) =>
    onChange(on ? Array.from(new Set([...value, uuid])) : value.filter(item => item !== uuid));

  return (
    <div className='flex min-w-0 flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <Label id={`${fieldId}-label`}>Equipment</Label>
        {loading ? null : (
          <span className='text-muted-foreground text-xs'>
            {equipment.length} at {branchName}
          </span>
        )}
      </div>

      {loading ? (
        <div className='space-y-1 rounded-md border p-1'>
          {[0, 1, 2].map(row => (
            <Skeleton key={row} className='h-11 w-full' />
          ))}
        </div>
      ) : (
        <div
          role='group'
          aria-labelledby={`${fieldId}-label`}
          className='flex flex-col gap-0.5 rounded-md border p-1'
        >
          {equipment.map(item => {
            const uuid = item.uuid ?? '';
            const id = `${fieldId}-${uuid}`;
            return (
              <label
                key={uuid}
                htmlFor={id}
                className='hover:bg-muted/60 flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2'
              >
                <Checkbox
                  id={id}
                  checked={value.includes(uuid)}
                  onCheckedChange={checked => toggle(uuid, checked === true)}
                  disabled={disabled}
                />
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-medium'>{item.name}</span>
                  {item.location_name ? (
                    <span className='text-muted-foreground block truncate text-xs'>
                      {item.location_name}
                    </span>
                  ) : null}
                </span>
                {typeof item.total_quantity === 'number' ? (
                  <span className='text-muted-foreground shrink-0 text-xs'>
                    {item.total_quantity} units
                  </span>
                ) : null}
              </label>
            );
          })}
          {equipment.length === 0 ? (
            <p className='text-muted-foreground px-2.5 py-2 text-xs'>
              No equipment at {branchName} yet.{' '}
              <Link
                href={dashboardUrl('organisation', 'resources')}
                className='text-primary font-medium hover:underline'
              >
                Add some
              </Link>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
