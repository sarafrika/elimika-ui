'use client';

import { Check, Minus } from 'lucide-react';
import { useState } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import {
  type CourseAccess,
  type CourseBlockAsyncProps,
  courseCapability,
} from '../types';
import {
  COURSE_PLACEHOLDER,
  type CourseClassFormatTone,
  type CourseClassRow,
  type CourseEligibilityCheck,
  courseSeatFill,
  formatCourseCount,
  formatCourseMoney,
} from './_shared';

/**
 * The learner-facing class picker.
 *
 * The same course and certificate from several approved providers, so the row is
 * a choice rather than a link: one radio, one selection, one price to compare
 * against the others. Which class is the viewer's own is `row.enrolled` — a fact
 * from the response, not something inferred from `access`. The capability map
 * supplies the heading and the sentence under it, which is the only thing that
 * differs between the prospect and the enrolled learner.
 *
 * Below the list, the eligibility checklist: what has to be true before checkout
 * will accept anyone, whichever class they pick.
 */

export interface ClassesTabProps extends CourseBlockAsyncProps {
  /** From the API. Supplies the tab's heading copy through the capability map. */
  access: CourseAccess;
  /** Every class on the course the viewer may see. */
  classes?: readonly CourseClassRow[];
  /** Controlled selection. Leave unset to let the block hold it. */
  selectedClassUuid?: string;
  /** Initial selection when uncontrolled. Defaults to the first row shown. */
  defaultSelectedClassUuid?: string;
  onSelectClass?: (row: CourseClassRow) => void;
  /** The "Before you can be enrolled" checklist. */
  eligibility?: readonly CourseEligibilityCheck[];
  /** Spread `asyncProps()` for the eligibility call; it resolves on its own. */
  eligibilityAsync?: CourseBlockAsyncProps;
  className?: string;
}

type ClassFilter = 'open' | 'all';

/** At or above this, the class is nearly full and the bar warns. */
const ALMOST_FULL_PERCENT = 75;

export function ClassesTab({
  access,
  classes,
  selectedClassUuid,
  defaultSelectedClassUuid,
  onSelectClass,
  eligibility,
  eligibilityAsync,
  loading,
  error,
  onRetry,
  className,
}: ClassesTabProps) {
  const capability = courseCapability(access);
  const rows = classes ?? [];

  const [filter, setFilter] = useState<ClassFilter>('open');
  const [uncontrolled, setUncontrolled] = useState<string | undefined>(defaultSelectedClassUuid);

  const openRows = rows.filter(row => row.openForEnrolment !== false);
  const visible = filter === 'open' ? openRows : rows;

  const requested = selectedClassUuid ?? uncontrolled;
  const current =
    requested && visible.some(row => row.uuid === requested) ? requested : visible[0]?.uuid;

  const select = (row: CourseClassRow) => {
    if (selectedClassUuid === undefined) setUncontrolled(row.uuid);
    onSelectClass?.(row);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='text-[15px] font-bold tracking-tight'>{capability.classesTitle}</h3>
          <p className='text-muted-foreground mt-[3px] text-[12.5px] leading-[1.45]'>
            {capability.classesSub}
          </p>
        </div>

        {rows.length > 0 ? (
          <div className='bg-muted flex flex-none gap-1.5 rounded-full p-1'>
            <FilterPill
              active={filter === 'open'}
              onClick={() => setFilter('open')}
              label={`Open · ${formatCourseCount(openRows.length)}`}
            />
            <FilterPill
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              label={`All · ${formatCourseCount(rows.length)}`}
            />
          </div>
        ) : null}
      </div>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={visible.length === 0}
        skeleton={<ClassPickerSkeleton />}
        errorTitle='Couldn’t load the classes on this course'
        emptyTitle={filter === 'open' ? 'No classes open right now' : 'No classes scheduled yet'}
        emptyDescription='Approved providers schedule their own intakes — check back, or ask to be told when the next one opens.'
      >
        <div className='flex flex-col gap-4'>
          {visible.map(row => (
            <ClassPickerRow
              key={row.uuid}
              row={row}
              selected={row.uuid === current}
              onSelect={() => select(row)}
            />
          ))}
        </div>
      </AsyncSection>

      <EligibilityCard checks={eligibility} {...eligibilityAsync} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * A class row
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * The whole row is the control, exactly as the artboard draws it — including the
 * call to action, which is a mark inside the row rather than a button of its own
 * (a button inside a button is not valid markup, and the row's click already
 * carries the intent).
 */
function ClassPickerRow({
  row,
  selected,
  onSelect,
}: {
  row: CourseClassRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const fill = courseSeatFill(row.seatsTaken, row.seatsTotal);
  const price = formatCourseMoney(row.price, row.currency);
  const where = [row.host, row.place].filter(Boolean).join(' · ');

  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'w-full rounded-xl border px-[18px] py-4 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/10 ring-primary ring-1'
          : 'border-border bg-card hover:bg-muted/40 shadow-sm'
      )}
    >
      <span className='grid grid-cols-[22px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-3.5 lg:grid-cols-[22px_minmax(0,1fr)_150px_132px_118px] lg:items-center'>
        <span
          aria-hidden
          className={cn(
            'mt-0.5 inline-flex size-[18px] flex-none rounded-full border-2 lg:mt-0',
            selected ? 'border-primary bg-primary' : 'border-input'
          )}
        />

        <span className='min-w-0'>
          <span className='block text-[14.5px] font-bold'>{row.title}</span>
          {where ? (
            <span className='text-muted-foreground mt-[3px] block text-[12.5px]'>{where}</span>
          ) : null}
          <span className='mt-[7px] flex flex-wrap items-center gap-[7px]'>
            {row.format ? (
              <span className={cn(CHIP, formatToneClass(row.formatTone))}>{row.format}</span>
            ) : null}
            <span
              className={cn(
                CHIP,
                row.enrolled ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              )}
            >
              {row.enrolled ? 'You are in this one' : 'Open for enrolment'}
            </span>
          </span>
        </span>

        <span className='col-start-2 lg:col-start-auto'>
          <ColumnLabel>Runs</ColumnLabel>
          <span className='mt-[3px] block text-[13px] font-semibold'>
            {row.dates ?? COURSE_PLACEHOLDER}
          </span>
          {row.schedule ? (
            <span className='text-muted-foreground mt-0.5 block text-[11.5px]'>{row.schedule}</span>
          ) : null}
        </span>

        <span className='col-start-2 lg:col-start-auto'>
          <ColumnLabel>Seats</ColumnLabel>
          <span className='mt-[3px] block text-[13px] font-semibold'>
            {row.seatsTaken === undefined || row.seatsTotal === undefined
              ? COURSE_PLACEHOLDER
              : `${formatCourseCount(row.seatsTaken)} of ${formatCourseCount(row.seatsTotal)} taken`}
          </span>
          {fill === undefined ? null : (
            // A span-built bar rather than <Progress>: the whole row is a
            // <button>, which may only contain phrasing content.
            <span
              role='img'
              aria-label={`${Math.round(fill)}% of seats taken on ${row.title}`}
              className='bg-muted mt-[5px] block h-[5px] overflow-hidden rounded-full'
            >
              <span
                className={cn(
                  'block h-full rounded-full',
                  fill >= ALMOST_FULL_PERCENT ? 'bg-warning' : 'bg-success'
                )}
                style={{ width: `${fill}%` }}
              />
            </span>
          )}
        </span>

        <span className='col-start-2 lg:col-start-auto lg:text-right'>
          <span className='block text-[17px] font-bold tracking-[-0.02em]'>
            {price ?? COURSE_PLACEHOLDER}
          </span>
          {row.priceNote ? (
            <span className='text-muted-foreground mt-0.5 block text-[11.5px]'>
              {row.priceNote}
            </span>
          ) : null}
          <span
            className={cn(
              'mt-2 inline-flex h-[30px] items-center justify-center rounded-[10px] border px-[13px] text-[12.5px] font-semibold',
              row.enrolled
                ? 'border-border bg-card text-foreground'
                : 'border-primary bg-primary text-primary-foreground'
            )}
          >
            {row.enrolled ? 'Go to my class' : 'Enroll'}
          </span>
        </span>
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Eligibility
 * ────────────────────────────────────────────────────────────────────────── */

export interface EligibilityCardProps extends CourseBlockAsyncProps {
  checks?: readonly CourseEligibilityCheck[];
  className?: string;
}

export function EligibilityCard({
  checks,
  loading,
  error,
  onRetry,
  className,
}: EligibilityCardProps) {
  const rows = checks ?? [];

  return (
    <Card className={cn('gap-0 px-5 py-4', className)}>
      <h3 className='mb-[11px] text-sm font-bold tracking-tight'>Before you can be enrolled</h3>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={rows.length === 0}
        skeleton={<EligibilitySkeleton />}
        errorTitle='Couldn’t load the enrolment checks'
        emptyTitle='Eligibility rules are set per class'
        emptyDescription='Pick a class above and its checks run at checkout.'
      >
        <div className='grid gap-2.5 gap-x-5 sm:grid-cols-2'>
          {rows.map(check => (
            <div
              key={check.id}
              className={cn(
                'flex items-center gap-[9px] text-[12.5px]',
                check.met ? 'text-foreground/80' : 'text-muted-foreground'
              )}
            >
              {check.met ? (
                <Check className='text-success size-[15px] flex-none' aria-hidden />
              ) : (
                <Minus className='text-muted-foreground/70 size-[15px] flex-none' aria-hidden />
              )}
              {check.label}
            </div>
          ))}
        </div>
      </AsyncSection>

      <p className='border-t-muted text-muted-foreground mt-3 border-t pt-[11px] text-xs leading-[1.5]'>
        Checked against{' '}
        <code className='bg-muted rounded-[5px] px-[5px] py-px text-[11.5px]'>
          {'/enrollment/eligibility/{classDefinitionUuid}/student/{studentUuid}'}
        </code>{' '}
        before checkout, and again on payment.
      </p>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeletons
 * ────────────────────────────────────────────────────────────────────────── */

export function ClassesTabSkeleton() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1 space-y-2'>
          <Skeleton className='h-4 w-48' />
          <Skeleton className='h-3 w-80 max-w-full' />
        </div>
        <Skeleton className='h-9 w-40 flex-none rounded-full' />
      </div>
      <ClassPickerSkeleton />
      <Card className='gap-0 px-5 py-4'>
        <Skeleton className='mb-[11px] h-3.5 w-44' />
        <EligibilitySkeleton />
      </Card>
    </div>
  );
}

function ClassPickerSkeleton() {
  return (
    <div className='flex flex-col gap-4'>
      {[0, 1, 2].map(row => (
        <div key={row} className='border-border bg-card rounded-xl border px-[18px] py-4 shadow-sm'>
          <div className='grid grid-cols-[22px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-3.5 lg:grid-cols-[22px_minmax(0,1fr)_150px_132px_118px] lg:items-center'>
            <Skeleton className='size-[18px] flex-none rounded-full' />
            <div className='min-w-0 space-y-2'>
              <Skeleton className='h-4 w-44 max-w-full' />
              <Skeleton className='h-3 w-56 max-w-full' />
              <Skeleton className='h-[22px] w-40 rounded-[9px]' />
            </div>
            <div className='col-start-2 space-y-1.5 lg:col-start-auto'>
              <Skeleton className='h-2.5 w-10' />
              <Skeleton className='h-3.5 w-32 max-w-full' />
            </div>
            <div className='col-start-2 space-y-1.5 lg:col-start-auto'>
              <Skeleton className='h-2.5 w-10' />
              <Skeleton className='h-3.5 w-24 max-w-full' />
              <Skeleton className='h-[5px] w-full rounded-full' />
            </div>
            <div className='col-start-2 flex flex-col gap-1.5 lg:col-start-auto lg:items-end'>
              <Skeleton className='h-5 w-24' />
              <Skeleton className='h-[30px] w-20 rounded-[10px]' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EligibilitySkeleton() {
  return (
    <div className='grid gap-2.5 gap-x-5 sm:grid-cols-2'>
      {[0, 1, 2, 3].map(row => (
        <div key={row} className='flex items-center gap-[9px]'>
          <Skeleton className='size-[15px] flex-none rounded-full' />
          <Skeleton className='h-3 w-48 max-w-full' />
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Parts
 * ────────────────────────────────────────────────────────────────────────── */

const CHIP =
  'inline-flex h-[22px] items-center rounded-[9px] px-[9px] text-[11px] font-bold whitespace-nowrap';

/**
 * Format is a categorical mark, not a brand surface, so it takes a chart hue —
 * the one exception to tokens-from-the-brand-ramp the design mapping allows.
 */
const FORMAT_TONE: Record<CourseClassFormatTone, string> = {
  online: 'bg-chart-2/15 text-chart-2',
  'in-person': 'bg-chart-4/15 text-chart-4',
  blended: 'bg-chart-1/15 text-chart-1',
};

function formatToneClass(tone: CourseClassFormatTone | undefined): string {
  return tone ? FORMAT_TONE[tone] : 'bg-muted text-muted-foreground';
}

function ColumnLabel({ children }: { children: string }) {
  return (
    <span className='text-muted-foreground/70 block text-[10.5px] font-bold tracking-[0.05em] uppercase'>
      {children}
    </span>
  );
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        // 44px on phones per the responsive rule; the artboard's 27px pill at md.
        'inline-flex h-11 items-center rounded-full px-4 text-[12.5px] whitespace-nowrap md:h-[27px] md:px-3',
        active
          ? 'bg-card text-primary font-bold shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}
