'use client';

import { ArrowLeft, Download, Eye, List, Lock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  type CourseReaderItem,
  type CourseReaderLesson,
  type CourseReaderLicenceSetId,
  courseReaderLicenceSet,
} from './blocks/_reader';
import {
  COURSE_READER_FOOTER_NOTES,
  CourseReaderPane,
  type CourseReaderPaneProps,
} from './blocks/ReaderPane';
import { CourseReaderRail, type CourseReaderRailProps } from './blocks/ReaderRail';
import { CourseReaderTree, type CourseReaderTreeProps } from './blocks/ReaderTree';
import { type CourseAccess, courseCapability } from './types';

/**
 * The content reader — read-only, three columns, one implementation for every
 * viewer the API opens the content to.
 *
 * Top bar, then lesson tree · content pane · context rail at 1280 and above.
 * Below that the tree moves into a `Sheet` and the rail falls under the pane, so
 * the pane keeps the full width on a phone.
 *
 * ## What differs between viewers, and where that is decided
 *
 * Four things: the completion ticks, the quiz answer key, the "Download source"
 * affordance and the licence card. All four are derived **here**, once, by
 * {@link courseReaderProfile} reading the capability map — never by a block, and
 * never from the signed-in user's domain. The blocks take booleans and render.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Profile
 * ────────────────────────────────────────────────────────────────────────── */

export interface CourseReaderProfile {
  /** Completion ticks in the tree and the progress bar in its header. */
  progress: boolean;
  /** The quiz marks its correct option. Never for the viewer being assessed. */
  answerKey: boolean;
  /** "Download source" in place of the "View only" chip. */
  ownsSource: boolean;
  /** Which licence the rail states; `null` for a viewer who holds none. */
  licenceSet: CourseReaderLicenceSetId | null;
  /** The pane footer's middle line. */
  footerNote?: string;
}

/**
 * The reader's four per-viewer decisions, read off `COURSE_ACCESS_CAPABILITIES`.
 *
 * The answer key is the one worth stating plainly: it goes to everyone who reads
 * the full content *except* the learner, because the learner is the person the
 * quiz is assessing. A viewer with no licence set at all is a state the reader is
 * not reachable from — the content items are not transmitted to them — so it
 * resolves to the least-privileged answer rather than a guess.
 */
export function courseReaderProfile(access: CourseAccess): CourseReaderProfile {
  const capability = courseCapability(access);
  const licenceSet = courseReaderLicenceSet(access);

  return {
    progress: capability.showProgressStrip,
    answerKey: licenceSet !== null && licenceSet !== 'learner',
    ownsSource: capability.canEdit,
    licenceSet,
    footerNote: licenceSet ? COURSE_READER_FOOTER_NOTES[licenceSet] : undefined,
  };
}

/**
 * The one distinction the reader draws that the capability map does not.
 *
 * An approved organisation and an approved instructor are a single state to the
 * record — same tabs, same rail, `licenceSet: 'trainer'` for both — and that is
 * right, because they see the same page. The reader's copy differs by two words:
 * an organisation *delivers*, and its staff read under the organisation's name
 * rather than their own. Spread this into the view when the approval is held by
 * an organisation.
 */
export const COURSE_READER_ORGANISATION_COPY = {
  footerNote: 'Preparing to deliver · nothing is recorded',
  licenceBlurb:
    'Your organisation is approved to deliver this course, so your staff can read every item while preparing. Nothing here can be edited or re-published by you.',
  licenceVars: { holder: 'your organisation' },
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 * View
 * ────────────────────────────────────────────────────────────────────────── */

export interface CourseReaderViewProps {
  /** From the API. See `use-course-access.ts`. */
  access: CourseAccess;

  /* — top bar — */
  courseTitle?: string;
  /** The line under it: "Lesson 3 · Array layout, mounting & cabling". */
  lessonLabel?: string;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  /** Wired, the top bar's filled button advances to the next item. */
  onNextItem?: () => void;
  nextItemLabel?: string;
  /** Creator only — the map decides who is offered the source files. */
  onDownloadSource?: () => void;

  /* — blocks — */
  tree: CourseReaderTreeProps;
  pane: CourseReaderPaneProps;
  rail?: CourseReaderRailProps;

  /* — per-viewer copy the route fills in — */
  /**
   * The diagonal ownership mark over the pane: the learner's name and enrolment,
   * the organisation, the instructor. The creator owns the page and gets none.
   */
  watermarkText?: string;
  /** Overrides the profile's footer note — see {@link COURSE_READER_ORGANISATION_COPY}. */
  footerNote?: string;
  /** Overrides the licence card's blurb. */
  licenceBlurb?: string;
  /** Fills `{holder}` and `{version}` in the licence copy. */
  licenceVars?: Record<string, string | number | null | undefined>;

  className?: string;
}

export function CourseReaderView({
  access,
  courseTitle,
  lessonLabel,
  backHref,
  backLabel = 'Back to the course record',
  onBack,
  onNextItem,
  nextItemLabel = 'Next item',
  onDownloadSource,
  tree,
  pane,
  rail,
  watermarkText,
  footerNote,
  licenceBlurb,
  licenceVars,
  className,
}: CourseReaderViewProps) {
  const capability = courseCapability(access);
  const profile = courseReaderProfile(access);
  const [contentsOpen, setContentsOpen] = useState(false);

  // Only the viewer whose access is provisional gets the amber pill; every other
  // state is brand-hued, and the gate tone is what the map distinguishes them by.
  const warnTone = capability.gate?.tone === 'warning';

  const treeProps: CourseReaderTreeProps = {
    ...tree,
    showProgress: tree.showProgress ?? profile.progress,
  };

  // Picking an item from the phone sheet should also put the sheet away.
  const sheetTreeProps: CourseReaderTreeProps = {
    ...treeProps,
    onSelectItem: treeProps.onSelectItem
      ? (item: CourseReaderItem, lesson: CourseReaderLesson) => {
          treeProps.onSelectItem?.(item, lesson);
          setContentsOpen(false);
        }
      : undefined,
  };

  return (
    <div className={cn('min-w-0', className)}>
      {/* ── top bar ──────────────────────────────────────────────────── */}
      <div className='mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b pb-3.5'>
        <div className='flex min-w-0 items-center gap-3'>
          {backHref ? (
            <Link
              href={backHref}
              aria-label={backLabel}
              title={backLabel}
              className='text-foreground/80 hover:bg-muted inline-flex size-11 flex-none items-center justify-center rounded-[10px] border transition-colors xl:size-8'
            >
              <ArrowLeft className='size-4' aria-hidden />
            </Link>
          ) : onBack ? (
            <button
              type='button'
              onClick={onBack}
              aria-label={backLabel}
              title={backLabel}
              className='text-foreground/80 hover:bg-muted inline-flex size-11 flex-none items-center justify-center rounded-[10px] border transition-colors xl:size-8'
            >
              <ArrowLeft className='size-4' aria-hidden />
            </button>
          ) : null}

          <span className='min-w-0'>
            <span className='block truncate text-[15px] font-bold tracking-[-0.01em]'>
              {courseTitle}
            </span>
            {lessonLabel ? (
              <span className='text-muted-foreground block truncate text-xs'>{lessonLabel}</span>
            ) : null}
          </span>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {/* The tree lives in a sheet until there is room for a third column. */}
          <Sheet open={contentsOpen} onOpenChange={setContentsOpen}>
            <SheetTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='h-11 rounded-[10px] xl:hidden'
              >
                <List className='size-4' aria-hidden />
                Contents
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-[320px] max-w-[88vw] gap-0 p-0 sm:max-w-[320px]'>
              <SheetHeader className='sr-only'>
                <SheetTitle>Course contents</SheetTitle>
              </SheetHeader>
              <div className='min-h-0 flex-1 overflow-y-auto p-3'>
                <CourseReaderTree {...sheetTreeProps} />
              </div>
            </SheetContent>
          </Sheet>

          <span
            className={cn(
              'inline-flex h-[26px] items-center gap-1.5 rounded-[10px] border px-2.5 text-xs font-semibold',
              warnTone
                ? 'border-warning/35 bg-warning/10 text-warning'
                : 'border-primary/30 bg-primary/10 text-primary'
            )}
          >
            <Eye className='size-3' aria-hidden />
            {capability.accessLabel}
          </span>

          {profile.ownsSource ? (
            <Button
              variant='outline'
              size='sm'
              onClick={onDownloadSource}
              disabled={!onDownloadSource}
              className='h-11 rounded-[10px] xl:h-8'
            >
              <Download className='size-[15px]' aria-hidden />
              Download source
            </Button>
          ) : (
            <span className='bg-muted text-muted-foreground inline-flex h-8 items-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-medium'>
              <Lock className='size-[15px]' aria-hidden />
              View only
            </span>
          )}

          {onNextItem ? (
            <Button size='sm' onClick={onNextItem} className='h-11 rounded-[10px] px-3.5 xl:h-8'>
              {nextItemLabel}
            </Button>
          ) : null}
        </div>
      </div>

      {/* ── tree · pane · rail ───────────────────────────────────────── */}
      <div className='grid items-start gap-[18px] xl:grid-cols-[292px_minmax(0,1fr)_300px]'>
        <div className='hidden xl:block'>
          <CourseReaderTree {...treeProps} />
        </div>

        <div className='min-w-0'>
          <CourseReaderPane
            {...pane}
            answerKey={pane.answerKey ?? profile.answerKey}
            watermarkText={pane.watermarkText ?? watermarkText}
            footerNote={pane.footerNote ?? footerNote ?? profile.footerNote}
          />
        </div>

        {rail ? (
          <CourseReaderRail
            {...rail}
            licenceSet={rail.licenceSet === undefined ? profile.licenceSet : rail.licenceSet}
            licenceBlurb={rail.licenceBlurb ?? licenceBlurb}
            licenceVars={rail.licenceVars ?? licenceVars}
          />
        ) : null}
      </div>
    </div>
  );
}
