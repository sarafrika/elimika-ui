'use client';

import { Check, CircleAlert, Eye, Lock, Shield } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useId, useState } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { formatCourseMoney } from './blocks/_shared';
import {
  type CourseBlockAsyncProps,
  type CourseTrainerApplicantType,
  type CourseTrainingRequirement,
  fillCourseCopy,
} from './types';

/**
 * The trainer's application — what the creator requires, what you would charge,
 * why you, and the licence you sign.
 *
 * Three numbered steps and the deal beside them. Nothing here opens the teaching
 * material: that is the point of the page, and the rail says so twice — once as
 * what unlocks on approval, once as what never does.
 *
 * ## The fee floor
 *
 * `minimum_training_fee` is the creator's condition, not the platform's, and it
 * is the one number on the page that can refuse an application before a human
 * reads it. Each rate is compared against it: a rate below the floor tints its
 * own field and flips the callout from "every format clears the fee floor" to
 * "this rate would be rejected". With no floor published there is nothing to
 * clear, so neither the hints nor the callout are drawn.
 *
 * ## What is private
 *
 * The earnings projection is the applicant's own arithmetic against the
 * creator's split — it is shown to them and to nobody else, which is what the
 * fixed `destructive`-tinted chip states. It is drawn only from figures the
 * response carried: with a share missing, the row it belongs to and the "you
 * keep" line are both left out rather than quietly assumed to be zero.
 *
 * ## Props in, markup out
 *
 * The view fetches nothing. The route composes the requirement rows (see
 * {@link courseApplyRequirementRows}), holds the draft application, and spreads
 * `asyncProps()` per call so a slow requirements query degrades one card.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Copy
 * ────────────────────────────────────────────────────────────────────────── */

const PAGE_TITLE = 'Apply to train this course';
const PAGE_BLURB =
  'The creator releases the teaching material to approved trainers only. Show them you can deliver it, set the rates you would charge, and the content unlocks the moment they approve you.';
const OUTLINE_CHIP = 'View the course outline';
const APPLYING_AS = 'Applying as {who}';

const APPLICANT_LABELS: Record<CourseTrainerApplicantType, string> = {
  organisation: 'an organisation',
  instructor: 'an instructor',
};

const STEP_REQUIREMENTS_TITLE = 'What the creator requires';
const STEP_REQUIREMENTS_SUB =
  'Read from the course record — these are the creator’s conditions, not ours.';
const OUTSTANDING_CHIP = '{outstanding} outstanding';
const NOTHING_OUTSTANDING_CHIP = 'All requirements met';

const STEP_RATES_TITLE = 'Your rate card';
const STEP_RATES_SUB =
  'KES per hour, per head. Only you and the course creator ever see these — they are never shown to other trainers or to learners.';
const RATE_HINT_CLEARS = 'Clears the {minimumFee} floor';
const RATE_HINT_BELOW = 'Below the {minimumFee} floor';

const FLOOR_OK_TITLE = 'Every format clears the fee floor';
const FLOOR_OK_BODY =
  'The creator set a minimum training fee of {minimumFee} per hour per head. Your rates sit above it, so the application goes straight to their decision queue.';
const FLOOR_BELOW_TITLE = 'This rate would be rejected';
const FLOOR_BELOW_BODY =
  'The creator set a minimum training fee of {minimumFee} per hour per head. Anything below it needs an explicit concession from them, and most are declined.';

const STEP_NOTES_TITLE = 'Why you';
const NOTES_PLACEHOLDER =
  'What you can deliver, where, and with what — rooms, rigs, staff, and the first intake you have in mind.';
const NOTES_FOOTNOTE = 'Kept with the application and shown on the creator’s decision screen.';
const NOTES_MAX_LENGTH = 1000;

const LICENCE_TERMS =
  'I accept the content licence: the course material is the creator’s property, is released for delivering this course only, and is not to be downloaded, copied or reused elsewhere.';
const SAVE_DRAFT = 'Save draft';
const SUBMIT = 'Submit application';

const EARNINGS_TITLE = 'What you would keep';
const PRIVATE_CHIP = 'Private';
const EARNINGS_PER_CLASS = 'per class of {heads}';
const EARNINGS_SUB = '{hours} at your group in-person rate of {rate}/hr/head.';
const EARNINGS_GROSS = 'Gross for the class';
const EARNINGS_CREATOR = 'Creator share · {creatorShare}%';
const EARNINGS_PLATFORM = 'Platform fee · {platformFee}%';
const EARNINGS_KEEP = 'You keep';
const EARNINGS_FOOTNOTE =
  'Split and platform fee come from the course record — the creator sets them, you do not negotiate them here.';

const UNLOCKS_TITLE = 'What unlocks on approval';
const TIMELINE_TITLE = 'After you submit';

/* ────────────────────────────────────────────────────────────────────────────
 * Requirements
 * ────────────────────────────────────────────────────────────────────────── */

/** One requirement tile: what the creator asks for, and whether you have it. */
export interface CourseApplyRequirementRow {
  id: string;
  label: string;
  note?: string;
  /** False draws the tile as outstanding — the applicant still has work to do. */
  met: boolean;
}

/** What the applicant has declared against one requirement. */
export interface CourseApplyDeclaration {
  met: boolean;
  /** The applicant's own sentence: "Declared: 2 mock-ups at the Eldoret branch." */
  note?: string;
}

const REQUIREMENT_NOTES = {
  student: 'Learner-provided requirement. You must tell learners before intake.',
  creatorSupplies: 'Optional — the creator supplies these if you do not.',
  creatorMandatory: 'Supplied by the course creator — nothing for you to provide.',
  undeclared: 'Not declared yet.',
} as const;

/**
 * Compose the tiles from the course's training requirements and whatever the
 * applicant has declared against them.
 *
 * A requirement the creator or the learner supplies is never the applicant's to
 * satisfy, so it reads as met. A mandatory one with no declaration is
 * outstanding — that is the state the "1 outstanding" chip counts. Anything the
 * route knows that the course record does not (an admin-verified account, a
 * certificate that strengthens the case) is composed by the route and appended
 * to the returned list; this function only speaks for the requirements.
 */
export function courseApplyRequirementRows(
  requirements: readonly CourseTrainingRequirement[] | undefined,
  declarations?: Readonly<Record<string, CourseApplyDeclaration>>
): CourseApplyRequirementRow[] {
  if (!requirements || requirements.length === 0) return [];

  return requirements.map((requirement, index) => {
    const id = requirement.uuid ?? `${requirement.name}-${index}`;
    const declaration = requirement.uuid ? declarations?.[requirement.uuid] : undefined;
    const mandatory = requirement.is_mandatory === true;

    const providedByOthers =
      requirement.provided_by === 'student' || requirement.provided_by === 'course_creator';
    const met = providedByOthers ? true : (declaration?.met ?? !mandatory);

    const lead =
      requirement.provided_by === 'student'
        ? REQUIREMENT_NOTES.student
        : requirement.provided_by === 'course_creator'
          ? mandatory
            ? REQUIREMENT_NOTES.creatorMandatory
            : REQUIREMENT_NOTES.creatorSupplies
          : mandatory
            ? `Mandatory${requirement.requirement_type === 'facility' ? ' facility' : ''}.`
            : 'Optional.';

    const detail =
      declaration?.note ?? requirement.description ?? (met ? undefined : REQUIREMENT_NOTES.undeclared);

    return {
      id,
      label: courseApplyRequirementLabel(requirement),
      note: [lead, detail].filter(Boolean).join(' '),
      met,
    };
  });
}

/** "Solar training rig · 2 units". */
export function courseApplyRequirementLabel(requirement: CourseTrainingRequirement): string {
  const { name, quantity, unit } = requirement;
  if (quantity === undefined) return name;
  return `${name} · ${quantity} ${unit ?? (quantity === 1 ? 'unit' : 'units')}`;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Rate card
 * ────────────────────────────────────────────────────────────────────────── */

/** The four hourly rates an application carries, in the order the card lists them. */
export type CourseApplyRateField =
  | 'private_online_hourly_rate'
  | 'private_inperson_hourly_rate'
  | 'group_online_hourly_rate'
  | 'group_inperson_hourly_rate';

export type CourseApplyRates = Partial<Record<CourseApplyRateField, number>>;

export const COURSE_APPLY_RATE_FIELDS = [
  { field: 'private_online_hourly_rate', label: 'Private · online' },
  { field: 'private_inperson_hourly_rate', label: 'Private · in-person' },
  { field: 'group_online_hourly_rate', label: 'Group · online' },
  { field: 'group_inperson_hourly_rate', label: 'Group · in-person' },
] as const satisfies ReadonlyArray<{ field: CourseApplyRateField; label: string }>;

/** The rate the earnings projection is written against. */
const EARNINGS_RATE_FIELD: CourseApplyRateField = 'group_inperson_hourly_rate';

/* ────────────────────────────────────────────────────────────────────────────
 * Earnings
 * ────────────────────────────────────────────────────────────────────────── */

export interface CourseApplyEarningsInput {
  /** Hourly rate per head — the group in-person rate off the card. */
  rate: number | undefined;
  /** Teaching hours in one class. */
  hours: number | undefined;
  /** Learners in one class. */
  heads: number | undefined;
  /** The creator's percentage of the sale. */
  creatorShare?: number;
  /** The platform's percentage of the sale. */
  platformFee?: number;
}

export interface CourseApplyEarnings {
  gross: number;
  /** Absent when the course record carried no creator share. */
  creator?: number;
  /** Absent when the course record carried no platform fee. */
  platform?: number;
  /** Only stated once both deductions are known — a partial total would mislead. */
  keep?: number;
}

/**
 * What one class is worth to the trainer, from figures the response actually
 * carried. `undefined` when the rate, the hours or the class size is missing:
 * the card shows its empty state rather than a projection built on a zero.
 */
export function courseApplyEarnings({
  rate,
  hours,
  heads,
  creatorShare,
  platformFee,
}: CourseApplyEarningsInput): CourseApplyEarnings | undefined {
  if (rate === undefined || hours === undefined || heads === undefined) return undefined;
  if (!Number.isFinite(rate) || !Number.isFinite(hours) || !Number.isFinite(heads)) return undefined;

  const gross = Math.round(rate * hours * heads);
  const creator = creatorShare === undefined ? undefined : Math.round((gross * creatorShare) / 100);
  const platform = platformFee === undefined ? undefined : Math.round((gross * platformFee) / 100);
  const keep =
    creator === undefined || platform === undefined ? undefined : gross - creator - platform;

  return { gross, creator, platform, keep };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Rail copy
 * ────────────────────────────────────────────────────────────────────────── */

/** A line of "What unlocks on approval". */
export interface CourseApplyUnlock {
  text: string;
  /** Tokens the line needs. A line missing one is dropped. */
  requires?: readonly string[];
  /** `check` for what approval grants, `lock` for what it never does. */
  icon: 'check' | 'lock';
  /** The one line that is a condition rather than a limit. */
  tone?: 'warning';
}

/**
 * Values the unlock lines interpolate.
 *
 * | token | source |
 * |---|---|
 * | `lessons` / `contentItems` | the curriculum's shape |
 */
export type CourseApplyVars = Record<string, string | number | null | undefined>;

/** Transcribed from the artboard's `unlocks` list. */
export const COURSE_APPLY_UNLOCKS: readonly CourseApplyUnlock[] = [
  {
    text: 'All {lessons} lessons and {contentItems} content items, in full',
    requires: ['lessons', 'contentItems'],
    icon: 'check',
  },
  { text: 'The right to create classes for this course', icon: 'check' },
  { text: 'Read and teach only — no download, no copy', icon: 'lock' },
  { text: 'Pages watermarked with your account', icon: 'lock' },
  { text: 'Access ends if the creator withdraws approval', icon: 'lock', tone: 'warning' },
];

export interface CourseApplyTimelineStep {
  title: string;
  note: string;
}

/** Transcribed from the artboard's `steps` list. */
export const COURSE_APPLY_TIMELINE: readonly CourseApplyTimelineStep[] = [
  { title: 'Application queued', note: 'Visible to the creator with your rate card and notes.' },
  {
    title: 'Creator decides',
    note: 'Typically 5 working days. They may approve, decline, or approve with a capped rate.',
  },
  {
    title: 'Content unlocks under licence',
    note: 'The full course record opens to you, read-only and watermarked.',
  },
  {
    title: 'You create your first class',
    note: 'Set your schedule, venue and seats; learners enrol against it.',
  },
];

/* ────────────────────────────────────────────────────────────────────────────
 * View
 * ────────────────────────────────────────────────────────────────────────── */

export interface ApplyToTrainViewProps extends CourseBlockAsyncProps {
  /* — header — */
  courseTitle?: string;
  creatorName?: string;
  /** Whether the application is an organisation's or an instructor's. */
  applicantType?: CourseTrainerApplicantType;
  outlineHref?: string;
  onViewOutline?: () => void;

  /* — step 1 — */
  /** Composed rows; see {@link courseApplyRequirementRows}. `loading`/`error` cover this call. */
  requirements?: readonly CourseApplyRequirementRow[];

  /* — step 2 — */
  /** Controlled rate card. Leave unset to let the view hold the draft. */
  rates?: CourseApplyRates;
  /** Initial rates when uncontrolled. */
  defaultRates?: CourseApplyRates;
  onRateChange?: (field: CourseApplyRateField, value: number | undefined) => void;
  /** The creator's fee floor. Without it no hint and no callout are drawn. */
  minimumTrainingFee?: number;
  /** ISO currency for every figure on the page. */
  currency?: string;

  /* — step 3 — */
  /** Controlled notes. Leave unset to let the view hold the draft. */
  notes?: string;
  defaultNotes?: string;
  onNotesChange?: (notes: string) => void;
  notesMaxLength?: number;
  /** Controlled licence acceptance. Leave unset to let the view hold it. */
  licenceAccepted?: boolean;
  defaultLicenceAccepted?: boolean;
  onLicenceAcceptedChange?: (accepted: boolean) => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  /** True while the application is in flight; the submit button waits. */
  submitting?: boolean;

  /* — rail — */
  /** Teaching hours in one class, for the earnings projection. */
  classHours?: number;
  /** Learners in one class. */
  classSize?: number;
  /** The creator's percentage of the sale, off the course record. */
  creatorSharePercentage?: number;
  /** The platform's percentage of the sale. */
  platformFeePercentage?: number;
  /** Spread `asyncProps(record.course)` — the split and the floor come from it. */
  earningsAsync?: CourseBlockAsyncProps;
  /** Values the unlock lines interpolate. See {@link CourseApplyVars}. */
  vars?: CourseApplyVars;
  /** Overrides the transcribed unlock list. */
  unlocks?: readonly CourseApplyUnlock[];
  /** Overrides the transcribed timeline. */
  timeline?: readonly CourseApplyTimelineStep[];
  /** Which timeline step the application has reached. */
  timelineStep?: number;

  className?: string;
}

export function ApplyToTrainView({
  courseTitle,
  creatorName,
  applicantType = 'organisation',
  outlineHref,
  onViewOutline,
  requirements,
  rates,
  defaultRates,
  onRateChange,
  minimumTrainingFee,
  currency,
  notes,
  defaultNotes = '',
  onNotesChange,
  notesMaxLength = NOTES_MAX_LENGTH,
  licenceAccepted,
  defaultLicenceAccepted = false,
  onLicenceAcceptedChange,
  onSaveDraft,
  onSubmit,
  submitting,
  classHours,
  classSize,
  creatorSharePercentage,
  platformFeePercentage,
  earningsAsync,
  vars,
  unlocks,
  timeline,
  timelineStep = 0,
  loading,
  error,
  onRetry,
  className,
}: ApplyToTrainViewProps) {
  const licenceId = useId();

  const [ratesDraft, setRatesDraft] = useState<CourseApplyRates>(defaultRates ?? {});
  const rateValues = rates ?? ratesDraft;

  const [notesDraft, setNotesDraft] = useState(defaultNotes);
  const notesValue = notes ?? notesDraft;

  const [acceptedDraft, setAcceptedDraft] = useState(defaultLicenceAccepted);
  const accepted = licenceAccepted ?? acceptedDraft;

  const setRate = (field: CourseApplyRateField, value: number | undefined) => {
    if (rates === undefined) setRatesDraft(previous => ({ ...previous, [field]: value }));
    onRateChange?.(field, value);
  };

  const setNotes = (value: string) => {
    if (notes === undefined) setNotesDraft(value);
    onNotesChange?.(value);
  };

  const setAccepted = (value: boolean) => {
    if (licenceAccepted === undefined) setAcceptedDraft(value);
    onLicenceAcceptedChange?.(value);
  };

  /* — derived — */

  const rows = requirements ?? [];
  const outstanding = rows.filter(row => !row.met).length;

  const floor = formatCourseMoney(minimumTrainingFee, currency);
  const belowFloor = (field: CourseApplyRateField): boolean => {
    const value = rateValues[field];
    return minimumTrainingFee !== undefined && value !== undefined && value < minimumTrainingFee;
  };
  const anyBelowFloor = COURSE_APPLY_RATE_FIELDS.some(({ field }) => belowFloor(field));

  const earnings = courseApplyEarnings({
    rate: rateValues[EARNINGS_RATE_FIELD],
    hours: classHours,
    heads: classSize,
    creatorShare: creatorSharePercentage,
    platformFee: platformFeePercentage,
  });

  const unlockLines = (unlocks ?? COURSE_APPLY_UNLOCKS)
    .filter(line => hasAll(line.requires, vars))
    .map(line => ({
      text: fillCourseCopy(line.text, vars ?? {}),
      icon: line.icon,
      tone: line.tone,
    }));

  const steps = timeline ?? COURSE_APPLY_TIMELINE;
  const eyebrow = [courseTitle, creatorName ? `by ${creatorName}` : undefined]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={cn('min-w-0', className)}>
      {/* ── header ───────────────────────────────────────────────────── */}
      <div className='mb-5 flex flex-wrap items-end justify-between gap-x-5 gap-y-3'>
        <div className='min-w-0'>
          {eyebrow ? <p className='text-muted-foreground mb-[5px] text-xs'>{eyebrow}</p> : null}
          <h1 className='text-2xl font-bold tracking-tight'>{PAGE_TITLE}</h1>
          <p className='text-muted-foreground mt-1.5 max-w-[780px] text-[13.5px] leading-[1.6]'>
            {PAGE_BLURB}
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <OutlineChip href={outlineHref} onClick={onViewOutline} />
          <span className='bg-primary/10 text-primary inline-flex h-[30px] items-center rounded-[10px] px-[11px] text-[12.5px] font-bold'>
            {fillCourseCopy(APPLYING_AS, { who: APPLICANT_LABELS[applicantType] })}
          </span>
        </div>
      </div>

      <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]'>
        {/* ── form ───────────────────────────────────────────────────── */}
        <div className='flex min-w-0 flex-col gap-4'>
          {/* 1 · requirements */}
          <Card className='gap-0 px-5 py-[18px]'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <StepHeader step={1} title={STEP_REQUIREMENTS_TITLE}>
                {STEP_REQUIREMENTS_SUB}
              </StepHeader>

              {rows.length > 0 ? (
                <span
                  className={cn(
                    'inline-flex h-[26px] flex-none items-center gap-1.5 rounded-[10px] px-2.5 text-xs font-bold',
                    outstanding > 0
                      ? 'bg-warning/10 text-warning'
                      : 'bg-success/10 text-success'
                  )}
                >
                  {outstanding > 0
                    ? fillCourseCopy(OUTSTANDING_CHIP, { outstanding })
                    : NOTHING_OUTSTANDING_CHIP}
                </span>
              ) : null}
            </div>

            <AsyncSection
              loading={loading}
              error={error}
              onRetry={onRetry}
              empty={rows.length === 0}
              skeleton={<RequirementsSkeleton />}
              className='mt-3.5'
              errorTitle='Couldn’t load the creator’s requirements'
              emptyTitle='No requirements listed'
              emptyDescription='This creator has not published conditions for delivering the course — your application is judged on the notes and rate card alone.'
            >
              <div className='mt-3.5 grid gap-2.5 sm:grid-cols-2'>
                {rows.map(row => (
                  <RequirementTile key={row.id} row={row} />
                ))}
              </div>
            </AsyncSection>
          </Card>

          {/* 2 · rate card */}
          <Card className='gap-0 px-5 py-[18px]'>
            <StepHeader step={2} title={STEP_RATES_TITLE}>
              {STEP_RATES_SUB}
            </StepHeader>

            <div className='mt-[15px] grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              {COURSE_APPLY_RATE_FIELDS.map(({ field, label }) => (
                <RateField
                  key={field}
                  label={label}
                  currency={currency}
                  value={rateValues[field]}
                  below={belowFloor(field)}
                  floor={floor}
                  onChange={value => setRate(field, value)}
                />
              ))}
            </div>

            {floor ? (
              <FloorCallout below={anyBelowFloor} minimumFee={floor} />
            ) : null}
          </Card>

          {/* 3 · notes, licence and submit */}
          <Card className='gap-0 px-5 py-[18px]'>
            <StepHeader step={3} title={STEP_NOTES_TITLE}>
              <>
                Goes to the creator with your rate card as{' '}
                <code className='bg-muted rounded-[5px] px-[5px] py-px text-[11.5px]'>
                  application_notes
                </code>
                .
              </>
            </StepHeader>

            <Textarea
              value={notesValue}
              maxLength={notesMaxLength}
              onChange={event => setNotes(event.target.value)}
              placeholder={NOTES_PLACEHOLDER}
              className='mt-3.5 min-h-[92px] rounded-xl px-[15px] py-[13px] text-[13.5px] leading-[1.65]'
            />
            <div className='text-muted-foreground/70 mt-[7px] flex flex-wrap justify-between gap-2 text-[11px]'>
              <span>{NOTES_FOOTNOTE}</span>
              <span>
                {notesValue.length} / {notesMaxLength}
              </span>
            </div>

            <div className='border-muted mt-4 flex flex-col gap-4 border-t pt-[15px] lg:flex-row lg:items-center lg:justify-between'>
              <label
                htmlFor={licenceId}
                className='text-muted-foreground flex max-w-[460px] cursor-pointer items-start gap-[9px] text-xs leading-[1.5]'
              >
                <Checkbox
                  id={licenceId}
                  checked={accepted}
                  onCheckedChange={value => setAccepted(value === true)}
                  className='mt-px size-4 flex-none rounded-[5px]'
                />
                {LICENCE_TERMS}
              </label>

              <div className='flex flex-none flex-wrap items-center gap-[9px]'>
                {onSaveDraft ? (
                  <Button
                    variant='outline'
                    onClick={onSaveDraft}
                    className='h-11 rounded-xl px-4 text-[13.5px] font-semibold sm:h-[42px]'
                  >
                    {SAVE_DRAFT}
                  </Button>
                ) : null}
                <Button
                  onClick={onSubmit}
                  disabled={!onSubmit || !accepted || submitting}
                  className='h-11 rounded-xl px-[22px] text-sm font-bold sm:h-[42px]'
                >
                  {SUBMIT}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* ── rail ───────────────────────────────────────────────────── */}
        <div className='flex min-w-0 flex-col gap-4'>
          <Card className='border-primary bg-primary/10 gap-0 px-[19px] py-[17px] shadow-none'>
            <div className='flex flex-wrap items-baseline justify-between gap-2.5'>
              <span className='inline-flex items-center gap-2'>
                <h2 className='text-sm font-bold'>{EARNINGS_TITLE}</h2>
                <span className='bg-destructive/10 text-destructive inline-flex h-[26px] items-center gap-1.5 rounded-[10px] px-2.5 text-[11.5px] font-bold'>
                  <Lock className='size-3 stroke-[2]' aria-hidden />
                  {PRIVATE_CHIP}
                </span>
              </span>
              {classSize === undefined ? null : (
                <span className='text-muted-foreground text-[11.5px]'>
                  {fillCourseCopy(EARNINGS_PER_CLASS, { heads: classSize })}
                </span>
              )}
            </div>

            <AsyncSection
              loading={earningsAsync?.loading}
              error={earningsAsync?.error}
              onRetry={earningsAsync?.onRetry}
              empty={earnings === undefined}
              skeleton={<EarningsSkeleton />}
              className='mt-3'
              errorTitle='Couldn’t load the creator’s terms'
              emptyTitle='Set your group in-person rate'
              emptyDescription='The projection needs your rate, the teaching hours and the class size the creator published.'
            >
              <div>
                {classHours === undefined || rateValues[EARNINGS_RATE_FIELD] === undefined ? null : (
                  <p className='text-muted-foreground mt-[5px] text-[11.5px]'>
                    {fillCourseCopy(EARNINGS_SUB, {
                      hours: formatCourseHours(classHours),
                      rate: formatCourseMoney(rateValues[EARNINGS_RATE_FIELD], currency),
                    })}
                  </p>
                )}

                <dl className='mt-[13px] flex flex-col'>
                  <EarningsRow
                    k={EARNINGS_GROSS}
                    v={formatCourseMoney(earnings?.gross, currency)}
                    tone='gross'
                  />
                  {earnings?.creator === undefined || creatorSharePercentage === undefined ? null : (
                    <EarningsRow
                      k={fillCourseCopy(EARNINGS_CREATOR, {
                        creatorShare: creatorSharePercentage,
                      })}
                      v={prefixMinus(formatCourseMoney(earnings.creator, currency))}
                      tone='deduction'
                    />
                  )}
                  {earnings?.platform === undefined || platformFeePercentage === undefined ? null : (
                    <EarningsRow
                      k={fillCourseCopy(EARNINGS_PLATFORM, {
                        platformFee: platformFeePercentage,
                      })}
                      v={prefixMinus(formatCourseMoney(earnings.platform, currency))}
                      tone='deduction'
                    />
                  )}
                  {earnings?.keep === undefined ? null : (
                    <EarningsRow
                      k={EARNINGS_KEEP}
                      v={formatCourseMoney(earnings.keep, currency)}
                      tone='keep'
                    />
                  )}
                </dl>
              </div>
            </AsyncSection>

            <p className='text-muted-foreground mt-3 text-[11.5px] leading-[1.5]'>
              {EARNINGS_FOOTNOTE}
            </p>
          </Card>

          <Card className='gap-0 px-[19px] py-[17px]'>
            <div className='mb-[11px] flex items-center gap-[9px]'>
              <span className='bg-muted text-foreground/80 inline-flex size-[30px] flex-none items-center justify-center rounded-[10px]'>
                <Shield className='size-4' aria-hidden />
              </span>
              <h2 className='text-sm font-bold'>{UNLOCKS_TITLE}</h2>
            </div>

            <AsyncSection
              loading={earningsAsync?.loading}
              error={earningsAsync?.error}
              onRetry={earningsAsync?.onRetry}
              empty={unlockLines.length === 0}
              skeleton={<UnlocksSkeleton />}
              errorTitle='Couldn’t load what approval opens'
              emptyTitle='Nothing listed yet'
              emptyDescription='What approval opens is published with the course’s curriculum.'
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
                        className={cn(
                          'mt-px size-[15px] flex-none stroke-[2.1]',
                          line.tone === 'warning' ? 'text-warning' : 'text-muted-foreground/70'
                        )}
                        aria-hidden
                      />
                    )}
                    {line.text}
                  </li>
                ))}
              </ul>
            </AsyncSection>
          </Card>

          <Card className='gap-0 px-[19px] py-[17px]'>
            <h2 className='mb-[13px] text-sm font-bold'>{TIMELINE_TITLE}</h2>
            <ol className='flex flex-col'>
              {steps.map((step, index) => (
                <TimelineStep
                  key={step.title}
                  step={step}
                  reached={index <= timelineStep}
                  last={index === steps.length - 1}
                />
              ))}
            </ol>
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

function OutlineChip({ href, onClick }: { href?: string; onClick?: () => void }) {
  const shape =
    'text-foreground/80 inline-flex h-[30px] items-center gap-1.5 rounded-[10px] border px-[11px] text-[12.5px]';
  const icon = <Eye className='size-3.5' aria-hidden />;
  // 44px on phones per the responsive rule; the artboard's 30px chip from sm.
  const interactive = cn(shape, 'hover:bg-muted h-11 transition-colors sm:h-[30px]');

  if (href) {
    return (
      <Link href={href} className={interactive}>
        {icon}
        {OUTLINE_CHIP}
      </Link>
    );
  }
  return onClick ? (
    <button type='button' onClick={onClick} className={interactive}>
      {icon}
      {OUTLINE_CHIP}
    </button>
  ) : (
    <span className={shape}>
      {icon}
      {OUTLINE_CHIP}
    </span>
  );
}

function RequirementTile({ row }: { row: CourseApplyRequirementRow }) {
  const Icon = row.met ? Check : CircleAlert;

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-[13px] py-[11px]',
        row.met ? 'border-success/30 bg-success/6' : 'border-warning/35 bg-warning/6'
      )}
    >
      <Icon
        className={cn(
          'mt-px size-4 flex-none stroke-[2.1]',
          row.met ? 'text-success' : 'text-warning'
        )}
        aria-hidden
      />
      <span className='min-w-0'>
        <span className='block text-[13px] font-semibold'>{row.label}</span>
        {row.note ? (
          <span className='text-muted-foreground mt-0.5 block text-[11.5px] leading-[1.45]'>
            {row.note}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * One hourly rate. The floor is checked per field rather than only on the group
 * in-person rate, so a below-floor figure is never captioned "clears the floor".
 */
function RateField({
  label,
  currency,
  value,
  below,
  floor,
  onChange,
}: {
  label: string;
  currency: string | undefined;
  value: number | undefined;
  below: boolean;
  floor: string | undefined;
  onChange: (value: number | undefined) => void;
}) {
  const fieldId = useId();

  return (
    <div className='min-w-0'>
      <label
        htmlFor={fieldId}
        className='text-muted-foreground mb-1.5 block text-[11.5px] font-semibold'
      >
        {label}
      </label>

      <div
        className={cn(
          // 44px on phones per the responsive rule; the artboard's 42px from sm.
          'focus-within:ring-ring/50 flex h-11 items-center gap-2 rounded-[11px] border px-3 focus-within:ring-[3px] sm:h-[42px]',
          below ? 'border-warning bg-warning/5' : 'border-input bg-card'
        )}
      >
        <span className='text-muted-foreground/70 flex-none text-[11.5px] font-semibold'>
          {currency ?? 'KES'}
        </span>
        <input
          id={fieldId}
          type='number'
          inputMode='numeric'
          min={0}
          step={10}
          value={value ?? ''}
          onChange={event => {
            const next = event.target.value.trim();
            const parsed = Number(next);
            onChange(next === '' || !Number.isFinite(parsed) ? undefined : parsed);
          }}
          className={cn(
            'w-full min-w-0 flex-1 bg-transparent text-[16px] font-bold tracking-[-0.01em] outline-none',
            below ? 'text-warning' : 'text-foreground'
          )}
        />
      </div>

      {floor ? (
        <p className={cn('mt-[5px] text-[11px]', below ? 'text-warning' : 'text-muted-foreground')}>
          {fillCourseCopy(below ? RATE_HINT_BELOW : RATE_HINT_CLEARS, { minimumFee: floor })}
        </p>
      ) : null}
    </div>
  );
}

function FloorCallout({ below, minimumFee }: { below: boolean; minimumFee: string }) {
  const Icon = below ? CircleAlert : Check;

  return (
    <div
      className={cn(
        'mt-[15px] flex items-center gap-3 rounded-xl border px-3.5 py-3',
        below ? 'border-warning/35 bg-warning/8' : 'border-success/30 bg-success/6'
      )}
    >
      <span
        className={cn(
          'inline-flex size-8 flex-none items-center justify-center rounded-[10px]',
          below ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'
        )}
      >
        <Icon className='size-4 stroke-[1.9]' aria-hidden />
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block text-[13px] font-bold'>
          {below ? FLOOR_BELOW_TITLE : FLOOR_OK_TITLE}
        </span>
        <span className='text-foreground/80 mt-0.5 block text-[12.5px] leading-[1.5]'>
          {fillCourseCopy(below ? FLOOR_BELOW_BODY : FLOOR_OK_BODY, { minimumFee })}
        </span>
      </span>
    </div>
  );
}

type EarningsRowTone = 'gross' | 'deduction' | 'keep';

const EARNINGS_ROW_TONES: Record<EarningsRowTone, { k: string; v: string }> = {
  gross: { k: 'text-muted-foreground font-semibold', v: 'text-foreground text-[13px] font-semibold' },
  deduction: { k: 'text-muted-foreground font-medium', v: 'text-muted-foreground font-medium' },
  keep: { k: 'text-foreground font-bold', v: 'text-success text-[16px] font-bold' },
};

function EarningsRow({
  k,
  v,
  tone,
}: {
  k: string;
  v: string | undefined;
  tone: EarningsRowTone;
}) {
  const classes = EARNINGS_ROW_TONES[tone];

  return (
    <div className='border-primary/15 flex items-baseline justify-between gap-2.5 border-b py-2 text-[12.5px]'>
      <dt className={classes.k}>{k}</dt>
      <dd className={cn('flex-none text-right', classes.v)}>{v}</dd>
    </div>
  );
}

function TimelineStep({
  step,
  reached,
  last,
}: {
  step: CourseApplyTimelineStep;
  reached: boolean;
  last: boolean;
}) {
  return (
    <li className='flex gap-[11px]'>
      <span aria-hidden className='flex flex-none flex-col items-center'>
        <span
          className={cn(
            'size-[11px] rounded-full',
            reached ? 'bg-primary' : 'border-input bg-card border-2'
          )}
        />
        {last ? null : <span className='bg-border w-0.5 flex-1' />}
      </span>
      <span className={cn('min-w-0', last ? '' : 'pb-4')}>
        <span
          className={cn(
            'block text-[12.5px] font-semibold',
            reached ? 'text-foreground' : 'text-foreground/80'
          )}
        >
          {step.title}
        </span>
        <span className='text-muted-foreground mt-0.5 block text-[11.5px] leading-[1.5]'>
          {step.note}
        </span>
      </span>
    </li>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

/** 42.5 → "42h 30m". */
export function formatCourseHours(hours: number): string {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes === 0 ? `${whole}h` : `${whole}h ${minutes}m`;
}

/** "− KES 6,800", or nothing when the figure is absent. */
function prefixMinus(value: string | undefined): string | undefined {
  return value === undefined ? undefined : `− ${value}`;
}

function hasAll(
  required: readonly string[] | undefined,
  vars: CourseApplyVars | undefined
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

function RequirementsSkeleton() {
  return (
    // The margin is baked in: AsyncSection hands its className to the error and
    // empty states only, never to a skeleton the caller supplied.
    <div className='mt-3.5 grid gap-2.5 sm:grid-cols-2'>
      {[0, 1, 2, 3, 4, 5].map(tile => (
        <div
          key={tile}
          className='border-border flex items-start gap-2.5 rounded-xl border px-[13px] py-[11px]'
        >
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

function EarningsSkeleton() {
  return (
    <div className='mt-3'>
      <Skeleton className='mt-[5px] h-3 w-56 max-w-full' />
      <div className='mt-[13px] flex flex-col'>
        {[0, 1, 2, 3].map(row => (
          <div
            key={row}
            className='border-primary/15 flex items-baseline justify-between gap-2.5 border-b py-2'
          >
            <Skeleton className='h-3 w-32' />
            <Skeleton className='h-3 w-20 flex-none' />
          </div>
        ))}
      </div>
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
