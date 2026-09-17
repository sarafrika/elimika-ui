import Link from 'next/link';
import type { ReactNode } from 'react';

import { DetailRow, SectionCard } from '@/app/dashboard/admin/_components/ui';
import { formatDate, formatDateOnly } from '@/lib/date';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { deliveryLabel, serviceLabel } from '@/src/features/organisation/jobs/lib/job-stage';

import { type JobFacts, sessionDate } from '../job-facts';

export function OverviewPanel({
  job,
  contentTitle,
  creatorName,
}: {
  job: ClassMarketplaceJob;
  contentTitle: string | null;
  creatorName: string | null;
}) {
  const learners = job.target_groups?.filter(Boolean) ?? [];
  const contentLabel = contentTitle ?? (job.program_uuid ? 'Training program' : 'Course');
  const content =
    job.course_uuid && !job.program_uuid ? (
      <Link
        href={dashboardUrl('instructor', `courses/${encodeURIComponent(job.course_uuid)}`)}
        className='text-primary hover:underline'
      >
        {contentLabel}
      </Link>
    ) : (
      contentLabel
    );

  return (
    <SectionCard title='Overview'>
      <div className='flex flex-col gap-4'>
        <p className='text-foreground text-[15px] leading-7 whitespace-pre-line'>
          {job.description || 'The organisation hasn’t added a description yet.'}
        </p>
        <div className='grid gap-2.5 sm:grid-cols-3'>
          <DetailRow
            label={job.program_uuid ? 'Program' : 'Course'}
            value={
              <>
                {content}
                {creatorName ? (
                  <span className='text-muted-foreground font-normal'> · {creatorName}</span>
                ) : null}
              </>
            }
          />
          <DetailRow
            label='Learners'
            value={learners.length ? learners.join(', ') : 'Open to all learners'}
          />
          <DetailRow
            label='Service'
            value={`${serviceLabel(job.service_type, job.session_format)} · ${deliveryLabel(job.location_type).toLowerCase()}`}
          />
        </div>
      </div>
    </SectionCard>
  );
}

function DateRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='border-border/60 grid gap-1 border-b py-3 text-sm last:border-b-0 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-3'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='text-foreground'>{children}</dd>
    </div>
  );
}

function range(from: string, to: string) {
  return from === to ? from : `${from} – ${to}`;
}

export function DatesPanel({ job, facts }: { job: ClassMarketplaceJob; facts: JobFacts }) {
  const registrationStart = job.registration_period_start_date;
  const registrationEnd = job.registration_period_end_date;

  return (
    <SectionCard title='Important dates'>
      <dl>
        <DateRow label='Posted'>{formatDate(job.created_date, { fallback: 'Not recorded' })}</DateRow>
        <DateRow label='Learner registration'>
          {registrationStart || registrationEnd
            ? range(
                formatDateOnly(registrationStart, 'Open'),
                formatDateOnly(registrationEnd, 'until the class starts')
              )
            : 'Not set'}
        </DateRow>
        <DateRow label='Applications close'>
          {facts.first
            ? `${sessionDate(facts.first, 'ddd D MMM YYYY, h:mm A')}, when the first session starts`
            : 'When the first session starts'}
        </DateRow>
        <DateRow label='Training'>
          {facts.first && facts.last
            ? range(sessionDate(facts.first, 'ddd D MMM YYYY'), sessionDate(facts.last, 'ddd D MMM YYYY'))
            : 'No sessions scheduled'}
        </DateRow>
      </dl>
    </SectionCard>
  );
}
