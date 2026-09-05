import { Check, Lock, Minus, ShieldCheck } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import {
  type CourseAccess,
  type CourseGrantSetId,
  courseCapability,
  fillCourseCopy,
} from '../types';

/**
 * The access card — the tinted card that opens the right rail.
 *
 * It answers three questions in the order a reader asks them: *what* access you
 * have (the capability map's `accessLabel`), *why* you have it (`accessSource`,
 * which two viewer states finish with live data), and *what that buys you* — the
 * grant list, four lines of check / lock / dash.
 *
 * The grant copy is transcribed from `Main.dc.html`'s `grantSets`; the
 * capability map only names which set applies (`grantSet`), so a new viewer
 * state adds a row there and a set here, and nothing switches on `access`.
 *
 * No `<AsyncSection>`: every word is static copy from the map, and the one live
 * value (`{date}` / `{className}` in the source line) degrades by dropping out
 * of the sentence. A rail card that blanked itself while a query resolved would
 * make the whole rail jump.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Grants
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * What one line of a grant list says about a capability:
 *
 * - `granted`  — yours, green check.
 * - `withheld` — deliberately someone else's (editing stays with the creator).
 * - `locked`   — yours later, once a decision or a payment lands.
 * - `absent`   — not part of this viewer's world at all, and never will be.
 */
export type CourseGrantTone = 'granted' | 'withheld' | 'locked' | 'absent';

export interface CourseGrant {
  label: string;
  tone: CourseGrantTone;
}

/** Transcribed from the artboard's `grantSets`. Named by `capability.grantSet`. */
export const COURSE_ACCESS_GRANTS: Record<CourseGrantSetId, readonly CourseGrant[]> = {
  owner: [
    { label: 'All lessons and content items', tone: 'granted' },
    { label: 'Course-wide performance and sales', tone: 'granted' },
    { label: 'Approve or decline trainers', tone: 'granted' },
    { label: 'Edit — re-enters review on publish', tone: 'granted' },
  ],

  full: [
    { label: 'All lessons and content items', tone: 'granted' },
    { label: 'Commercial terms and rate cards', tone: 'granted' },
    { label: 'Trainers delivering this course', tone: 'granted' },
    { label: 'Editing stays with the creator', tone: 'withheld' },
  ],

  locked: [
    { label: 'Lesson titles, objectives, item counts', tone: 'granted' },
    { label: 'Pricing floor and revenue split', tone: 'granted' },
    { label: 'Content items', tone: 'locked' },
    { label: 'Course performance figures', tone: 'locked' },
  ],

  applicant: [
    { label: 'Syllabus shape, effort and requirements', tone: 'granted' },
    { label: 'Fee floor, revenue split, rate-card rules', tone: 'granted' },
    { label: 'Teaching content — released on approval', tone: 'locked' },
    { label: 'Other trainers’ rate cards', tone: 'absent' },
  ],

  prospect: [
    { label: 'Full syllabus, durations and objectives', tone: 'granted' },
    { label: 'Intro video, price and every class running', tone: 'granted' },
    { label: 'Lesson items — open on paid enrolment', tone: 'locked' },
    { label: 'Commercial terms between creator and trainer', tone: 'absent' },
  ],

  learner: [
    { label: 'Every lesson in your enrolment', tone: 'granted' },
    { label: 'Your progress and assessments', tone: 'granted' },
    { label: 'Commercial terms', tone: 'absent' },
    { label: 'Other providers and their rates', tone: 'absent' },
  ],
};

/**
 * The tone's mark. Semantic tokens throughout — success, warning and the muted
 * step are fixed across every dashboard domain, which is exactly right for a
 * card that says what you may and may not do.
 *
 * Exported because the licence card speaks the same three-tone vocabulary.
 */
export function CourseGrantIcon({
  tone,
  className,
}: {
  tone: CourseGrantTone;
  className?: string;
}) {
  const shared = cn('flex-none stroke-[1.9]', className);

  if (tone === 'granted') return <Check className={cn(shared, 'text-success')} aria-hidden />;
  if (tone === 'locked') return <Lock className={cn(shared, 'text-warning')} aria-hidden />;
  if (tone === 'withheld') {
    return <Lock className={cn(shared, 'text-muted-foreground/70')} aria-hidden />;
  }
  return <Minus className={cn(shared, 'text-muted-foreground/70')} aria-hidden />;
}

/** Only what you actually have reads at full strength. */
export function courseGrantLabelClass(tone: CourseGrantTone): string {
  return tone === 'granted' ? 'text-foreground/80' : 'text-muted-foreground';
}

/* ────────────────────────────────────────────────────────────────────────────
 * Block
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * The card is brand-tinted for seven of the eight viewers and amber for the one
 * whose access is provisional. That distinction already lives in the capability
 * map as the gate's tone — the same field the shell's access pill reads — so it
 * is read from there rather than re-decided here.
 */
const ACCESS_CARD_TONES = {
  primary: { card: 'border-primary/30 bg-primary/10', icon: 'bg-primary/20 text-primary' },
  warning: { card: 'border-warning/35 bg-warning/10', icon: 'bg-warning/20 text-warning' },
} as const;

export interface AccessCardProps {
  /** From the API. Chooses the label, the blurb and the grant set. */
  access: CourseAccess;
  /**
   * Fills the source line's token: `{date}` for the two approved-trainer states
   * (the day their application was approved) and `{className}` for the enrolled
   * learner. An unsupplied token drops, shortening the sentence.
   */
  vars?: Record<string, string | number | null | undefined>;
  /** Overrides the transcribed set the capability map names. */
  grants?: readonly CourseGrant[];
  className?: string;
}

export function AccessCard({ access, vars, grants, className }: AccessCardProps) {
  const capability = courseCapability(access);
  const tone = ACCESS_CARD_TONES[capability.gate?.tone === 'warning' ? 'warning' : 'primary'];
  const source = fillCourseCopy(capability.accessSource, vars ?? {});
  const rows = grants ?? COURSE_ACCESS_GRANTS[capability.grantSet];

  return (
    <Card className={cn('gap-0 px-[18px] py-4', tone.card, className)}>
      <div className='flex items-center gap-[9px]'>
        <span
          className={cn(
            'inline-flex size-8 flex-none items-center justify-center rounded-[10px]',
            tone.icon
          )}
        >
          <ShieldCheck className='size-4' aria-hidden />
        </span>
        <span className='min-w-0'>
          <span className='block text-[13.5px] font-bold'>{capability.accessLabel}</span>
          {source ? (
            <span className='text-muted-foreground block text-[11.5px]'>{source}</span>
          ) : null}
        </span>
      </div>

      <p className='text-foreground/80 mt-[11px] text-[12.5px] leading-[1.55]'>
        {capability.accessBlurb}
      </p>

      <ul className='mt-3 flex flex-col gap-[7px]'>
        {rows.map(grant => (
          <li
            key={grant.label}
            className={cn(
              'flex items-center gap-2 text-[12.5px]',
              courseGrantLabelClass(grant.tone)
            )}
          >
            <CourseGrantIcon tone={grant.tone} className='size-[15px]' />
            {grant.label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
