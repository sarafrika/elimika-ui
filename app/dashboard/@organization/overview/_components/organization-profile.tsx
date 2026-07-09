'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity } from '@/lib/api-helpers';
import type { Organisation } from '@/services/client';
import { getOrganisationByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { DetailGrid, SectionCard, StatusBadge } from '../../_components/ui';

export function OrganizationProfile() {
  const organisationContext = useOrganisation();
  const organisationUuid = organisationContext?.uuid ?? null;

  const organisationQuery = useQuery({
    ...getOrganisationByUuidOptions({
      path: { uuid: organisationUuid ?? '' },
    }),
    enabled: Boolean(organisationUuid),
  });

  const organisation = extractEntity<Organisation>(organisationQuery.data) ?? organisationContext;

  if (organisationQuery.isLoading || !organisation) {
    return (
      <SectionCard title='Organisation profile'>
        <div className='space-y-3'>
          <Skeleton className='h-6 w-40' />
          <Skeleton className='h-24 w-full' />
        </div>
      </SectionCard>
    );
  }

  const detailItems = [
    { label: 'Organisation name', value: organisation.name },
    { label: 'Country', value: organisation.country || 'Not specified' },
    { label: 'Location', value: organisation.location || 'Not specified' },
    { label: 'Licence number', value: organisation.licence_no || 'Not provided' },
    {
      label: 'Description',
      value: organisation.description || 'No description provided',
    },
  ];

  return (
    <SectionCard title='Organisation profile'>
      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <StatusBadge
          status={organisation.admin_verified ? 'verified' : 'pending'}
          label={organisation.admin_verified ? 'Verified' : 'Pending verification'}
        />
        <StatusBadge status={organisation.active ? 'active' : 'inactive'} />
        {organisation.slug ? (
          <StatusBadge tone='neutral' label={organisation.slug} className='font-mono' />
        ) : null}
      </div>

      <DetailGrid items={detailItems} />

      {organisation.created_date || organisation.updated_date ? (
        <div className='mt-4 flex flex-wrap gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground'>
          {organisation.created_date ? (
            <span>
              <span className='font-medium'>Created:</span>{' '}
              {format(new Date(organisation.created_date), 'MMM dd, yyyy')}
            </span>
          ) : null}
          {organisation.updated_date ? (
            <span>
              <span className='font-medium'>Last updated:</span>{' '}
              {format(new Date(organisation.updated_date), 'MMM dd, yyyy')}
            </span>
          ) : null}
        </div>
      ) : null}
    </SectionCard>
  );
}
