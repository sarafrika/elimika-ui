import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import {
  type Course,
  type CourseAccess,
  type CourseBlockAsyncProps,
  type CourseStats,
  type CourseStatsOwner,
  type CourseTrainerSummary,
  type CourseTrainingRateCard,
  hasTab,
} from '../types';
import {
  COURSE_DEFAULT_CURRENCY,
  COURSE_PLACEHOLDER,
  clampCoursePercent,
  courseInitials,
  formatCourseCount,
  formatCourseDate,
  formatCourseMoney,
} from './_shared';

/**
 * The commercials tab — the one surface where money is written down.
 *
 * Four regions: the confidentiality banner, the three terms cards (list price,
 * fee floor, revenue split), every approved trainer's rate card, and the recent
 * purchases. Each of the last two owns its own `<AsyncSection>`, so a slow
 * trainers call never blanks the orders below it.
 *
 * ## Who sees it
 *
 * The capability map, and only the capability map: `tabs` includes
 * `commercials` for the creator and platform admins and for nobody else, so the
 * gate is {@link hasTab} rather than a comparison against the viewer's domain.
 *
 * ## Why it can vanish
 *
 * Every course-wide figure on this tab lives in `stats.owner`, and the API omits
 * that block entirely for a viewer who may not read it. An omitted block is the
 * answer — so once the stats call has resolved without one the whole tab is
 * dropped rather than drawn around zeroes. Routes can ask the same question
 * before they build the panel with {@link courseCommercialsVisible}.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Orders
 * ────────────────────────────────────────────────────────────────────────── */

/** The four states a purchase line can be in, and the tint each one takes. */
export type CourseOrderStatusTone = 'paid' | 'refunded' | 'pending' | 'failed';

/**
 * One line of the recent-purchases list.
 *
 * An enrolment record alone cannot fill this in — it carries no order
 * reference, no total and no refund state — so the route composes the row and
 * this block renders it. Everything but `uuid` is optional on purpose: a field
 * the response did not carry is left blank, never defaulted to zero.
 */
export interface CourseOrderRow {
  uuid: string;
  /** Human-facing reference, e.g. "ORD-24817". */
  reference?: string;
  /** What was bought — "Solar PV · Cohort 12 Evening". */
  item?: string;
  /** ISO date, or a string already formatted for display. */
  date?: string;
  /** Chip copy: "Paid", "Refunded". */
  status?: string;
  statusTone?: CourseOrderStatusTone;
  total?: number;
  /** ISO currency for {@link CourseOrderRow.total}. */
  currency?: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Tab
 * ────────────────────────────────────────────────────────────────────────── */

export interface CommercialsTabProps {
  /** From the API. The capability map decides whether this tab exists at all. */
  access: CourseAccess;
  /** Carries the list price, the fee floor and the two share percentages. */
  course?: Course;
  /** The `owner` block is what makes this tab renderable. */
  stats?: CourseStats;
  /** Spread `asyncProps(record.stats)`. */
  statsAsync?: CourseBlockAsyncProps;
  /** Approved trainers; only those the response gave a rate card are listed. */
  trainers?: readonly CourseTrainerSummary[];
  /** Spread `asyncProps(record.trainers)`. */
  trainersAsync?: CourseBlockAsyncProps;
  /** Recent purchases, newest first. */
  orders?: readonly CourseOrderRow[];
  /** Spread `asyncProps(record.enrollments)` — or whatever fed the rows. */
  ordersAsync?: CourseBlockAsyncProps;
  /** Platform currency for the terms cards and the sales summary. */
  currency?: string;
  className?: string;
}

/** True when this viewer has the tab *and* the response carried its figures. */
export function courseCommercialsVisible(
  access: CourseAccess,
  stats: CourseStats | undefined
): boolean {
  return hasTab(access, 'commercials') && Boolean(stats?.owner);
}

export function CommercialsTab({
  access,
  course,
  stats,
  statsAsync,
  trainers,
  trainersAsync,
  orders,
  ordersAsync,
  currency = COURSE_DEFAULT_CURRENCY,
  className,
}: CommercialsTabProps) {
  if (!hasTab(access, 'commercials')) return null;

  const owner = stats?.owner;
  // Resolved, and no owner block came back: this viewer's response does not
  // contain the tab's subject. Show nothing rather than a page of blanks.
  if (!owner && !statsAsync?.loading && !statsAsync?.error) return null;

  return (
    <div className={cn('flex flex-col gap-[18px]', className)}>
      <ConfidentialityBanner />

      <CommercialTerms course={course} currency={currency} />

      <ApprovedRateCards
        trainers={trainers}
        currency={currency}
        {...trainersAsync}
      />

      <RecentPurchases
        orders={orders}
        owner={owner}
        currency={currency}
        {...ordersAsync}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Confidentiality
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * The disclosure warning. Destructive-tinted because that is what it is — a
 * warning — and the semantic hues are fixed across every dashboard domain while
 * the brand ramp moves.
 */
function ConfidentialityBanner() {
  return (
    <div className='border-destructive/25 bg-destructive/5 flex flex-wrap items-center gap-3 rounded-[14px] border px-4 py-[13px]'>
      <span className='bg-destructive/10 text-destructive inline-flex h-[26px] flex-none items-center gap-1.5 rounded-[10px] px-2.5 text-[11.5px] font-bold'>
        <Lock className='size-3' aria-hidden />
        Confidential
      </span>
      <p className='text-foreground/80 min-w-0 flex-1 text-[12.5px] leading-[1.5]'>
        Prices, the fee floor, the revenue split, every trainer’s rate card and all sales sit here
        and nowhere else. Trainers see only their own terms; learners see only the price of the
        class they are buying.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Terms
 * ────────────────────────────────────────────────────────────────────────── */

export interface CommercialTermsProps {
  course?: Course;
  currency?: string;
  className?: string;
}

/** List price, fee floor and the split — the three numbers a rate card obeys. */
export function CommercialTerms({
  course,
  currency = COURSE_DEFAULT_CURRENCY,
  className,
}: CommercialTermsProps) {
  const creatorShare = optional(course?.creator_share_percentage);
  const instructorShare = optional(course?.instructor_share_percentage);

  return (
    <div className={cn('grid gap-3.5 sm:grid-cols-3', className)}>
      <TermCard
        label='List price'
        value={formatCourseMoney(optional(course?.price), currency) ?? COURSE_PLACEHOLDER}
        note='per learner, full course'
      />
      <TermCard
        label='Minimum training fee'
        value={
          formatCourseMoney(optional(course?.minimum_training_fee), currency) ?? COURSE_PLACEHOLDER
        }
        note='per hour, per head — floor for rate cards'
      />

      <Card className='gap-0 px-[18px] py-4'>
        <TermLabel>Revenue split</TermLabel>
        <RevenueSplitBar creator={creatorShare} instructor={instructorShare} />
      </Card>
    </div>
  );
}

function TermCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className='gap-0 px-[18px] py-4'>
      <TermLabel>{label}</TermLabel>
      <div className='mt-1.5 text-[22px] font-bold tracking-[-0.02em]'>{value}</div>
      <div className='text-muted-foreground mt-1 text-xs'>{note}</div>
    </Card>
  );
}

function TermLabel({ children }: { children: ReactNode }) {
  return <div className='text-muted-foreground text-[12.5px] font-semibold'>{children}</div>;
}

/**
 * The split as one two-segment bar: the creator's share in the brand hue, the
 * trainer's in the fixed success green, on a sunk track. Both percentages have
 * to be present for the bar to mean anything — without them the card says so
 * rather than drawing a bar at some invented ratio.
 */
function RevenueSplitBar({
  creator,
  instructor,
}: {
  creator: number | undefined;
  instructor: number | undefined;
}) {
  if (creator === undefined || instructor === undefined) {
    return <div className='mt-1.5 text-[22px] font-bold tracking-[-0.02em]'>{COURSE_PLACEHOLDER}</div>;
  }

  const creatorWidth = clampCoursePercent(creator);
  const instructorWidth = clampCoursePercent(instructor);

  return (
    <>
      <div className='bg-muted mt-2 flex h-2.5 overflow-hidden rounded-full'>
        <span className='bg-primary h-full' style={{ width: `${creatorWidth}%` }} />
        <span className='bg-success h-full' style={{ width: `${instructorWidth}%` }} />
      </div>
      <div className='text-muted-foreground mt-[7px] flex justify-between text-[11.5px]'>
        <span>Creator {formatShare(creator)}</span>
        <span>Instructor {formatShare(instructor)}</span>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Rate cards
 * ────────────────────────────────────────────────────────────────────────── */

export interface ApprovedRateCardsProps extends CourseBlockAsyncProps {
  trainers?: readonly CourseTrainerSummary[];
  currency?: string;
  className?: string;
}

/** The four hourly rates, in the order the table lists them. */
const RATE_COLUMNS = [
  { field: 'private_online_hourly_rate', heading: 'Private · online' },
  { field: 'private_inperson_hourly_rate', heading: 'Private · in-person' },
  { field: 'group_online_hourly_rate', heading: 'Group · online' },
  { field: 'group_inperson_hourly_rate', heading: 'Group · in-person' },
] as const satisfies ReadonlyArray<{ field: keyof CourseTrainingRateCard; heading: string }>;

/** Shared by the header row and every body row so the columns cannot drift. */
const RATE_GRID = 'grid grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] items-center gap-3';

/** Below `md` the grid gives way to stacked cards, so it never has to scroll. */
const RATE_TABLE_MIN_WIDTH = 'min-w-[620px]';

export function ApprovedRateCards({
  trainers,
  currency = COURSE_DEFAULT_CURRENCY,
  loading,
  error,
  onRetry,
  className,
}: ApprovedRateCardsProps) {
  // Only trainers the response actually sent a card for. A pending applicant
  // has no approved card, and there is no fuller object to pick one out of.
  const rows = (trainers ?? []).filter(
    (trainer): trainer is CourseTrainerSummary & { rate_card: CourseTrainingRateCard } =>
      Boolean(trainer.rate_card)
  );

  return (
    <Card className={cn('gap-0 overflow-hidden py-0', className)}>
      <div className='px-5 pt-4 pb-3.5'>
        <h3 className='text-[15px] font-bold tracking-tight'>Approved rate cards</h3>
        <p className='text-muted-foreground mt-[3px] text-[12.5px] leading-[1.45]'>
          Hourly rates each approved trainer may charge, by session format.
        </p>
      </div>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={rows.length === 0}
        skeleton={<RateTableSkeleton />}
        errorTitle='Couldn’t load the approved rate cards'
        emptyTitle='No rate cards yet'
        emptyDescription='A rate card appears here once the creator approves a training application that carries one.'
        className='mx-5 mb-5'
      >
        {/* ≥768: the table. */}
        <div className='hidden overflow-x-auto md:block'>
          <div className={RATE_TABLE_MIN_WIDTH} role='table' aria-label='Approved rate cards'>
            <div
              className={cn(
                RATE_GRID,
                'bg-muted border-border text-muted-foreground border-y px-5 py-[9px] text-[11px] font-bold tracking-[0.05em] uppercase'
              )}
              role='row'
            >
              <span role='columnheader'>Trainer</span>
              {RATE_COLUMNS.map(column => (
                <span key={column.field} role='columnheader' className='text-right'>
                  {column.heading}
                </span>
              ))}
            </div>

            {rows.map(trainer => (
              <div
                key={trainer.applicant_uuid}
                role='row'
                className={cn(RATE_GRID, 'border-b-muted border-b px-5 py-[11px] text-[13px]')}
              >
                <span role='cell' className='truncate font-semibold'>
                  {trainer.display_name}
                </span>
                {RATE_COLUMNS.map(column => (
                  <RateCell
                    key={column.field}
                    rate={trainer.rate_card[column.field]}
                    currency={trainer.rate_card.currency ?? currency}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* <768: one card per trainer. */}
        <div className='md:hidden'>
          {rows.map(trainer => (
            <div key={trainer.applicant_uuid} className='border-b-muted border-b px-4 py-3.5'>
              <div className='flex items-center gap-2.5'>
                <span
                  aria-hidden
                  className='bg-muted text-foreground/80 inline-flex size-8 flex-none items-center justify-center rounded-[10px] text-[11px] font-bold'
                >
                  {courseInitials(trainer.display_name)}
                </span>
                <span className='min-w-0 truncate text-[13.5px] font-semibold'>
                  {trainer.display_name}
                </span>
              </div>

              <dl className='mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5'>
                {RATE_COLUMNS.map(column => (
                  <div key={column.field} className='min-w-0'>
                    <dt className='text-muted-foreground/70 text-[10.5px] font-bold tracking-[0.05em] uppercase'>
                      {column.heading}
                    </dt>
                    <dd className='mt-0.5 text-[13px] font-semibold'>
                      {formatRateValue(trainer.rate_card[column.field])}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </AsyncSection>
    </Card>
  );
}

/**
 * One hourly rate. The figure is bare, as designed — the terms cards directly
 * above already establish the currency — and the full money string rides along
 * in the tooltip for a card priced in something else.
 */
function RateCell({ rate, currency }: { rate: number | null | undefined; currency: string }) {
  const money = formatCourseMoney(optional(rate), currency);

  return (
    <span role='cell' className='text-foreground/80 text-right' title={money}>
      {formatRateValue(rate)}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Purchases
 * ────────────────────────────────────────────────────────────────────────── */

export interface RecentPurchasesProps extends CourseBlockAsyncProps {
  orders?: readonly CourseOrderRow[];
  /** Supplies the summary line; the tab does not render without it. */
  owner?: CourseStatsOwner;
  currency?: string;
  className?: string;
}

const ORDER_GRID =
  'grid grid-cols-[112px_minmax(0,1fr)_128px_108px_96px] items-center gap-3 text-[13px]';

const ORDER_TABLE_MIN_WIDTH = 'min-w-[600px]';

const ORDER_STATUS_TONE: Record<CourseOrderStatusTone, string> = {
  paid: 'bg-success/10 text-success',
  refunded: 'bg-muted text-muted-foreground',
  pending: 'bg-warning/10 text-warning',
  failed: 'bg-destructive/10 text-destructive',
};

export function RecentPurchases({
  orders,
  owner,
  currency = COURSE_DEFAULT_CURRENCY,
  loading,
  error,
  onRetry,
  className,
}: RecentPurchasesProps) {
  const rows = orders ?? [];
  const summary = [
    owner?.paid_orders === undefined
      ? undefined
      : `${formatCourseCount(owner.paid_orders)} paid orders`,
    owner?.gross_sales === undefined
      ? undefined
      : `${formatCourseMoney(owner.gross_sales, currency)} gross`,
    owner?.platform_fee === undefined
      ? undefined
      : `${formatCourseMoney(owner.platform_fee, currency)} platform fee`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className={cn('gap-0 px-5 py-4', className)}>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5'>
        <h3 className='text-[15px] font-bold tracking-tight'>Recent purchases</h3>
        {summary ? <span className='text-muted-foreground text-xs'>{summary}</span> : null}
      </div>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={rows.length === 0}
        skeleton={<PurchasesSkeleton />}
        errorTitle='Couldn’t load recent purchases'
        emptyTitle='No purchases yet'
        emptyDescription='Orders appear here as learners pay for a place on a class running this course.'
      >
        {/* ≥768: the table. */}
        <div className='hidden overflow-x-auto md:block'>
          <div className={ORDER_TABLE_MIN_WIDTH} role='table' aria-label='Recent purchases'>
            {rows.map(row => (
              <div key={row.uuid} role='row' className={cn(ORDER_GRID, 'border-t-muted border-t py-2.5')}>
                <span role='cell' className='text-muted-foreground truncate font-mono text-xs'>
                  {row.reference ?? COURSE_PLACEHOLDER}
                </span>
                <span role='cell' className='truncate'>
                  {row.item ?? COURSE_PLACEHOLDER}
                </span>
                <span role='cell' className='text-muted-foreground text-[12.5px]'>
                  {formatOrderDate(row.date)}
                </span>
                <span role='cell'>
                  <OrderStatusChip status={row.status} tone={row.statusTone} />
                </span>
                <span role='cell' className='text-right font-bold'>
                  {formatCourseMoney(row.total, row.currency ?? currency) ?? COURSE_PLACEHOLDER}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* <768: one card per order. */}
        <div className='md:hidden'>
          {rows.map(row => (
            <div key={row.uuid} className='border-t-muted border-t py-3'>
              <div className='flex items-baseline justify-between gap-3'>
                <span className='min-w-0 truncate text-[13px]'>{row.item ?? COURSE_PLACEHOLDER}</span>
                <span className='flex-none text-[13px] font-bold'>
                  {formatCourseMoney(row.total, row.currency ?? currency) ?? COURSE_PLACEHOLDER}
                </span>
              </div>
              <div className='mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5'>
                <span className='text-muted-foreground font-mono text-xs'>
                  {row.reference ?? COURSE_PLACEHOLDER}
                </span>
                <span className='text-muted-foreground text-[12.5px]'>
                  {formatOrderDate(row.date)}
                </span>
                <OrderStatusChip status={row.status} tone={row.statusTone} />
              </div>
            </div>
          ))}
        </div>
      </AsyncSection>
    </Card>
  );
}

function OrderStatusChip({
  status,
  tone,
}: {
  status: string | undefined;
  tone: CourseOrderStatusTone | undefined;
}) {
  if (!status) return <span className='text-muted-foreground text-[11.5px]'>{COURSE_PLACEHOLDER}</span>;

  return (
    <span
      className={cn(
        'inline-flex h-[22px] w-fit items-center rounded-[9px] px-2.5 text-[11.5px] font-bold whitespace-nowrap',
        ORDER_STATUS_TONE[tone ?? 'pending']
      )}
    >
      {status}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeletons
 * ────────────────────────────────────────────────────────────────────────── */

export function CommercialsTabSkeleton() {
  return (
    <div className='flex flex-col gap-[18px]'>
      <div className='border-destructive/25 bg-destructive/5 flex items-center gap-3 rounded-[14px] border px-4 py-[13px]'>
        <Skeleton className='h-[26px] w-28 flex-none rounded-[10px]' />
        <Skeleton className='h-3 w-full max-w-md' />
      </div>

      <div className='grid gap-3.5 sm:grid-cols-3'>
        {[0, 1, 2].map(cell => (
          <Card key={cell} className='gap-0 px-[18px] py-4'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='mt-2.5 h-6 w-32 max-w-full' />
            <Skeleton className='mt-2 h-2.5 w-36 max-w-full' />
          </Card>
        ))}
      </div>

      <Card className='gap-0 overflow-hidden py-0'>
        <div className='px-5 pt-4 pb-3.5'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='mt-2 h-3 w-72 max-w-full' />
        </div>
        <RateTableSkeleton />
      </Card>

      <Card className='gap-0 px-5 py-4'>
        <Skeleton className='mb-3 h-4 w-36' />
        <PurchasesSkeleton />
      </Card>
    </div>
  );
}

function RateTableSkeleton() {
  return (
    <div>
      <div className='bg-muted border-border h-[33px] border-y' />
      {[0, 1, 2, 3].map(row => (
        <div key={row} className='border-b-muted flex items-center gap-3 border-b px-5 py-[11px]'>
          <Skeleton className='h-3 w-44 max-w-full flex-1' />
          {[0, 1, 2, 3].map(cell => (
            <Skeleton key={cell} className='hidden h-3 w-12 flex-none md:block' />
          ))}
        </div>
      ))}
    </div>
  );
}

function PurchasesSkeleton() {
  return (
    <div>
      {[0, 1, 2].map(row => (
        <div key={row} className='border-t-muted flex items-center gap-3 border-t py-2.5'>
          <Skeleton className='h-3 w-20 flex-none' />
          <Skeleton className='h-3 w-40 max-w-full flex-1' />
          <Skeleton className='hidden h-3 w-20 flex-none md:block' />
          <Skeleton className='h-[22px] w-16 flex-none rounded-[9px]' />
          <Skeleton className='h-3 w-16 flex-none' />
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Formatting
 * ────────────────────────────────────────────────────────────────────────── */

/** The generated client models "absent" as `null`; the helpers speak `undefined`. */
function optional(value: number | null | undefined): number | undefined {
  return value ?? undefined;
}

/** "40" → "40%". Whole numbers stay whole; a half share keeps its decimal. */
function formatShare(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function formatRateValue(rate: number | null | undefined): string {
  if (typeof rate !== 'number' || !Number.isFinite(rate)) return COURSE_PLACEHOLDER;
  return new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(rate);
}

/** Routes may hand over an ISO date or one already formatted; both render. */
function formatOrderDate(value: string | undefined): string {
  if (!value) return COURSE_PLACEHOLDER;
  return formatCourseDate(value) ?? value;
}
