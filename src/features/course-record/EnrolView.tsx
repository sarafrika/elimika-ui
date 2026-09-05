'use client';

import { Check, CircleAlert, CreditCard, Lock, Shield, Video } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ClassEnrolmentEligibility } from '@/services/client/types.gen';

import {
  COURSE_PLACEHOLDER,
  type CourseClassFormatTone,
  type CourseClassRow,
  courseSeatFill,
  formatCourseCount,
  formatCourseDate,
  formatCourseMoney,
} from './blocks/_shared';
import { type CourseBlockAsyncProps, fillCourseCopy } from './types';

/**
 * Learner checkout — pick a class, prove eligibility, pay.
 *
 * Three numbered steps down the page and the order beside them, because that is
 * the order the platform actually works in: an order is created, then paid, then
 * the enrolment exists. Nothing on this page opens a lesson.
 *
 * ## What decides what
 *
 * The eligibility card is the whole point of the middle step, and every word of
 * it comes from `ClassEnrolmentEligibility` — the API's answer for *this* learner
 * against *this* class. {@link courseEnrolChecks} turns that record into the four
 * tiles and {@link courseEnrolStatus} into the chip beside them; neither invents
 * a pass. A field the response did not carry leaves its tile unresolved rather
 * than green, and the pay button is offered only when the API said yes.
 *
 * Seats are the one figure with two right answers: available, and available but
 * tight. The tight state is read off the selected class's own seat fill, so the
 * warning follows the class the learner is looking at rather than the course.
 *
 * ## Props in, markup out
 *
 * Like every block in this feature the view fetches nothing. The route composes
 * the class rows, hands over the eligibility record it already has, and spreads
 * `asyncProps()` for each call so a slow eligibility check degrades one card.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Copy
 * ────────────────────────────────────────────────────────────────────────── */

const PAGE_TITLE = 'Choose a class and enroll';
const PAGE_BLURB =
  'One course, several providers. Pick the class whose format, place and dates suit you — the syllabus and the certificate are identical, only the delivery and the price change.';
/** First crumb of the eyebrow line, before the course and its creator. */
const BREADCRUMB_ROOT = 'Catalogue';
const WATCH_INTRO = 'Watch intro · {introDuration}';
const RATING_CHIP = '{rating} ★ · {learners} enrolled';

const STEP_PICK_TITLE = 'Pick your class';
const STEP_PICK_SUB = '{openClasses} of {totalClasses} classes are still taking learners.';

const STEP_ELIGIBILITY_TITLE = 'Eligibility for {className}';
/** Used before a class is picked, so the heading is never a dangling "for". */
const STEP_ELIGIBILITY_TITLE_PLAIN = 'Eligibility';
const STEP_ELIGIBILITY_SUB = 'Checked live against the class before you can pay.';

const STEP_PAY_TITLE = 'Pay';
const PAY_NOTE =
  'Your enrolment is created only after the order is confirmed paid — lessons open at that moment, not before.';

const ORDER_TITLE = 'Your order';
const ORDER_TOTAL_LABEL = 'Total today';
const ORDER_CTA = 'Pay {amount} with {method}';
/** When no price is on the class, the button still has to say what it does. */
const ORDER_CTA_PLAIN = 'Pay with {method}';
const ORDER_FOOTNOTE = 'Order created, then paid, then enrolled — in that order.';

const UNLOCKS_TITLE = 'What opens when you pay';

const OWNERSHIP_TITLE = 'Whose work this is';
const OWNERSHIP_LEAD = 'The course was written by ';
const OWNERSHIP_TAIL =
  ' and is taught under licence by the provider you pick. Enrolling licenses it to you personally for the length of the course: read it, keep your notes, earn the certificate — but the material itself is not yours to download or pass on.';
/** Stands in for the creator's name when the response did not carry one. */
const OWNERSHIP_CREATOR_FALLBACK = 'the course creator';

/* ────────────────────────────────────────────────────────────────────────────
 * Eligibility
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * How a check reads:
 *
 * - `ok`      — satisfied; the tile is tinted with the fixed success step.
 * - `warn`    — something the learner has to see before paying.
 * - `neutral` — true, but a statement of policy rather than an achievement.
 */
export type CourseEnrolCheckTone = 'ok' | 'warn' | 'neutral';

/** One tile of the eligibility grid. */
export interface CourseEnrolCheck {
  id: string;
  label: string;
  note: string;
  tone: CourseEnrolCheckTone;
}

/** The chip beside the eligibility heading. */
export interface CourseEnrolStatus {
  tone: 'ok' | 'warn' | 'blocked';
  label: string;
  /** The API's own sentence for why the learner cannot join. */
  reason?: string;
}

export interface CourseEnrolCheckOptions {
  /** Seats still free on the selected class, for the seats tile's headline. */
  seatsLeft?: number;
  /** True when the class is nearly full — the seats tile warns rather than passes. */
  seatsTight?: boolean;
  /** ISO date the learner's date of birth was recorded, for the second tile's note. */
  dateOfBirthRecordedOn?: string;
}

const CHECK_NOTES = {
  age: 'Read from your date of birth; the class is refused without one on file.',
  dobMissing: 'Add it to your profile before an age-limited class will take you.',
  seatsTight: 'Seats are held for 20 minutes once the order is created, then released.',
  seatsOk: 'Held for 20 minutes once the order is created.',
  seatsNone: 'This class is full. Pick another class above, or ask to be told when one opens.',
  enrolled: 'A second enrolment on the same course is blocked at checkout.',
} as const;

/**
 * The four tiles, composed from the API's eligibility record.
 *
 * Exported so a route can show the same list somewhere else without re-deriving
 * it. It returns an empty list for an absent record — which is the AsyncSection's
 * empty state, not four hopeful ticks.
 */
export function courseEnrolChecks(
  eligibility: ClassEnrolmentEligibility | undefined,
  options: CourseEnrolCheckOptions = {}
): CourseEnrolCheck[] {
  if (!eligibility) return [];

  const { seatsLeft, seatsTight, dateOfBirthRecordedOn } = options;
  const recordedOn = formatCourseDate(dateOfBirthRecordedOn);
  const hasDob = eligibility.date_of_birth_on_file !== false;

  return [
    {
      id: 'age',
      label: courseEnrolAgeLabel(eligibility),
      note: CHECK_NOTES.age,
      tone: eligibility.age_requirement_met === false ? 'warn' : 'ok',
    },
    {
      id: 'date-of-birth',
      label: hasDob ? 'Date of birth on file' : 'Date of birth missing',
      note: hasDob
        ? recordedOn
          ? `Added to your profile ${recordedOn}.`
          : 'Read from your profile whenever a class sets an age limit.'
        : CHECK_NOTES.dobMissing,
      tone: hasDob ? 'ok' : 'warn',
    },
    eligibility.seats_available === false
      ? { id: 'seats', label: 'No seats left', note: CHECK_NOTES.seatsNone, tone: 'warn' }
      : seatsTight
        ? {
            id: 'seats',
            label:
              seatsLeft === undefined
                ? 'Nearly full'
                : `${formatCourseCount(seatsLeft)} ${seatsLeft === 1 ? 'seat' : 'seats'} left`,
            note: CHECK_NOTES.seatsTight,
            tone: 'warn',
          }
        : { id: 'seats', label: 'Seats available', note: CHECK_NOTES.seatsOk, tone: 'ok' },
    eligibility.already_enrolled === true
      ? {
          id: 'enrolment',
          label: 'Already enrolled on this course',
          note: CHECK_NOTES.enrolled,
          tone: 'warn',
        }
      : {
          id: 'enrolment',
          label: 'Not already enrolled on this course',
          note: CHECK_NOTES.enrolled,
          tone: 'neutral',
        },
  ];
}

/** "Age 22 — inside the 18–45 range", as far as the record allows. */
export function courseEnrolAgeLabel(eligibility: ClassEnrolmentEligibility): string {
  const age = eligibility.student_age;
  if (age === undefined || age === null) return 'Age not known yet';

  const min = eligibility.minimum_age;
  const max = eligibility.maximum_age;
  const met = eligibility.age_requirement_met !== false;

  if (min !== undefined && min !== null && max !== undefined && max !== null) {
    return `Age ${age} — ${met ? 'inside' : 'outside'} the ${min}–${max} range`;
  }
  if (min !== undefined && min !== null) {
    return `Age ${age} — ${met ? 'at or above' : 'below'} the minimum of ${min}`;
  }
  if (max !== undefined && max !== null) {
    return `Age ${age} — ${met ? 'at or below' : 'above'} the maximum of ${max}`;
  }
  return met ? `Age ${age} — no age limit on this class` : `Age ${age} — outside the age limit`;
}

/**
 * The chip: eligible, eligible but tight on seats, or refused with the API's own
 * reason. Anything the record leaves unanswered counts against joining, so the
 * page never promises a seat the checkout will refuse.
 */
export function courseEnrolStatus(
  eligibility: ClassEnrolmentEligibility | undefined,
  seatsTight?: boolean
): CourseEnrolStatus | undefined {
  if (!eligibility) return undefined;

  const blocked =
    eligibility.eligible === false ||
    eligibility.already_enrolled === true ||
    eligibility.seats_available === false ||
    eligibility.age_requirement_met === false ||
    eligibility.date_of_birth_on_file === false;

  if (blocked) {
    return { tone: 'blocked', label: 'Not eligible', reason: eligibility.reason ?? undefined };
  }
  return seatsTight
    ? { tone: 'warn', label: 'Eligible — seats tight' }
    : { tone: 'ok', label: 'Eligible' };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Order
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * How an order line reads:
 *
 * - `included` — part of the price.
 * - `excluded` — the learner has to bring it; the value is warning-tinted.
 */
export type CourseOrderLineTone = 'included' | 'excluded';

/** One line between the class and the total. */
export interface CourseOrderLine {
  k: string;
  v: string;
  tone?: CourseOrderLineTone;
}

/** A line of "What opens when you pay". */
export interface CourseEnrolUnlock {
  text: string;
  /** Tokens the line needs. A line missing one is dropped. */
  requires?: readonly string[];
  /** `check` for what the money buys, `lock` for what it does not. */
  icon: 'check' | 'lock';
}

/**
 * Values the unlock lines interpolate.
 *
 * | token | source |
 * |---|---|
 * | `lessons` / `contentItems` | the curriculum's shape |
 * | `assessments` | count of `CourseAssessment` rows |
 * | `className` | the class being bought |
 */
export type CourseEnrolVars = Record<string, string | number | null | undefined>;

/** Transcribed from the artboard's `unlocks` list. */
export const COURSE_ENROL_UNLOCKS: readonly CourseEnrolUnlock[] = [
  {
    text: 'All {lessons} lessons and {contentItems} items, at your own pace',
    requires: ['lessons', 'contentItems'],
    icon: 'check',
  },
  { text: 'Your place in {className}', requires: ['className'], icon: 'check' },
  {
    text: 'Progress tracking and {assessments} assessments',
    requires: ['assessments'],
    icon: 'check',
  },
  { text: 'Pages watermarked with your name', icon: 'lock' },
  { text: 'Reading only — no download or re-sharing', icon: 'lock' },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Payment
 * ────────────────────────────────────────────────────────────────────────── */

export type CoursePaymentMethod = 'mpesa' | 'card';

const PAYMENT_LABELS: Record<CoursePaymentMethod, string> = {
  mpesa: 'M-Pesa',
  card: 'Card',
};

const CARD_NOTE = 'Visa, Mastercard';

/* ────────────────────────────────────────────────────────────────────────────
 * View
 * ────────────────────────────────────────────────────────────────────────── */

/** A class as the picker needs it: the shared row, plus its public rating. */
export interface CourseEnrolClassRow extends CourseClassRow {
  /** Pre-formatted, e.g. "4.7 ★ · 312 learners". */
  rating?: string;
}

export interface EnrolViewProps extends CourseBlockAsyncProps {
  /* — header — */
  courseTitle?: string;
  /** The creator, named in the eyebrow and in "Whose work this is". */
  creatorName?: string;
  /** Replaces "Catalogue" as the first crumb. */
  breadcrumbRoot?: string;
  /** Pre-formatted, e.g. "2:40". Without it the intro chip is not offered. */
  introDuration?: string;
  onWatchIntro?: () => void;
  /** 1–5, shown in the header chip beside the enrolled count. */
  averageRating?: number;
  learnersEnrolled?: number;

  /* — step 1 — */
  /** Every class the learner may join. `loading`/`error` cover this call. */
  classes?: readonly CourseEnrolClassRow[];
  /** Classes on the course in total, when more exist than are listed here. */
  totalClassCount?: number;
  /** Controlled selection. Leave unset to let the view hold it. */
  selectedClassUuid?: string;
  /** Initial selection when uncontrolled. Defaults to the first class shown. */
  defaultSelectedClassUuid?: string;
  onSelectClass?: (row: CourseEnrolClassRow) => void;

  /* — step 2 — */
  /** The API's answer for this learner against the selected class. */
  eligibility?: ClassEnrolmentEligibility;
  /** Spread `asyncProps()` for the eligibility call; it resolves on its own. */
  eligibilityAsync?: CourseBlockAsyncProps;
  /** ISO date the learner's date of birth was recorded. */
  dateOfBirthRecordedOn?: string;

  /* — step 3 — */
  /** Controlled payment method. Leave unset to let the view hold it. */
  paymentMethod?: CoursePaymentMethod;
  defaultPaymentMethod?: CoursePaymentMethod;
  onSelectPaymentMethod?: (method: CoursePaymentMethod) => void;
  /** Masked phone the STK push goes to, e.g. "07•• ••• 418". */
  mpesaPhoneMask?: string;

  /* — order — */
  /** The lines between the class and the total. */
  lines?: readonly CourseOrderLine[];
  /** Charged today. Falls back to the selected class's price. */
  total?: number;
  /** ISO currency for the total. Falls back to the selected class's currency. */
  currency?: string;
  /** Values the unlock lines interpolate. See {@link CourseEnrolVars}. */
  vars?: CourseEnrolVars;
  /** Overrides the transcribed unlock list. */
  unlocks?: readonly CourseEnrolUnlock[];
  onPay?: () => void;

  className?: string;
}

/** At or above this seat fill the class reads as tight, and the seats tile warns. */
const SEATS_TIGHT_PERCENT = 75;

export function EnrolView({
  courseTitle,
  creatorName,
  breadcrumbRoot = BREADCRUMB_ROOT,
  introDuration,
  onWatchIntro,
  averageRating,
  learnersEnrolled,
  classes,
  totalClassCount,
  selectedClassUuid,
  defaultSelectedClassUuid,
  onSelectClass,
  eligibility,
  eligibilityAsync,
  dateOfBirthRecordedOn,
  paymentMethod,
  defaultPaymentMethod = 'mpesa',
  onSelectPaymentMethod,
  mpesaPhoneMask,
  lines,
  total,
  currency,
  vars,
  unlocks,
  onPay,
  loading,
  error,
  onRetry,
  className,
}: EnrolViewProps) {
  const rows = classes ?? [];

  const [selectedDraft, setSelectedDraft] = useState<string | undefined>(defaultSelectedClassUuid);
  const requested = selectedClassUuid ?? selectedDraft;
  const selected = rows.find(row => row.uuid === requested) ?? rows[0];

  const [methodDraft, setMethodDraft] = useState<CoursePaymentMethod>(defaultPaymentMethod);
  const method = paymentMethod ?? methodDraft;

  const pickClass = (row: CourseEnrolClassRow) => {
    if (selectedClassUuid === undefined) setSelectedDraft(row.uuid);
    onSelectClass?.(row);
  };

  const pickMethod = (next: CoursePaymentMethod) => {
    if (paymentMethod === undefined) setMethodDraft(next);
    onSelectPaymentMethod?.(next);
  };

  /* — derived — */

  const openCount = rows.filter(row => row.openForEnrolment !== false).length;
  const fill = courseSeatFill(selected?.seatsTaken, selected?.seatsTotal);
  const seatsTight = fill !== undefined && fill >= SEATS_TIGHT_PERCENT;
  const seatsLeft =
    selected?.seatsTotal === undefined || selected.seatsTaken === undefined
      ? undefined
      : Math.max(0, selected.seatsTotal - selected.seatsTaken);

  const checks = courseEnrolChecks(eligibility, {
    seatsLeft,
    seatsTight,
    dateOfBirthRecordedOn,
  });
  const status = courseEnrolStatus(eligibility, seatsTight);

  const orderCurrency = currency ?? selected?.currency;
  const amount = formatCourseMoney(total ?? selected?.price, orderCurrency);
  const methodLabel = PAYMENT_LABELS[method];
  const payLabel =
    amount === undefined
      ? fillCourseCopy(ORDER_CTA_PLAIN, { method: methodLabel })
      : fillCourseCopy(ORDER_CTA, { amount, method: methodLabel });

  const unlockLines = (unlocks ?? COURSE_ENROL_UNLOCKS)
    .filter(line => hasAll(line.requires, vars))
    .map(line => ({ text: fillCourseCopy(line.text, vars ?? {}), icon: line.icon }));

  const eyebrow = [breadcrumbRoot, courseTitle, creatorName ? `by ${creatorName}` : undefined]
    .filter(Boolean)
    .join(' · ');

  const ratingLabel =
    averageRating === undefined || learnersEnrolled === undefined
      ? undefined
      : fillCourseCopy(RATING_CHIP, {
          rating: averageRating.toFixed(1),
          learners: formatCourseCount(learnersEnrolled),
        });

  return (
    <div className={cn('min-w-0', className)}>
      {/* ── header ───────────────────────────────────────────────────── */}
      <div className='mb-5 flex flex-wrap items-end justify-between gap-x-5 gap-y-3'>
        <div className='min-w-0'>
          <p className='text-muted-foreground mb-[5px] text-xs'>{eyebrow}</p>
          <h1 className='text-2xl font-bold tracking-tight'>{PAGE_TITLE}</h1>
          <p className='text-muted-foreground mt-1.5 max-w-[760px] text-[13.5px] leading-[1.6]'>
            {PAGE_BLURB}
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {introDuration ? (
            <HeaderChip
              icon={<Video className='size-3.5' aria-hidden />}
              onClick={onWatchIntro}
              label={fillCourseCopy(WATCH_INTRO, { introDuration })}
            />
          ) : null}
          {ratingLabel ? (
            <span className='bg-primary/10 text-primary inline-flex h-[30px] items-center gap-1.5 rounded-[10px] px-[11px] text-[12.5px] font-bold'>
              {ratingLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]'>
        {/* ── steps ──────────────────────────────────────────────────── */}
        <div className='flex min-w-0 flex-col gap-4'>
          {/* 1 · pick a class */}
          <Card className='gap-0 px-5 py-[18px]'>
            <StepHeader step={1} title={STEP_PICK_TITLE}>
              {fillCourseCopy(STEP_PICK_SUB, {
                openClasses: formatCourseCount(openCount),
                totalClasses: formatCourseCount(totalClassCount ?? rows.length),
              })}
            </StepHeader>

            <AsyncSection
              loading={loading}
              error={error}
              onRetry={onRetry}
              empty={rows.length === 0}
              skeleton={<ClassPickerSkeleton />}
              className='mt-3.5'
              errorTitle='Couldn’t load the classes on this course'
              emptyTitle='No classes open right now'
              emptyDescription='Approved providers schedule their own intakes — check back, or ask to be told when the next one opens.'
            >
              <div className='mt-3.5 flex flex-col gap-[11px]'>
                {rows.map(row => (
                  <ClassPickerRow
                    key={row.uuid}
                    row={row}
                    selected={row.uuid === selected?.uuid}
                    onSelect={() => pickClass(row)}
                  />
                ))}
              </div>
            </AsyncSection>
          </Card>

          {/* 2 · eligibility */}
          <Card className='gap-0 px-5 py-[18px]'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <StepHeader
                step={2}
                title={
                  selected?.title
                    ? fillCourseCopy(STEP_ELIGIBILITY_TITLE, { className: selected.title })
                    : STEP_ELIGIBILITY_TITLE_PLAIN
                }
              >
                {STEP_ELIGIBILITY_SUB}
              </StepHeader>

              {status ? <StatusChip status={status} /> : null}
            </div>

            <AsyncSection
              loading={eligibilityAsync?.loading}
              error={eligibilityAsync?.error}
              onRetry={eligibilityAsync?.onRetry}
              empty={checks.length === 0}
              skeleton={<ChecksSkeleton />}
              className='mt-3.5'
              errorTitle='Couldn’t run the enrolment checks'
              emptyTitle='Eligibility is checked per class'
              emptyDescription='Pick a class above and its checks run against your record before checkout.'
            >
              <div className='mt-3.5 grid gap-2.5 sm:grid-cols-2'>
                {checks.map(check => (
                  <CheckTile key={check.id} check={check} />
                ))}
              </div>
            </AsyncSection>

            {/* Only the blocked status carries one, and it is the API's own sentence. */}
            {status?.reason ? (
              <p className='text-destructive mt-3 text-[12.5px] leading-[1.5]'>{status.reason}</p>
            ) : null}
          </Card>

          {/* 3 · pay */}
          <Card className='gap-0 px-5 py-[18px]'>
            <StepHeader step={3} title={STEP_PAY_TITLE} />

            <div className='mt-3.5 grid gap-3 sm:grid-cols-2'>
              <PaymentTile
                selected={method === 'mpesa'}
                onSelect={() => pickMethod('mpesa')}
                title={PAYMENT_LABELS.mpesa}
                note={
                  mpesaPhoneMask
                    ? `STK push to ${mpesaPhoneMask}`
                    : 'STK push to your M-Pesa number'
                }
                mark={
                  <span className='bg-success text-success-foreground inline-flex size-[38px] flex-none items-center justify-center rounded-[11px] text-xs font-extrabold'>
                    M
                  </span>
                }
              />
              <PaymentTile
                selected={method === 'card'}
                onSelect={() => pickMethod('card')}
                title={PAYMENT_LABELS.card}
                note={CARD_NOTE}
                mark={
                  <span className='bg-muted text-foreground/80 inline-flex size-[38px] flex-none items-center justify-center rounded-[11px]'>
                    <CreditCard className='size-[18px]' aria-hidden />
                  </span>
                }
              />
            </div>

            <p className='text-muted-foreground mt-[13px] flex items-start gap-[9px] text-xs leading-[1.5]'>
              <Lock className='text-muted-foreground/70 mt-px size-[15px] flex-none' aria-hidden />
              {PAY_NOTE}
            </p>
          </Card>
        </div>

        {/* ── order ──────────────────────────────────────────────────── */}
        <div className='flex min-w-0 flex-col gap-4'>
          <Card className='border-primary gap-0 px-5 py-[18px]'>
            <h2 className='mb-3 text-sm font-bold'>{ORDER_TITLE}</h2>

            <AsyncSection
              loading={loading}
              error={error}
              onRetry={onRetry}
              empty={selected === undefined}
              skeleton={<OrderSkeleton />}
              errorTitle='Couldn’t load your order'
              emptyTitle='Nothing in the order yet'
              emptyDescription='Pick a class above and the order fills in.'
            >
              <div>
                <div className='border-muted flex items-baseline justify-between gap-3 border-b pb-2.5'>
                  <span className='min-w-0'>
                    <span className='block text-[13px] font-semibold'>{selected?.title}</span>
                    {selected?.host ? (
                      <span className='text-muted-foreground mt-0.5 block text-[11.5px]'>
                        {selected.host}
                      </span>
                    ) : null}
                  </span>
                  <span className='flex-none text-[13px] font-semibold'>
                    {formatCourseMoney(selected?.price, selected?.currency ?? orderCurrency) ??
                      COURSE_PLACEHOLDER}
                  </span>
                </div>

                {(lines ?? []).map(line => (
                  <div
                    key={line.k}
                    className='border-muted flex items-baseline justify-between gap-3 border-b py-[9px] text-[12.5px]'
                  >
                    <span className='text-muted-foreground min-w-0'>{line.k}</span>
                    <span
                      className={cn(
                        'flex-none font-medium',
                        line.tone === 'excluded' ? 'text-warning' : 'text-muted-foreground'
                      )}
                    >
                      {line.v}
                    </span>
                  </div>
                ))}

                <div className='border-muted flex items-baseline justify-between gap-3 border-b py-[9px]'>
                  <span className='text-[12.5px] font-bold'>{ORDER_TOTAL_LABEL}</span>
                  <span className='flex-none text-[17px] font-bold tracking-[-0.02em]'>
                    {amount ?? COURSE_PLACEHOLDER}
                  </span>
                </div>
              </div>
            </AsyncSection>

            <Button
              className='mt-[15px] h-[46px] w-full rounded-[13px] text-[15px] font-bold'
              onClick={onPay}
              disabled={!onPay || status?.tone === 'blocked'}
            >
              {payLabel}
            </Button>
            <p className='text-muted-foreground mt-[9px] text-center text-[11.5px]'>
              {ORDER_FOOTNOTE}
            </p>
          </Card>

          <Card className='gap-0 px-[19px] py-[17px]'>
            <h2 className='mb-[11px] text-sm font-bold'>{UNLOCKS_TITLE}</h2>

            <AsyncSection
              loading={loading}
              error={error}
              onRetry={onRetry}
              empty={unlockLines.length === 0}
              skeleton={<UnlocksSkeleton />}
              errorTitle='Couldn’t load what the enrolment opens'
              emptyTitle='Nothing listed yet'
              emptyDescription='What an enrolment opens is published with the course’s curriculum.'
            >
              <ul className='flex flex-col gap-[9px]'>
                {unlockLines.map(line => (
                  <li
                    key={line.text}
                    className='text-foreground/80 flex items-start gap-[9px] text-[12.5px] leading-[1.5]'
                  >
                    {line.icon === 'check' ? (
                      <Check
                        className='text-success mt-px size-[15px] flex-none stroke-[2.1]'
                        aria-hidden
                      />
                    ) : (
                      <Lock
                        className='text-muted-foreground/70 mt-px size-[15px] flex-none stroke-[2.1]'
                        aria-hidden
                      />
                    )}
                    {line.text}
                  </li>
                ))}
              </ul>
            </AsyncSection>
          </Card>

          <Card className='bg-muted gap-0 px-[19px] py-[17px] shadow-none'>
            <div className='mb-[9px] flex items-center gap-[9px]'>
              <span className='bg-card text-foreground/80 inline-flex size-[30px] flex-none items-center justify-center rounded-[10px]'>
                <Shield className='size-4' aria-hidden />
              </span>
              <h2 className='text-sm font-bold'>{OWNERSHIP_TITLE}</h2>
            </div>
            <p className='text-foreground/80 text-[12.5px] leading-[1.6]'>
              {OWNERSHIP_LEAD}
              <b className='font-semibold'>{creatorName ?? OWNERSHIP_CREATOR_FALLBACK}</b>
              {OWNERSHIP_TAIL}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Parts
 * ────────────────────────────────────────────────────────────────────────── */

function StepHeader({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className='min-w-0'>
      <div className='flex items-center gap-[9px]'>
        <span className='bg-primary text-primary-foreground inline-flex size-[22px] flex-none items-center justify-center rounded-full text-[11px] font-bold'>
          {step}
        </span>
        <h2 className='text-[15px] font-bold'>{title}</h2>
      </div>
      {children ? (
        <p className='text-muted-foreground mt-1 ml-[31px] text-[12.5px]'>{children}</p>
      ) : null}
    </div>
  );
}

function HeaderChip({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const shape =
    'text-foreground/80 inline-flex h-[30px] items-center gap-1.5 rounded-[10px] border px-[11px] text-[12.5px]';

  return onClick ? (
    // 44px on phones per the responsive rule; the artboard's 30px chip from sm.
    <button
      type='button'
      onClick={onClick}
      className={cn(shape, 'hover:bg-muted h-11 transition-colors sm:h-[30px]')}
    >
      {icon}
      {label}
    </button>
  ) : (
    <span className={shape}>
      {icon}
      {label}
    </span>
  );
}

/**
 * One class, as a choice rather than a link. The whole row is the control — the
 * radio is a mark inside it, because a button may not contain another button.
 */
function ClassPickerRow({
  row,
  selected,
  onSelect,
}: {
  row: CourseEnrolClassRow;
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
        'w-full rounded-[14px] border px-4 py-[15px] text-left transition-colors',
        selected
          ? 'border-primary bg-primary/10 ring-primary ring-1'
          : 'border-border bg-card hover:bg-muted/40 shadow-sm'
      )}
    >
      <span className='grid grid-cols-[22px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-3.5 lg:grid-cols-[22px_minmax(0,1fr)_156px_130px_120px] lg:items-center'>
        <span
          aria-hidden
          className={cn(
            'mt-0.5 inline-flex size-[18px] flex-none items-center justify-center rounded-full border-2 lg:mt-0',
            selected ? 'border-primary bg-card' : 'border-input'
          )}
        >
          <span
            className={cn('size-1.5 rounded-full', selected ? 'bg-primary' : 'bg-transparent')}
          />
        </span>

        <span className='min-w-0'>
          <span className='block text-[14.5px] font-bold'>{row.title}</span>
          {where ? (
            <span className='text-muted-foreground mt-[3px] block text-[12.5px]'>{where}</span>
          ) : null}
          <span className='mt-2 flex flex-wrap items-center gap-[7px]'>
            {row.format ? (
              <span
                className={cn(
                  'inline-flex h-[21px] items-center rounded-lg px-[9px] text-[11px] font-bold whitespace-nowrap',
                  formatToneClass(row.formatTone)
                )}
              >
                {row.format}
              </span>
            ) : null}
            {row.rating ? (
              <span className='text-muted-foreground text-[11.5px]'>{row.rating}</span>
            ) : null}
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
            // A span-built bar rather than <Progress>: the row is a <button>,
            // which may only contain phrasing content.
            <span
              role='img'
              aria-label={`${Math.round(fill)}% of seats taken on ${row.title}`}
              className='bg-muted mt-1.5 block h-[5px] overflow-hidden rounded-full'
            >
              <span
                className={cn(
                  'block h-full rounded-full',
                  fill >= SEATS_TIGHT_PERCENT ? 'bg-warning' : 'bg-success'
                )}
                style={{ width: `${fill}%` }}
              />
            </span>
          )}
        </span>

        <span className='col-start-2 lg:col-start-auto lg:text-right'>
          <span className='block text-[18px] font-bold tracking-[-0.02em]'>
            {price ?? COURSE_PLACEHOLDER}
          </span>
          {row.priceNote ? (
            <span className='text-muted-foreground mt-0.5 block text-[11.5px]'>
              {row.priceNote}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

const CHECK_TONES: Record<CourseEnrolCheckTone, { tile: string; icon: string }> = {
  ok: { tile: 'border-success/30 bg-success/6', icon: 'text-success' },
  warn: { tile: 'border-warning/35 bg-warning/6', icon: 'text-warning' },
  neutral: { tile: 'border-border bg-card', icon: 'text-muted-foreground/70' },
};

function CheckTile({ check }: { check: CourseEnrolCheck }) {
  const tone = CHECK_TONES[check.tone];
  const Icon = check.tone === 'warn' ? CircleAlert : Check;

  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border px-[13px] py-[11px]', tone.tile)}>
      <Icon className={cn('mt-px size-4 flex-none stroke-[2.1]', tone.icon)} aria-hidden />
      <span className='min-w-0'>
        <span className='block text-[13px] font-semibold'>{check.label}</span>
        <span className='text-muted-foreground mt-0.5 block text-[11.5px] leading-[1.45]'>
          {check.note}
        </span>
      </span>
    </div>
  );
}

const STATUS_TONES: Record<CourseEnrolStatus['tone'], string> = {
  ok: 'bg-success/10 text-success',
  warn: 'bg-warning/10 text-warning',
  blocked: 'bg-destructive/10 text-destructive',
};

function StatusChip({ status }: { status: CourseEnrolStatus }) {
  const Icon = status.tone === 'ok' ? Check : CircleAlert;

  return (
    <span
      className={cn(
        'inline-flex h-7 flex-none items-center gap-1.5 rounded-[10px] px-[11px] text-[12.5px] font-bold',
        STATUS_TONES[status.tone]
      )}
    >
      <Icon className='size-3.5 stroke-[2.2]' aria-hidden />
      {status.label}
    </span>
  );
}

function PaymentTile({
  selected,
  onSelect,
  title,
  note,
  mark,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  note: string;
  mark: ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex items-center gap-3 rounded-[13px] border px-4 py-3.5 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/10 ring-primary ring-1'
          : 'border-border bg-card hover:bg-muted/40'
      )}
    >
      {mark}
      <span className='min-w-0 flex-1'>
        <span className='block text-[13.5px] font-bold'>{title}</span>
        <span className='text-muted-foreground mt-0.5 block text-[11.5px]'>{note}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          'inline-flex size-[18px] flex-none items-center justify-center rounded-full',
          selected ? 'bg-primary' : 'border-input border-2'
        )}
      >
        {selected ? (
          <Check className='text-primary-foreground size-[11px] stroke-[4]' aria-hidden />
        ) : null}
      </span>
    </button>
  );
}

function ColumnLabel({ children }: { children: string }) {
  return (
    <span className='text-muted-foreground/70 block text-[10.5px] font-bold tracking-[0.05em] uppercase'>
      {children}
    </span>
  );
}

/**
 * Format is a categorical mark rather than a brand surface, so it takes a chart
 * hue — the one exception to brand tokens the design mapping allows.
 */
const FORMAT_TONE: Record<CourseClassFormatTone, string> = {
  online: 'bg-chart-2/15 text-chart-2',
  'in-person': 'bg-chart-4/15 text-chart-4',
  blended: 'bg-chart-1/15 text-chart-1',
};

function formatToneClass(tone: CourseClassFormatTone | undefined): string {
  return tone ? FORMAT_TONE[tone] : 'bg-muted text-muted-foreground';
}

function hasAll(
  required: readonly string[] | undefined,
  vars: CourseEnrolVars | undefined
): boolean {
  if (!required || required.length === 0) return true;
  if (!vars) return false;
  return required.every(name => {
    const value = vars[name];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeletons
 * ────────────────────────────────────────────────────────────────────────── */

function ClassPickerSkeleton() {
  return (
    // The margin is baked in: AsyncSection hands its className to the error and
    // empty states only, never to a skeleton the caller supplied.
    <div className='mt-3.5 flex flex-col gap-[11px]'>
      {[0, 1, 2].map(row => (
        <div key={row} className='border-border bg-card rounded-[14px] border px-4 py-[15px]'>
          <div className='grid grid-cols-[22px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-3.5 lg:grid-cols-[22px_minmax(0,1fr)_156px_130px_120px] lg:items-center'>
            <Skeleton className='size-[18px] flex-none rounded-full' />
            <div className='min-w-0 space-y-2'>
              <Skeleton className='h-4 w-44 max-w-full' />
              <Skeleton className='h-3 w-56 max-w-full' />
              <Skeleton className='h-[21px] w-36 rounded-lg' />
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
              <Skeleton className='h-3 w-16' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChecksSkeleton() {
  return (
    <div className='mt-3.5 grid gap-2.5 sm:grid-cols-2'>
      {[0, 1, 2, 3].map(tile => (
        <div key={tile} className='border-border flex items-start gap-2.5 rounded-xl border px-[13px] py-[11px]'>
          <Skeleton className='size-4 flex-none rounded-full' />
          <div className='min-w-0 flex-1 space-y-1.5'>
            <Skeleton className='h-3.5 w-40 max-w-full' />
            <Skeleton className='h-3 w-full' />
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div>
      <div className='border-muted flex items-baseline justify-between gap-3 border-b pb-2.5'>
        <div className='min-w-0 flex-1 space-y-1.5'>
          <Skeleton className='h-3.5 w-40 max-w-full' />
          <Skeleton className='h-3 w-28' />
        </div>
        <Skeleton className='h-3.5 w-20 flex-none' />
      </div>
      {[0, 1, 2].map(line => (
        <div
          key={line}
          className='border-muted flex items-baseline justify-between gap-3 border-b py-[9px]'
        >
          <Skeleton className='h-3 w-44 max-w-full' />
          <Skeleton className='h-3 w-16 flex-none' />
        </div>
      ))}
    </div>
  );
}

function UnlocksSkeleton() {
  return (
    <div className='flex flex-col gap-[9px]'>
      {[0, 1, 2, 3, 4].map(line => (
        <div key={line} className='flex items-start gap-[9px]'>
          <Skeleton className='size-[15px] flex-none rounded-full' />
          <Skeleton className='h-3 w-full' />
        </div>
      ))}
    </div>
  );
}
