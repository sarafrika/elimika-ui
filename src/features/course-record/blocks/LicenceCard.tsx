import { Shield } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { type CourseAccess, type CourseLicenceSetId, courseCapability } from '../types';
import { type CourseGrant, CourseGrantIcon } from './AccessCard';

/**
 * The content licence card — the terms under which this viewer holds the
 * creator's material.
 *
 * Three sets, transcribed from `Main.dc.html`'s `licenceSets`: `admin` (read to
 * moderate, every open audited), `trainer` (teach from it while your approval
 * stands) and `learner` (personal, watermarked, non-transferable). The blurb
 * above them is per-viewer and already lives in the capability map as
 * `licenceBlurb`, because it is one sentence rather than a set.
 *
 * The card is not in every rail: `licenceSet` is `null` for the creator (it is
 * their own work) and for the three viewers who have not been given the content
 * at all. Rendering it then would state terms over material nobody holds, so the
 * block returns `null` and the rail closes up.
 */

/** Transcribed from the artboard's `licenceSets`. Named by `capability.licenceSet`. */
export const COURSE_LICENCE_TERMS: Record<CourseLicenceSetId, readonly CourseGrant[]> = {
  admin: [
    { label: 'Read in place — no source download', tone: 'withheld' },
    { label: 'Every open written to the audit log', tone: 'granted' },
    { label: 'Moderation decisions are attributed to you', tone: 'granted' },
    { label: 'Editing stays with the creator', tone: 'withheld' },
  ],

  trainer: [
    { label: 'Read and teach — no download, no copy', tone: 'withheld' },
    { label: 'Pages watermarked with your account', tone: 'granted' },
    { label: 'Access ends if approval is withdrawn', tone: 'locked' },
    { label: 'Re-use outside this course is not licensed', tone: 'locked' },
  ],

  learner: [
    { label: 'Personal, non-transferable licence', tone: 'granted' },
    { label: 'Pages watermarked with your name', tone: 'granted' },
    { label: 'No download or re-sharing', tone: 'withheld' },
    { label: 'Opens while your enrolment is active', tone: 'locked' },
  ],
};

export interface LicenceCardProps {
  /** From the API. Names the term set, and carries the blurb above it. */
  access: CourseAccess;
  /** Overrides the transcribed set the capability map names. */
  terms?: readonly CourseGrant[];
  className?: string;
}

export function LicenceCard({ access, terms, className }: LicenceCardProps) {
  const capability = courseCapability(access);
  const set = capability.licenceSet;

  // No licence set means this viewer holds none of the creator's material.
  if (!set) return null;

  const rows = terms ?? COURSE_LICENCE_TERMS[set];

  return (
    <Card className={cn('gap-0 px-[18px] py-4', className)}>
      <div className='mb-2.5 flex items-center gap-[9px]'>
        <span className='bg-muted text-foreground/80 inline-flex size-[30px] flex-none items-center justify-center rounded-[10px]'>
          <Shield className='size-4' aria-hidden />
        </span>
        <h3 className='text-sm font-bold'>Content licence</h3>
      </div>

      {capability.licenceBlurb ? (
        <p className='text-foreground/80 mb-[11px] text-[12.5px] leading-[1.55]'>
          {capability.licenceBlurb}
        </p>
      ) : null}

      {/*
        Unlike a grant line, every licence term reads at full strength: the
        restrictions are the point of the card, not a greyed-out footnote. Only
        the mark carries the tone.
      */}
      <ul className='flex flex-col gap-[7px]'>
        {rows.map(term => (
          <li
            key={term.label}
            className='text-foreground/80 flex items-start gap-2 text-[12.5px] leading-[1.45]'
          >
            <CourseGrantIcon tone={term.tone} className='mt-px size-3.5' />
            {term.label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
