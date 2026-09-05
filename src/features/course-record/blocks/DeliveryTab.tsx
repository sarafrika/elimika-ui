import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import {
  type CourseAccess,
  type CourseBlockAsyncProps,
  type CourseTrainerApplicantType,
  type CourseTrainerSummary,
  courseCapability,
} from '../types';
import {
  COURSE_PLACEHOLDER,
  type CourseClassRow,
  courseInitials,
  courseSeatFill,
  formatCourseCount,
  formatCourseDate,
  formatRateCardFrom,
} from './_shared';

/**
 * The delivery tab — who is approved to train this course, and what they are
 * running right now.
 *
 * Two independent regions, two `<AsyncSection>`s: a slow trainers call never
 * blanks the class grid below it. Both sub-blocks are exported so a page can
 * place them apart (the creator's standalone delivery screen does exactly that).
 *
 * ## The fourth column
 *
 * The heading comes from the capability map (`Rate card (from)` for the creator
 * and admins, `Delivering` for everyone else) and **the content comes from the
 * response**: a trainer row carries `rate_card` only for viewers the API is
 * willing to show rates to. When it is absent the cell falls back to `location`.
 * There is no fuller object to pick a rate out of, which is the point — an
 * organisation reading this list can see who else delivers the course and where,
 * never what they charge.
 */

export interface DeliveryTabProps {
  /** From the API. The capability map, not a domain check, shapes the table. */
  access: CourseAccess;
  /** Approved and pending trainers, newest decision last. */
  trainers?: readonly CourseTrainerSummary[];
  /** Spread `asyncProps(record.trainers)`. */
  trainersAsync?: CourseBlockAsyncProps;
  /** Classes an approved trainer is running. */
  classes?: readonly CourseClassRow[];
  /** Spread `asyncProps(record.classes)`. */
  classesAsync?: CourseBlockAsyncProps;
  /** Right-hand meta on the class card: "17 active · 3 accepting enrolment". */
  classesAcceptingCount?: number;
  className?: string;
}

export function DeliveryTab({
  access,
  trainers,
  trainersAsync,
  classes,
  classesAsync,
  classesAcceptingCount,
  className,
}: DeliveryTabProps) {
  return (
    <div className={cn('flex flex-col gap-[18px]', className)}>
      <DeliveryTrainerTable access={access} trainers={trainers} {...trainersAsync} />
      <DeliveryClassGrid
        classes={classes}
        acceptingCount={classesAcceptingCount}
        {...classesAsync}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Approved trainers
 * ────────────────────────────────────────────────────────────────────────── */

export interface DeliveryTrainerTableProps extends CourseBlockAsyncProps {
  access: CourseAccess;
  trainers?: readonly CourseTrainerSummary[];
  className?: string;
}

/** Shared by the header row and every body row so the columns cannot drift. */
const TRAINER_GRID =
  'grid grid-cols-[minmax(0,1.6fr)_92px_116px_minmax(0,1.1fr)_92px] items-center gap-3';

/** Below `md` the grid is dropped for stacked cards, so it never has to scroll. */
const TRAINER_TABLE_MIN_WIDTH = 'min-w-[680px]';

export function DeliveryTrainerTable({
  access,
  trainers,
  loading,
  error,
  onRetry,
  className,
}: DeliveryTrainerTableProps) {
  const capability = courseCapability(access);
  const rows = trainers ?? [];

  const approved = rows.filter(row => Boolean(row.approved_at)).length;
  const pending = rows.length - approved;
  const counts = [
    `${formatCourseCount(approved)} approved`,
    pending > 0 ? `${formatCourseCount(pending)} pending` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className={cn('gap-0 overflow-hidden py-0', className)}>
      <div className='flex items-start justify-between gap-3 px-5 pt-4 pb-3.5'>
        <div className='min-w-0'>
          <h3 className='text-[15px] font-bold tracking-tight'>Who is offering this course</h3>
          {capability.deliveryBlurb ? (
            <p className='text-muted-foreground mt-[3px] text-[12.5px] leading-[1.45]'>
              {capability.deliveryBlurb}
            </p>
          ) : null}
        </div>

        <div className='flex flex-none items-center gap-2'>
          {capability.showRates ? <ConfidentialChip /> : null}
          {rows.length > 0 ? (
            <span className='bg-primary/10 text-primary inline-flex h-[26px] items-center rounded-[10px] px-2.5 text-xs font-bold whitespace-nowrap'>
              {counts}
            </span>
          ) : null}
        </div>
      </div>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={rows.length === 0}
        skeleton={<TrainerTableSkeleton />}
        errorTitle='Couldn’t load the trainers on this course'
        emptyTitle='No trainers approved yet'
        emptyDescription='Instructors and organisations appear here once the creator approves a training application.'
        className='mx-5 mb-5'
      >
        {/* ≥768: the table. */}
        <div className='hidden overflow-x-auto md:block'>
          <div className={TRAINER_TABLE_MIN_WIDTH} role='table' aria-label='Approved trainers'>
            <div
              className={cn(
                TRAINER_GRID,
                'bg-muted border-border text-muted-foreground border-y px-5 py-[9px] text-[11px] font-bold tracking-[0.05em] uppercase'
              )}
              role='row'
            >
              <span role='columnheader'>Trainer</span>
              <span role='columnheader'>Type</span>
              <span role='columnheader'>Approved</span>
              <span role='columnheader'>{capability.deliveryColumnHeading}</span>
              <span role='columnheader' className='text-right'>
                Classes
              </span>
            </div>

            {rows.map(trainer => {
              const cells = trainerCells(trainer);
              return (
                <div
                  key={trainer.applicant_uuid}
                  role='row'
                  className={cn(TRAINER_GRID, 'border-b-muted border-b px-5 py-3')}
                >
                  <span role='cell' className='flex min-w-0 items-center gap-2.5'>
                    <TrainerAvatar trainer={trainer} />
                    <span className='min-w-0'>
                      <span className='block truncate text-[13.5px] font-semibold'>
                        {trainer.display_name}
                      </span>
                      {cells.meta ? (
                        <span className='text-muted-foreground block truncate text-[11.5px]'>
                          {cells.meta}
                        </span>
                      ) : null}
                    </span>
                  </span>

                  <span role='cell' className='text-foreground/80 text-xs'>
                    {applicantTypeLabel(trainer.applicant_type)}
                  </span>

                  <span role='cell'>
                    <TrainerStatusChip approvedAt={trainer.approved_at} />
                  </span>

                  <span role='cell' className='text-foreground/80 text-[12.5px]'>
                    {cells.column ?? COURSE_PLACEHOLDER}
                  </span>

                  <span role='cell' className='text-right text-[13px] font-bold'>
                    {cells.classes}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* <768: one card per trainer. */}
        <div className='md:hidden'>
          {rows.map(trainer => {
            const cells = trainerCells(trainer);
            return (
              <div key={trainer.applicant_uuid} className='border-b-muted border-b px-4 py-3.5'>
                <div className='flex items-center gap-2.5'>
                  <TrainerAvatar trainer={trainer} />
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-[13.5px] font-semibold'>
                      {trainer.display_name}
                    </div>
                    <div className='text-muted-foreground truncate text-[11.5px]'>
                      {[applicantTypeLabel(trainer.applicant_type), cells.meta]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <TrainerStatusChip approvedAt={trainer.approved_at} />
                </div>

                <dl className='mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5'>
                  <StackedField label={capability.deliveryColumnHeading}>
                    {cells.column ?? COURSE_PLACEHOLDER}
                  </StackedField>
                  <StackedField label='Classes'>{cells.classes}</StackedField>
                </dl>
              </div>
            );
          })}
        </div>
      </AsyncSection>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Live classes
 * ────────────────────────────────────────────────────────────────────────── */

export interface DeliveryClassGridProps extends CourseBlockAsyncProps {
  classes?: readonly CourseClassRow[];
  /** How many of them are still taking learners. Omitted when unknown. */
  acceptingCount?: number;
  className?: string;
}

/** A class this full is the one to watch; below it there are seats to sell. */
const HEALTHY_FILL_PERCENT = 50;

export function DeliveryClassGrid({
  classes,
  acceptingCount,
  loading,
  error,
  onRetry,
  className,
}: DeliveryClassGridProps) {
  const rows = classes ?? [];
  const meta = [
    rows.length > 0 ? `${formatCourseCount(rows.length)} active` : undefined,
    acceptingCount === undefined
      ? undefined
      : `${formatCourseCount(acceptingCount)} accepting enrolment`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className={cn('gap-0 px-5 py-4', className)}>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h3 className='text-[15px] font-bold tracking-tight'>Live classes running this course</h3>
        {meta ? <span className='text-muted-foreground text-right text-xs'>{meta}</span> : null}
      </div>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={rows.length === 0}
        skeleton={<ClassGridSkeleton />}
        errorTitle='Couldn’t load the classes on this course'
        emptyTitle='No classes running yet'
        emptyDescription='Classes appear here as approved trainers schedule them.'
      >
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          {rows.map(row => {
            const fill = courseSeatFill(row.seatsTaken, row.seatsTotal);
            const where = [row.format, row.place].filter(Boolean).join(' · ');

            return (
              <div key={row.uuid} className='border-border rounded-lg border px-3.5 py-[13px]'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='truncate text-[13px] font-bold'>{row.title}</span>
                  <span
                    className={cn(
                      'size-2 flex-none rounded-full',
                      fill === undefined
                        ? 'bg-muted-foreground/40'
                        : fill >= HEALTHY_FILL_PERCENT
                          ? 'bg-success'
                          : 'bg-warning'
                    )}
                  />
                </div>

                {row.host ? (
                  <div className='text-muted-foreground mt-[5px] truncate text-xs'>{row.host}</div>
                ) : null}

                <div className='mt-[9px] flex items-center justify-between gap-2 text-xs'>
                  <span className='text-foreground/80 truncate'>{where}</span>
                  <span className='flex-none font-bold'>
                    {row.seatsTaken === undefined || row.seatsTotal === undefined
                      ? COURSE_PLACEHOLDER
                      : `${formatCourseCount(row.seatsTaken)} / ${formatCourseCount(row.seatsTotal)}`}
                  </span>
                </div>

                {fill === undefined ? null : (
                  <Progress
                    value={fill}
                    className='bg-muted mt-2 h-[5px]'
                    aria-label={`Seats taken on ${row.title}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </AsyncSection>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeletons
 * ────────────────────────────────────────────────────────────────────────── */

export function DeliveryTabSkeleton() {
  return (
    <div className='flex flex-col gap-[18px]'>
      <Card className='gap-0 overflow-hidden py-0'>
        <div className='px-5 pt-4 pb-3.5'>
          <Skeleton className='h-4 w-52' />
          <Skeleton className='mt-2 h-3 w-80 max-w-full' />
        </div>
        <TrainerTableSkeleton />
      </Card>
      <Card className='gap-0 px-5 py-4'>
        <Skeleton className='mb-3 h-4 w-56' />
        <ClassGridSkeleton />
      </Card>
    </div>
  );
}

function TrainerTableSkeleton() {
  return (
    <div>
      <div className='bg-muted border-border h-[33px] border-y' />
      {[0, 1, 2, 3].map(row => (
        <div
          key={row}
          className='border-b-muted flex items-center gap-2.5 border-b px-5 py-3 md:gap-3'
        >
          <Skeleton className='size-8 flex-none rounded-[10px]' />
          <div className='min-w-0 flex-1 space-y-1.5'>
            <Skeleton className='h-3 w-40 max-w-full' />
            <Skeleton className='h-2.5 w-28 max-w-full' />
          </div>
          <Skeleton className='hidden h-3 w-16 flex-none md:block' />
          <Skeleton className='h-6 w-24 flex-none rounded-[9px]' />
          <Skeleton className='hidden h-3 w-24 flex-none md:block' />
          <Skeleton className='hidden h-3 w-8 flex-none md:block' />
        </div>
      ))}
    </div>
  );
}

function ClassGridSkeleton() {
  return (
    <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
      {[0, 1, 2].map(cell => (
        <div key={cell} className='border-border rounded-lg border px-3.5 py-[13px]'>
          <Skeleton className='h-3.5 w-32 max-w-full' />
          <Skeleton className='mt-2 h-3 w-24 max-w-full' />
          <div className='mt-2.5 flex items-center justify-between gap-2'>
            <Skeleton className='h-3 w-28 max-w-full' />
            <Skeleton className='h-3 w-10 flex-none' />
          </div>
          <Skeleton className='mt-2 h-[5px] w-full rounded-full' />
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Parts
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * The confidentiality mark. Destructive-tinted because it is a warning about
 * disclosure, and semantic tokens are fixed across every dashboard domain.
 */
function ConfidentialChip() {
  return (
    <span className='bg-destructive/10 text-destructive inline-flex h-[26px] items-center gap-1.5 rounded-[10px] px-2.5 text-[11.5px] font-bold whitespace-nowrap'>
      <Lock className='size-3' aria-hidden />
      Confidential
    </span>
  );
}

/**
 * Organisations and instructors are told apart by a categorical chart hue rather
 * than by the brand, which is already spoken for by the page itself.
 */
const TRAINER_AVATAR_TONE: Record<CourseTrainerApplicantType, string> = {
  organisation: 'bg-chart-4/15 text-chart-4',
  instructor: 'bg-chart-2/15 text-chart-2',
};

function TrainerAvatar({ trainer }: { trainer: CourseTrainerSummary }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-8 flex-none items-center justify-center rounded-[10px] text-[11px] font-bold',
        trainer.approved_at
          ? TRAINER_AVATAR_TONE[trainer.applicant_type]
          : 'bg-muted text-muted-foreground'
      )}
    >
      {courseInitials(trainer.display_name)}
    </span>
  );
}

function TrainerStatusChip({ approvedAt }: { approvedAt?: string }) {
  const approved = formatCourseDate(approvedAt);

  if (!approved) {
    return (
      <span className='border-warning/30 bg-warning/10 text-warning inline-flex h-6 w-fit items-center rounded-[9px] border px-2.5 text-[11.5px] font-semibold whitespace-nowrap'>
        Pending
      </span>
    );
  }

  return (
    <span className='border-success/30 bg-success/10 text-success inline-flex h-6 w-fit items-center rounded-[9px] border px-2.5 text-[11.5px] font-semibold whitespace-nowrap'>
      {approved}
    </span>
  );
}

function StackedField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='min-w-0'>
      <dt className='text-muted-foreground/70 text-[10.5px] font-bold tracking-[0.05em] uppercase'>
        {label}
      </dt>
      <dd className='text-foreground/80 mt-0.5 text-[12.5px]'>{children}</dd>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Cells
 * ────────────────────────────────────────────────────────────────────────── */

function applicantTypeLabel(type: CourseTrainerApplicantType): string {
  return type === 'organisation' ? 'Organisation' : 'Instructor';
}

/**
 * The three cells the response decides between.
 *
 * `column` is the fourth column: rates when the response carried a card, the
 * trainer's region and format when it did not — never a rate picked out of a
 * fuller object the viewer was not meant to receive. `meta` is the line under
 * the trainer's name, dropped when the fourth column is already showing the same
 * `location`, so a viewer without rates does not read it twice across one row.
 */
function trainerCells(trainer: CourseTrainerSummary): {
  meta: string | undefined;
  column: string | undefined;
  classes: string;
} {
  const rateFrom = trainer.rate_card ? formatRateCardFrom(trainer.rate_card) : undefined;
  const column = rateFrom ?? trainer.location;

  return {
    meta: column === trainer.location ? undefined : trainer.location,
    column,
    // A trainer still waiting on a decision cannot have classes; say so rather
    // than printing the zero the count would be.
    classes: trainer.approved_at
      ? formatCourseCount(trainer.active_class_count)
      : COURSE_PLACEHOLDER,
  };
}
