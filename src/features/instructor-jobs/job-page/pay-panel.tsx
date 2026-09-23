import { Check, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { formatRate, formatRateAmount, formatRateBasis, getRateBasis } from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';

import type { JobFacts } from '../job-facts';
import type { RateStanding } from '../job-readiness';
import { SectionCard } from '@/components/data-display';

const PAID_FOR: Record<string, string> = {
  per_hour: 'You’re paid for every hour you teach.',
  per_session: 'You’re paid per session delivered.',
  per_day: 'You’re paid per class day.',
};

const UNIT_LABEL: Record<string, string> = {
  per_hour: 'Hours',
  per_session: 'Sessions',
  per_day: 'Class days',
};

function Term({ label, value, highlight }: { label: string; value: ReactNode; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'flex min-w-28 flex-col gap-0.5 rounded-md border px-3.5 py-2.5',
        highlight ? 'border-primary/30 bg-primary/5' : 'border-border/70'
      )}
    >
      <span className='text-muted-foreground text-xs'>{label}</span>
      <strong className='text-foreground text-[17px] tabular-nums'>{value}</strong>
    </div>
  );
}

/** The job's own pay beside the instructor's approved rate for the same kind of class. */
function rateLine(job: ClassMarketplaceJob, rate: RateStanding | null) {
  const phrase = formatRateBasis(job.rate_basis);
  const pay = typeof job.instructor_pay === 'number' ? job.instructor_pay : null;
  if (!rate) return null;
  switch (rate.kind) {
    case 'ok': {
      if (rate.approvedRate === null || pay === null) {
        return { ok: true, text: 'Your approved rate fits this job’s pay.' };
      }
      const difference = pay - rate.approvedRate;
      return {
        ok: true,
        text:
          difference > 0
            ? `Your approved rate is ${formatRate(rate.approvedRate, job.rate_basis)}, so this job pays ${formatRateAmount(difference)} more ${phrase}.`
            : `This job pays your approved rate of ${formatRate(rate.approvedRate, job.rate_basis)}.`,
      };
    }
    case 'above_pay':
      return {
        ok: false,
        text: `Your approved rate of ${formatRate(rate.approvedRate, job.rate_basis)} is above this job’s pay.`,
      };
    case 'awaiting':
      return {
        ok: false,
        text: `Your ${phrase.replace(' ', '-')} rate for this kind of class is awaiting approval.`,
      };
    case 'missing':
      return {
        ok: false,
        text: `You don’t have an approved ${phrase.replace(' ', '-')} rate for this kind of class yet.`,
      };
    case 'resolving':
      return null;
  }
}

export function PayPanel({
  job,
  facts,
  rate,
  rateLoading,
}: {
  job: ClassMarketplaceJob;
  facts: JobFacts;
  rate: RateStanding | null;
  rateLoading: boolean;
}) {
  const basis = getRateBasis(job.rate_basis);
  const pay = typeof job.instructor_pay === 'number' ? job.instructor_pay : null;
  const units =
    job.rate_basis === 'per_hour' ? Math.round(facts.billedUnits * 10) / 10 : facts.billedUnits;
  const line = rateLine(job, rate);

  return (
    <SectionCard title='Pay' description={PAID_FOR[basis.value]}>
      <div className='flex flex-col gap-4'>
        {pay === null ? (
          <p className='text-muted-foreground text-sm'>
            Pay is shown once an administrator verifies your instructor profile.
          </p>
        ) : (
          <div className='flex flex-wrap items-center gap-3 text-[15px]'>
            <Term label={UNIT_LABEL[basis.value] ?? 'Units'} value={`${units}${facts.capped ? '+' : ''}`} />
            <span aria-hidden className='text-muted-foreground'>
              ×
            </span>
            <Term label={`Pay ${basis.phrase}`} value={formatRateAmount(pay)} />
            <span aria-hidden className='text-muted-foreground'>
              =
            </span>
            <Term
              label='Estimated total'
              value={facts.estimatedTotal === null ? '—' : formatRateAmount(facts.estimatedTotal)}
              highlight
            />
          </div>
        )}

        {rateLoading ? (
          <Skeleton className='h-5 w-80 max-w-full' />
        ) : line ? (
          <p className='text-foreground flex items-center gap-2.5 text-sm'>
            <span
              aria-hidden
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full',
                line.ok ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              )}
            >
              {line.ok ? <Check className='size-3.5' /> : <Minus className='size-3.5' />}
            </span>
            {line.text}
          </p>
        ) : null}

        <p className='text-muted-foreground text-[13px]'>
          If the organisation changes the schedule before hiring, the total changes with it.
        </p>
      </div>
    </SectionCard>
  );
}
