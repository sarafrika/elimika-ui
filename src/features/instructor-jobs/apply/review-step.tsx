import { formatRate, formatRateAmount } from '@/lib/rate-card';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobEligibility,
} from '@/services/client/types.gen';

import {
  type JobFacts,
  jobWhereLabel,
  payLabel,
  sessionsLabel,
  timesLabel,
} from '../job-facts';
import { DetailRow } from '@/components/data-display';

export function ReviewStep({
  job,
  facts,
  eligibility,
  organisationName,
  note,
}: {
  job: ClassMarketplaceJob;
  facts: JobFacts;
  eligibility: ClassMarketplaceJobEligibility | undefined;
  organisationName: string;
  note: string;
}) {
  const sessions = facts.sessionCount;
  const steps = [
    `${organisationName} reviews your application. They may shortlist you or invite you to an interview.`,
    `If they hire you, ${sessions === 1 ? 'the session is' : `the ${sessions} sessions are`} blocked on your calendar straight away.`,
    'They create the class, and it appears in your classes and Training Hub.',
  ];

  return (
    <div className='flex flex-col gap-4'>
      <div className='grid gap-2.5 sm:grid-cols-2'>
        <DetailRow
          label='Pay'
          value={
            facts.estimatedTotal === null
              ? payLabel(job)
              : `${payLabel(job)} · about ${formatRateAmount(facts.estimatedTotal)}`
          }
        />
        <DetailRow
          label='Your approved rate'
          value={
            typeof eligibility?.approved_rate === 'number'
              ? formatRate(eligibility.approved_rate, job.rate_basis)
              : 'Checked when you send'
          }
        />
        <DetailRow label='Schedule' value={`${sessionsLabel(facts)} · ${timesLabel(facts)}`} />
        <DetailRow label='Where' value={jobWhereLabel(job)} />
      </div>

      {note.trim() ? (
        <div className='space-y-1.5'>
          <p className='text-foreground text-sm font-semibold'>Your note</p>
          <p className='border-border/70 bg-muted/30 text-muted-foreground rounded-md border px-3 py-2.5 text-sm whitespace-pre-line'>
            {note.trim()}
          </p>
        </div>
      ) : null}

      <div className='space-y-2.5'>
        <p className='text-foreground text-sm font-semibold'>What happens next</p>
        <ol className='space-y-2'>
          {steps.map((step, index) => (
            <li key={step} className='flex items-start gap-2.5 text-sm'>
              <span
                aria-hidden
                className='bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold'
              >
                {index + 1}
              </span>
              <span className='text-foreground pt-0.5'>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className='text-muted-foreground text-[13px]'>
        You can withdraw at any time before you’re hired.
      </p>
    </div>
  );
}
