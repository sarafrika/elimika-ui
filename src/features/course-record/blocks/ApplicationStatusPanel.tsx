import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { type CourseBlockAsyncProps, fillCourseCopy } from '../types';
import { formatCourseDate } from './_shared';

/**
 * "Your application" — the three-step timeline the pending applicant watches.
 *
 * It appears in exactly one rail (`applicationStatus`, the pending state), which
 * is why the three steps are fixed: submitted, under review, approved. The
 * applicant is by definition at step two, so the card says where the decision
 * sits and what approval will unlock, rather than re-deriving a status.
 *
 * The dots are semantic — success behind them, amber where it rests, an empty
 * ring ahead — and semantic tokens do not re-hue per dashboard, which is right
 * for a state that means the same thing everywhere.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Copy
 * ────────────────────────────────────────────────────────────────────────── */

const PANEL_TITLE = 'Your application';

const SUBMITTED_LABEL = 'Submitted';
const RATE_CARD_ATTACHED = 'rate card attached';

const REVIEW_LABEL = 'Under review by creator';
const REVIEW_DETAIL = 'Typically decided within {decisionDays} working days';

const APPROVED_LABEL = 'Approved — content unlocks';
const APPROVED_DETAIL = 'You may then create classes for this course';

/* ────────────────────────────────────────────────────────────────────────────
 * Block
 * ────────────────────────────────────────────────────────────────────────── */

export interface ApplicationStatusPanelProps extends CourseBlockAsyncProps {
  /** ISO date the application was submitted. */
  submittedOn?: string;
  /** True when a rate card went with the submission. */
  rateCardAttached?: boolean;
  /** The creator's typical turnaround, in working days. */
  decisionDays?: number;
  className?: string;
}

export function ApplicationStatusPanel({
  submittedOn,
  rateCardAttached,
  decisionDays,
  loading,
  error,
  onRetry,
  className,
}: ApplicationStatusPanelProps) {
  const submitted = [
    formatCourseDate(submittedOn),
    rateCardAttached ? RATE_CARD_ATTACHED : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  const review =
    decisionDays === undefined ? undefined : fillCourseCopy(REVIEW_DETAIL, { decisionDays });

  return (
    <Card className={cn('gap-0 px-[18px] py-4', className)}>
      <h3 className='text-sm font-bold'>{PANEL_TITLE}</h3>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        skeleton={<ApplicationStatusPanelSkeleton />}
        errorTitle='Couldn’t load your application'
      >
        <ol className='mt-3 flex flex-col'>
          <Step tone='done' label={SUBMITTED_LABEL} detail={submitted || undefined} connected />
          <Step tone='current' label={REVIEW_LABEL} detail={review} connected />
          <Step tone='upcoming' label={APPROVED_LABEL} detail={APPROVED_DETAIL} />
        </ol>
      </AsyncSection>
    </Card>
  );
}

type StepTone = 'done' | 'current' | 'upcoming';

const STEP_DOT: Record<StepTone, string> = {
  done: 'bg-success',
  current: 'bg-warning',
  upcoming: 'border-input border-2',
};

function Step({
  tone,
  label,
  detail,
  connected,
}: {
  tone: StepTone;
  label: string;
  detail?: string;
  connected?: boolean;
}) {
  return (
    <li className='flex gap-[11px]'>
      <span className='flex flex-none flex-col items-center'>
        <span className={cn('size-[11px] rounded-full', STEP_DOT[tone])} aria-hidden />
        {connected ? <span className='bg-border w-0.5 flex-1' aria-hidden /> : null}
      </span>
      <span className={cn('block', connected && 'pb-3.5')}>
        <span
          className={cn(
            'block text-[12.5px] font-semibold',
            tone === 'upcoming' && 'text-muted-foreground'
          )}
        >
          {label}
        </span>
        {detail ? (
          <span className='text-muted-foreground block text-[11.5px]'>{detail}</span>
        ) : null}
      </span>
    </li>
  );
}

export function ApplicationStatusPanelSkeleton() {
  return (
    <div className='mt-3 flex flex-col'>
      {[0, 1, 2].map(step => (
        <div key={step} className='flex gap-[11px] pb-3.5 last:pb-0'>
          <Skeleton className='size-[11px] flex-none rounded-full' />
          <div className='flex-1 space-y-1.5'>
            <Skeleton className='h-3 w-36' />
            <Skeleton className='h-2.5 w-44' />
          </div>
        </div>
      ))}
    </div>
  );
}
