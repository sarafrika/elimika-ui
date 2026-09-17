'use client';

import { Activity } from 'lucide-react';

import { AsyncSection } from '@/components/data/async-section';
import { statusLabel } from '@/components/profile-job-marketplace/application-status';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, parseApiDate } from '@/lib/date';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobApplication,
  Instructor,
} from '@/services/client';
import { SectionCard } from '@/components/data-display';

type ActivityEvent = { key: string; text: string; at: Date };

const time = (value?: Date | string | null) => parseApiDate(value)?.toDate() ?? null;

/** Rebuilds a timeline from the dates the job and its applications already carry. */
function deriveEvents(
  job: ClassMarketplaceJob,
  applications: ClassMarketplaceJobApplication[],
  instructorMap: Record<string, Instructor>
) {
  const events: ActivityEvent[] = [];
  const push = (key: string, text: string, value?: Date | string | null) => {
    const at = time(value);
    if (at) events.push({ key, text, at });
  };
  const where = job.branch_name ? ` at ${job.branch_name}` : '';
  const resources = (job.resources ?? []).map(resource => resource.resource_name).filter(Boolean);

  push('posted', `Job posted${where}`, job.created_date);
  if (resources.length)
    push('held', `${resources.join(', ')} held for the job’s sessions`, job.created_date);

  const created = time(job.created_date)?.getTime() ?? 0;
  const updated = time(job.updated_date)?.getTime() ?? 0;
  if (updated - created > 60_000 && !job.filled_at) {
    push(
      'updated',
      job.status === 'cancelled' ? 'Job cancelled' : 'Job last updated',
      job.updated_date
    );
  }

  for (const application of applications) {
    const name =
      (application.instructor_uuid && instructorMap[application.instructor_uuid]?.full_name) ||
      'An instructor';
    push(`applied-${application.uuid}`, `${name} applied`, application.created_date);
    const status = String(application.status ?? '').toLowerCase();
    if (application.reviewed_at && status && status !== 'pending') {
      const verb =
        status === 'hired' || status === 'assigned' ? 'hired' : statusLabel(status).toLowerCase();
      push(`reviewed-${application.uuid}`, `${name} ${verb}`, application.reviewed_at);
    }
  }

  push('filled', 'Class created — holds confirmed', job.filled_at);
  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function JobActivityTab({
  job,
  applications,
  applicationsLoading,
  applicationsError,
  instructorMap,
}: {
  job: ClassMarketplaceJob;
  applications: ClassMarketplaceJobApplication[];
  applicationsLoading: boolean;
  applicationsError: unknown;
  instructorMap: Record<string, Instructor>;
}) {
  const events = deriveEvents(job, applications, instructorMap);

  return (
    <SectionCard
      title='Activity'
      description='Pieced together from the job and its applications, so edits and hold changes in between are not listed.'
    >
      <AsyncSection
        loading={applicationsLoading}
        error={applicationsError}
        errorTitle='Couldn’t load the applications behind this timeline'
        skeleton={
          <div className='space-y-4'>
            {[0, 1, 2].map(row => (
              <Skeleton key={row} className='h-10 w-full' />
            ))}
          </div>
        }
        empty={events.length === 0}
        emptyTitle='No activity yet'
      >
        <ol className='flex flex-col'>
          {events.map(event => (
            <li key={event.key} className='flex items-start gap-3 pb-4 last:pb-0'>
              <span className='border-primary/30 bg-primary/10 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border'>
                <Activity className='h-3 w-3' />
              </span>
              <div className='min-w-0'>
                <p className='text-sm font-medium'>{event.text}</p>
                <p className='text-muted-foreground text-xs'>{formatDateTime(event.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      </AsyncSection>
    </SectionCard>
  );
}
