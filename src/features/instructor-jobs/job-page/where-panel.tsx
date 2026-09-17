import { ExternalLink, MapPin, Presentation, Wrench } from 'lucide-react';

import { jobAddress, jobHasPin, jobTown } from '@/components/profile-job-marketplace/job-place';
import { StaticMap } from '@/components/maps/static-map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { googleMapsUrl } from '@/lib/geocoding';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';
import { DetailRow, SectionCard } from '@/components/data-display';

function mapsLink(job: ClassMarketplaceJob) {
  return jobHasPin(job)
    ? googleMapsUrl(job.location_latitude as number, job.location_longitude as number)
    : null;
}

/** One line for the Where header: the address, or how online delivery works. */
export function whereSummary(job: ClassMarketplaceJob) {
  if (job.location_type === 'ONLINE') return 'Online · meeting link shared when the class is created';
  return jobAddress(job) || job.branch_name || 'The organisation hasn’t set a location yet.';
}

export function OpenInMapsButton({ job }: { job: ClassMarketplaceJob }) {
  const href = job.location_type === 'ONLINE' ? null : mapsLink(job);
  if (!href) return null;
  return (
    <Button asChild variant='outline' size='sm'>
      <a href={href} target='_blank' rel='noopener noreferrer'>
        <ExternalLink aria-hidden />
        Open in Maps
      </a>
    </Button>
  );
}

/** The branch pin, venue and equipment for in-person jobs; the meeting note for online ones. */
export function JobWhereDetails({ job }: { job: ClassMarketplaceJob }) {
  const resources = job.resources ?? [];
  const venue = resources.find(
    resource => resource.resource_type === 'VENUE' && resource.resource_name
  );
  const equipment = resources.filter(
    resource => resource.resource_type === 'EQUIPMENT_POOL' && resource.resource_name
  );
  const town = jobTown(job);
  const branch = job.branch_name ? [job.branch_name, town].filter(Boolean).join(' · ') : null;

  if (job.location_type === 'ONLINE') {
    return (
      <div className='grid gap-3 sm:grid-cols-2'>
        <DetailRow label='Branch' value={job.branch_name || 'Not set'} />
        <DetailRow label='Meeting link' value='Shared when the class is created' />
      </div>
    );
  }

  return (
    <div className='grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]'>
      {jobHasPin(job) ? (
        <StaticMap
          latitude={job.location_latitude}
          longitude={job.location_longitude}
          size='md'
          alt={`Map of ${job.branch_name || 'the training location'}`}
          className='rounded-md'
        >
          <span className='border-border bg-background/95 text-foreground absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs shadow-sm'>
            <MapPin aria-hidden className='text-primary size-3' />
            {job.branch_name || 'Training location'}
          </span>
        </StaticMap>
      ) : (
        <div className='border-border/70 bg-muted/30 text-muted-foreground flex min-h-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-center text-sm'>
          <MapPin aria-hidden className='size-5' />
          The branch hasn’t pinned its location yet.
        </div>
      )}
      <div className='flex flex-col gap-2.5'>
        <DetailRow label='Branch' value={branch || jobAddress(job) || 'Not set'} />
        <DetailRow
          label='Venue'
          value={
            venue ? (
              <span className='flex items-center gap-2'>
                <Presentation aria-hidden className='text-muted-foreground size-4 shrink-0' />
                {venue.resource_name}
              </span>
            ) : (
              'No venue held yet'
            )
          }
        />
        <DetailRow
          label='Equipment provided'
          value={
            equipment.length ? (
              <span className='flex flex-wrap gap-1.5'>
                {equipment.map(item => (
                  <Badge key={item.resource_uuid} variant='outline' className='gap-1 rounded-md'>
                    <Wrench aria-hidden />
                    {item.resource_name}
                    {(item.quantity ?? 1) > 1 ? ` × ${item.quantity}` : ''}
                  </Badge>
                ))}
              </span>
            ) : (
              'None listed'
            )
          }
        />
      </div>
    </div>
  );
}

export function WherePanel({ job }: { job: ClassMarketplaceJob }) {
  return (
    <SectionCard
      title='Where you’ll teach'
      description={whereSummary(job)}
      actions={<OpenInMapsButton job={job} />}
    >
      <JobWhereDetails job={job} />
    </SectionCard>
  );
}
