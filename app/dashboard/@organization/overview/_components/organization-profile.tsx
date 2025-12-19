'use client';

import { useQuery } from '@tanstack/react-query';
import { useOrganisation } from '@/context/organisation-context';
import { elimikaDesignSystem } from '@/lib/design-system';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getOrganisationByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { extractEntity } from '@/lib/api-helpers';
import type { Organisation } from '@/services/client';
import { Globe2, MapPin, FileText, ShieldCheck, ShieldAlert, Building2 } from 'lucide-react';
import { format } from 'date-fns';

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
      <div className={elimikaDesignSystem.components.card.base}>
        <div className='space-y-4'>
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
        </div>
      </div>
    );
  }

  const profileFields = [
    {
      label: 'Organization Name',
      value: organisation.name,
      icon: Building2,
    },
    {
      label: 'Description',
      value: organisation.description || 'No description provided',
      icon: FileText,
    },
    {
      label: 'Country',
      value: organisation.country || 'Not specified',
      icon: Globe2,
    },
    {
      label: 'Location',
      value: organisation.location || 'Not specified',
      icon: MapPin,
    },
    {
      label: 'License Number',
      value: organisation.licence_no || 'Not provided',
      icon: FileText,
    },
  ];

  return (
    <div className={elimikaDesignSystem.components.card.base}>
      {/* Status Badge */}
      <div className='mb-5 flex flex-wrap items-center gap-3'>
        {organisation.admin_verified ? (
          <Badge variant='secondary' className='gap-2'>
            <ShieldCheck className='h-3.5 w-3.5' />
            Verified Organization
          </Badge>
        ) : (
          <Badge variant='outline' className='gap-2'>
            <ShieldAlert className='h-3.5 w-3.5' />
            Pending Verification
          </Badge>
        )}

        <Badge variant={organisation.active ? 'secondary' : 'outline'}>
          {organisation.active ? 'Active' : 'Inactive'}
        </Badge>

        {organisation.slug && (
          <Badge variant='outline' className='font-mono text-xs'>
            {organisation.slug}
          </Badge>
        )}
      </div>

      {/* Profile Fields */}
      <div className='grid gap-4 sm:grid-cols-2'>
        {profileFields.map(field => {
          const Icon = field.icon;

          return (
            <div key={field.label} className='border-border bg-muted/30 rounded-xl border p-4'>
              <div className='text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
                <Icon className='h-3.5 w-3.5' />
                {field.label}
              </div>
              <p className='text-foreground text-sm font-medium'>{field.value}</p>
            </div>
          );
        })}
      </div>

      {/* Timestamps */}
      {(organisation.created_date || organisation.updated_date) && (
        <div className='border-border text-muted-foreground mt-4 flex flex-wrap gap-4 border-t pt-4 text-xs'>
          {organisation.created_date && (
            <div>
              <span className='font-medium'>Created:</span>{' '}
              {format(new Date(organisation.created_date), 'MMM dd, yyyy')}
            </div>
          )}
          {organisation.updated_date && (
            <div>
              <span className='font-medium'>Last Updated:</span>{' '}
              {format(new Date(organisation.updated_date), 'MMM dd, yyyy')}
            </div>
          )}
        </div>
      )}

      {/* Coordinates (if available) */}
      {(organisation.latitude || organisation.longitude) && (
        <div className='bg-muted mt-3 rounded-lg p-3 text-xs'>
          <span className='text-foreground font-medium'>Coordinates:</span>{' '}
          <span className='text-muted-foreground font-mono'>
            {organisation.latitude ?? '—'}, {organisation.longitude ?? '—'}
          </span>
        </div>
      )}
    </div>
  );
}
