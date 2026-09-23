'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { getErrorMessage } from '@/lib/error-utils';
import { formatRateAmount, formatRateBasis } from '@/lib/rate-card';
import type { SchedulingConflict } from '@/lib/scheduling-conflicts';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJob, ClassMarketplaceJobApplication } from '@/services/client';
import { sessionCountLabel } from '@/src/features/organisation/jobs/lib/job-stage';
import { HireClashAlert } from './HireClashAlert';
import { SectionCard } from '@/components/data-display';

export type HireCheck = { ok: boolean; message: string };

type RateApplication = Pick<ClassMarketplaceJobApplication, 'approved_rate' | 'rate_covers_pay'>;
type RateJob = Pick<
  ClassMarketplaceJob,
  'rate_basis' | 'instructor_pay' | 'course_uuid' | 'program_uuid'
>;

const SESSION_CAP = 200;

// The hire endpoint's two rate refusals: no approved rate, or one above the job's pay.
const RATE_REFUSAL =
  /has no approved\b.*\brate for this\b|\bapproved rate of\b.*\babove this job.s pay\b/i;

const rateIn = (amount: number, basis?: string | null) =>
  basis ? `${formatRateAmount(amount)} ${formatRateBasis(basis)}` : formatRateAmount(amount);

/** The one approved rate that applies to this job, checked against its pay as the server does. */
export function hireRateCheck(
  application: RateApplication | null | undefined,
  job: RateJob | null | undefined,
  instructorName?: string | null
): HireCheck {
  const rate = typeof application?.approved_rate === 'number' ? application.approved_rate : null;
  const pay = typeof job?.instructor_pay === 'number' ? job.instructor_pay : null;
  const basis = job?.rate_basis ?? null;

  if (rate === null) {
    const who = instructorName?.trim() || 'This instructor';
    const context = job?.program_uuid && !job.course_uuid ? 'training program' : 'course';
    const phrase = basis ? `${formatRateBasis(basis)} ` : '';
    return {
      ok: false,
      message: `${who}'s rate card has no approved ${phrase}rate for this ${context} yet. You can hire once they add one and it's approved.`,
    };
  }

  const covered = application?.rate_covers_pay ?? (pay !== null && pay >= rate);
  if (covered) {
    return {
      ok: true,
      message: `Approved rate ${rateIn(rate, basis)}, covered by this job's pay${pay !== null ? ` of ${formatRateAmount(pay)}` : ''}.`,
    };
  }
  return {
    ok: false,
    message:
      pay !== null
        ? `Their approved rate is ${rateIn(rate, basis)}, above this job's pay of ${formatRateAmount(pay)}. Raise the pay or pick another applicant.`
        : `Their approved rate is ${rateIn(rate, basis)}, but this job has no instructor pay set. Set the pay or pick another applicant.`,
  };
}

/** A server rate refusal outranks cached data until a later fetch says the rate is covered. */
export function useHireRateCheck(
  application: RateApplication | null | undefined,
  job: RateJob | null | undefined,
  instructorName: string | null | undefined,
  dataUpdatedAt: number
) {
  const [refusal, setRefusal] = useState<{ message: string; at: number } | null>(null);
  const derived = hireRateCheck(application, job, instructorName);
  const refusalStands = refusal !== null && !(derived.ok && dataUpdatedAt > refusal.at);
  const rateCheck: HireCheck = refusalStands ? { ok: false, message: refusal.message } : derived;

  const recordRateRefusal = useCallback((error: unknown) => {
    const message = getErrorMessage(error, '');
    if (!RATE_REFUSAL.test(message)) return null;
    setRefusal({ message, at: Date.now() });
    return message;
  }, []);
  const clearRateRefusal = useCallback(() => setRefusal(null), []);

  return { rateCheck, recordRateRefusal, clearRateRefusal };
}

function scheduleCheck(clashCount: number, sessionCount: number): HireCheck {
  const counted = sessionCount > 0 && sessionCount < SESSION_CAP;
  if (clashCount > 0) {
    return {
      ok: false,
      message: !counted
        ? `Clashes with ${clashCount} of the sessions.`
        : clashCount >= sessionCount
          ? 'Clashes with every session.'
          : `Clashes with ${clashCount} of the ${sessionCount} sessions.`,
    };
  }
  const across = sessionCount > 0 ? ` across ${sessionCountLabel(sessionCount, SESSION_CAP)}` : '';
  return {
    ok: true,
    message: `No clashes found yet${across}. Their calendar is checked again when you hire.`,
  };
}

function HireCheckRow({ label, check }: { label: string; check: HireCheck }) {
  const Icon = check.ok ? CheckCircle2 : XCircle;
  return (
    <div className='flex items-start gap-2.5'>
      <Icon
        aria-hidden
        className={cn('mt-0.5 size-4 shrink-0', check.ok ? 'text-success' : 'text-destructive')}
      />
      <div className='min-w-0 text-sm'>
        <div className='text-foreground font-medium'>
          {label}
          <span className='sr-only'>{check.ok ? ' passed' : ' not passed'}</span>
        </div>
        <p className='text-muted-foreground'>{check.message}</p>
      </div>
    </div>
  );
}

/** What must hold before a hire goes through: a covered rate and a clear calendar. */
export function HireChecksPanel({
  rateCheck,
  clashes,
  sessionCount,
  instructorName,
  timeZone,
  jobError,
  onRetry,
}: {
  rateCheck: HireCheck;
  clashes: SchedulingConflict[];
  sessionCount: number;
  instructorName?: string | null;
  timeZone?: string | null;
  jobError?: unknown;
  onRetry?: () => void;
}) {
  return (
    <SectionCard
      title='Hire checks'
      description='Both must pass before you can hire.'
      className='border-primary/30'
    >
      <AsyncSection
        error={jobError}
        onRetry={onRetry}
        errorTitle='Couldn’t load this job’s pay and schedule'
      >
        <div className='space-y-3'>
          <HireCheckRow label='Rate' check={rateCheck} />
          <HireCheckRow label='Schedule' check={scheduleCheck(clashes.length, sessionCount)} />
          <HireClashAlert conflicts={clashes} instructorName={instructorName} timeZone={timeZone} />
        </div>
      </AsyncSection>
    </SectionCard>
  );
}
