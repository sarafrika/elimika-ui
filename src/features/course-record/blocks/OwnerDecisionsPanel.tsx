import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { CourseBlockAsyncProps, CourseTrainerApplicantType } from '../types';
import { courseInitials, formatCourseDate } from './_shared';

/**
 * "Pending your decision" — the training applications waiting on the creator,
 * with the two buttons that settle them.
 *
 * Creator only: the capability map puts `ownerDecisions` in one rail, because
 * approving a trainer is the one thing on this record nobody else can do.
 *
 * A row is a view model rather than a raw `CourseTrainingApplication`, because
 * an application carries the applicant's uuid but not their name — the route
 * that already knows the organisations and instructors composes the row, and
 * this block renders it.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Copy
 * ────────────────────────────────────────────────────────────────────────── */

const PANEL_TITLE = 'Pending your decision';
const PANEL_SUB = 'Training applications waiting on the creator.';
const APPROVE = 'Approve';
const DECLINE = 'Decline';

/** Reads into the meta line: "Organisation · applied 28 Aug 2026". */
const APPLICANT_TYPE_LABELS: Record<CourseTrainerApplicantType, string> = {
  organisation: 'Organisation',
  instructor: 'Instructor',
};

/**
 * Organisations and instructors are told apart by a categorical chart hue, not
 * by the brand — the brand is already spoken for by the page around them, and
 * these two hues stay the same on all six dashboards.
 */
const APPLICANT_AVATAR_TONE: Record<CourseTrainerApplicantType, string> = {
  organisation: 'bg-chart-4/15 text-chart-4',
  instructor: 'bg-chart-2/15 text-chart-2',
};

/* ────────────────────────────────────────────────────────────────────────────
 * Block
 * ────────────────────────────────────────────────────────────────────────── */

/** One application awaiting a decision, as this card needs it. */
export interface CourseApplicationRow {
  /** The application's uuid — what a decision is taken against. */
  uuid: string;
  displayName: string;
  applicantType: CourseTrainerApplicantType;
  /** ISO date the application was submitted. */
  appliedAt?: string;
}

export interface OwnerDecisionsPanelProps extends CourseBlockAsyncProps {
  /** Applications still pending, oldest first. */
  applications?: readonly CourseApplicationRow[];
  onApprove?: (row: CourseApplicationRow) => void;
  onDecline?: (row: CourseApplicationRow) => void;
  /** The row whose decision is in flight; its buttons disable until it lands. */
  busyUuid?: string;
  className?: string;
}

export function OwnerDecisionsPanel({
  applications,
  onApprove,
  onDecline,
  busyUuid,
  loading,
  error,
  onRetry,
  className,
}: OwnerDecisionsPanelProps) {
  const rows = applications ?? [];

  return (
    <Card className={cn('gap-0 px-[18px] py-4', className)}>
      <h3 className='text-sm font-bold'>{PANEL_TITLE}</h3>
      <p className='text-muted-foreground mt-[3px] text-xs'>{PANEL_SUB}</p>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={rows.length === 0}
        skeleton={<OwnerDecisionsPanelSkeleton />}
        errorTitle='Couldn’t load the training applications'
        emptyTitle='Nothing waiting on you'
        emptyDescription='Instructors and organisations applying to deliver this course appear here.'
      >
        <div className='mt-3 flex flex-col gap-2.5'>
          {rows.map(row => (
            <DecisionRow
              key={row.uuid}
              row={row}
              onApprove={onApprove}
              onDecline={onDecline}
              busy={row.uuid === busyUuid}
            />
          ))}
        </div>
      </AsyncSection>
    </Card>
  );
}

function DecisionRow({
  row,
  onApprove,
  onDecline,
  busy,
}: {
  row: CourseApplicationRow;
  onApprove?: (row: CourseApplicationRow) => void;
  onDecline?: (row: CourseApplicationRow) => void;
  busy: boolean;
}) {
  const applied = formatCourseDate(row.appliedAt);
  const meta = [
    APPLICANT_TYPE_LABELS[row.applicantType],
    applied ? `applied ${applied}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className='rounded-xl border px-3 py-[11px]'>
      <div className='flex items-center gap-[9px]'>
        <span
          aria-hidden
          className={cn(
            'inline-flex size-7 flex-none items-center justify-center rounded-[9px] text-[10.5px] font-bold',
            APPLICANT_AVATAR_TONE[row.applicantType]
          )}
        >
          {courseInitials(row.displayName)}
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-[12.5px] font-semibold'>{row.displayName}</span>
          <span className='text-muted-foreground block text-[11px]'>{meta}</span>
        </span>
      </div>

      <div className='mt-[9px] flex gap-[7px]'>
        <Button
          variant='success'
          className='h-9 flex-1 rounded-[9px] text-xs font-semibold md:h-7'
          onClick={() => onApprove?.(row)}
          disabled={busy || !onApprove}
        >
          {APPROVE}
        </Button>
        <Button
          variant='outline'
          className='text-foreground/80 h-9 flex-1 rounded-[9px] text-xs font-semibold md:h-7'
          onClick={() => onDecline?.(row)}
          disabled={busy || !onDecline}
        >
          {DECLINE}
        </Button>
      </div>
    </div>
  );
}

export function OwnerDecisionsPanelSkeleton() {
  return (
    <div className='mt-3 flex flex-col gap-2.5'>
      {[0, 1].map(row => (
        <div key={row} className='rounded-xl border px-3 py-[11px]'>
          <div className='flex items-center gap-[9px]'>
            <Skeleton className='size-7 rounded-[9px]' />
            <div className='flex-1 space-y-1.5'>
              <Skeleton className='h-3 w-32' />
              <Skeleton className='h-2.5 w-40' />
            </div>
          </div>
          <div className='mt-[9px] flex gap-[7px]'>
            <Skeleton className='h-9 flex-1 rounded-[9px] md:h-7' />
            <Skeleton className='h-9 flex-1 rounded-[9px] md:h-7' />
          </div>
        </div>
      ))}
    </div>
  );
}
