'use client';

import { Check, Download, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { type CourseBlockAsyncProps, fillCourseCopy } from '../types';
import type { CourseReaderLicenceSetId } from './_reader';
import { type CourseGrant, CourseGrantIcon, courseGrantLabelClass } from './AccessCard';

/**
 * The reader's right column — four cards of context for what the pane is showing.
 *
 * Objectives, attachments, the licence you are reading under, and the learner's
 * own notes. The first, second and fourth are data regions and each owns its
 * `<AsyncSection>`; the licence card is static copy from the capability map and
 * would only make the rail jump if it blanked itself while a query resolved.
 *
 * The licence copy is transcribed from `Reader.dc.html`'s `renderVals()`. The
 * capability map names which set applies — see `courseReaderLicenceSet` — so
 * nothing here switches on `access`.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Licence sets
 * ────────────────────────────────────────────────────────────────────────── */

export interface CourseReaderLicence {
  title: string;
  /** May carry `{version}`; the trainer set's terms carry `{holder}`. */
  blurb: string;
  terms: readonly CourseGrant[];
}

/**
 * What each viewer is reading under.
 *
 * The three tones are the access card's vocabulary — a green check for what is
 * yours, a muted lock for what is deliberately someone else's, an amber lock for
 * what ends — so the reader and the record say the same things the same way.
 */
export const COURSE_READER_LICENCES: Record<CourseReaderLicenceSetId, CourseReaderLicence> = {
  owner: {
    title: 'Your content',
    blurb:
      'This is the learner-facing render of your published version {version}. Editing happens in the course builder — changes there re-enter review before learners see them.',
    terms: [
      { label: 'You own this material outright', tone: 'granted' },
      { label: 'Source files downloadable from the builder', tone: 'granted' },
      { label: 'Everyone else reads it under licence', tone: 'withheld' },
    ],
  },

  /*
   * The reader artboard draws four viewers and an admin is not one of them.
   * This row states the same terms the capability map's admin licence blurb
   * already sets out for the record, in the reader's shorter form.
   */
  admin: {
    title: 'Moderation access',
    blurb:
      'You are reading the published version to moderate it. Source files are not downloadable from here, and every open is written to the audit log against your admin account.',
    terms: [
      { label: 'Full read for moderation', tone: 'granted' },
      { label: 'Every open is written to the audit log', tone: 'withheld' },
      { label: 'Editing stays with the creator', tone: 'withheld' },
    ],
  },

  trainer: {
    title: 'Training licence',
    blurb:
      'You are approved to teach this course, so the full content is open while you prepare a session. Edits stay with the creator.',
    terms: [
      { label: 'Teach from it while approved', tone: 'granted' },
      { label: 'Watermarked with {holder}', tone: 'withheld' },
      { label: 'Ends if the creator withdraws approval', tone: 'locked' },
    ],
  },

  learner: {
    title: 'Your licence',
    blurb:
      'You are reading a published version of this course. Your progress is recorded as you go; the content itself belongs to the creator and cannot be changed here.',
    terms: [
      { label: 'Personal licence for the length of the course', tone: 'granted' },
      { label: 'Pages carry your name — no download', tone: 'withheld' },
      { label: 'Closes when your enrolment ends', tone: 'locked' },
    ],
  },
};

/** Fills `{holder}` when the caller names no licence holder. */
const DEFAULT_LICENCE_HOLDER = 'your account';

/* ────────────────────────────────────────────────────────────────────────────
 * Attachments
 * ────────────────────────────────────────────────────────────────────────── */

export interface CourseReaderAttachment {
  uuid: string;
  name: string;
  /** The chip, e.g. "PDF". Taken from the file name when absent. */
  extension?: string;
  /** Pre-formatted, e.g. "1.2 MB". */
  size?: string;
  /** A direct link, when the response carries one. */
  url?: string;
}

/**
 * Four buckets, four semantic tints. Fixed across every dashboard domain, which
 * is right for a mark that means "spreadsheet" rather than "brand".
 */
const ATTACHMENT_TONES = {
  sheet: 'bg-success/10 text-success',
  document: 'bg-destructive/10 text-destructive',
  image: 'bg-[var(--info)]/10 text-[var(--info)]',
  other: 'bg-muted text-muted-foreground',
} as const;

function attachmentTone(extension: string): keyof typeof ATTACHMENT_TONES {
  const token = extension.toLowerCase();
  if (/^(xls|xlsx|csv|ods|numbers)$/.test(token)) return 'sheet';
  if (/^(pdf|doc|docx|rtf|odt|txt|md)$/.test(token)) return 'document';
  if (/^(png|jpg|jpeg|gif|svg|webp|avif|heic)$/.test(token)) return 'image';
  return 'other';
}

/** "cable-schedule.v4.xlsx" → "XLSX". */
function attachmentExtension(attachment: CourseReaderAttachment): string {
  if (attachment.extension) return attachment.extension.toUpperCase();
  const tail = attachment.name.split('.').pop();
  return tail && tail !== attachment.name ? tail.toUpperCase() : 'FILE';
}

/* ────────────────────────────────────────────────────────────────────────────
 * Notes
 * ────────────────────────────────────────────────────────────────────────── */

export interface CourseReaderNote {
  body?: string;
  /** The tail of "Private to you · saved 2 days ago". */
  savedLabel?: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Block
 * ────────────────────────────────────────────────────────────────────────── */

export interface CourseReaderRailProps extends CourseBlockAsyncProps {
  /** The open lesson's objectives. */
  objectives?: readonly string[];
  attachments?: readonly CourseReaderAttachment[];

  /** Which licence to state. `null` renders no licence card. */
  licenceSet?: CourseReaderLicenceSetId | null;
  /** Overrides for the transcribed set — the organisation's wording, say. */
  licenceTitle?: string;
  licenceBlurb?: string;
  licenceTerms?: readonly CourseGrant[];
  /**
   * Fills the licence copy's tokens: `{holder}` for the trainer set's watermark
   * line and `{version}` for the creator's blurb.
   */
  licenceVars?: Record<string, string | number | null | undefined>;

  /** The viewer's private note on this item. Absent renders no notes card. */
  note?: CourseReaderNote;

  onOpenAttachment?: (attachment: CourseReaderAttachment) => void;
  className?: string;
}

export function CourseReaderRail({
  objectives,
  attachments,
  licenceSet,
  licenceTitle,
  licenceBlurb,
  licenceTerms,
  licenceVars,
  note,
  onOpenAttachment,
  loading,
  error,
  onRetry,
  className,
}: CourseReaderRailProps) {
  const licence = licenceSet ? COURSE_READER_LICENCES[licenceSet] : undefined;
  const vars = { holder: DEFAULT_LICENCE_HOLDER, ...licenceVars };
  const terms = licenceTerms ?? licence?.terms ?? [];
  const busy = Boolean(loading || error);

  return (
    <div className={cn('flex min-w-0 flex-col gap-3.5', className)}>
      {/* ── objectives ───────────────────────────────────────────────── */}
      {busy || (objectives && objectives.length > 0) ? (
        <RailCard title='Lesson objectives'>
          <AsyncSection
            loading={loading}
            error={error}
            onRetry={onRetry}
            skeleton={<LinesSkeleton rows={3} />}
            errorTitle='Couldn’t load the objectives'
          >
            <div className='flex flex-col gap-2'>
              {(objectives ?? []).map(objective => (
                <div
                  key={objective}
                  className='text-foreground/80 flex gap-2 text-[12.5px] leading-[1.5]'
                >
                  <Check
                    className='text-success mt-0.5 size-3.5 flex-none stroke-[2.6]'
                    aria-hidden
                  />
                  <span>{objective}</span>
                </div>
              ))}
            </div>
          </AsyncSection>
        </RailCard>
      ) : null}

      {/* ── attachments ──────────────────────────────────────────────── */}
      {busy || (attachments && attachments.length > 0) ? (
        <RailCard
          title='Attachments'
          meta={
            attachments === undefined
              ? undefined
              : `${attachments.length} file${attachments.length === 1 ? '' : 's'}`
          }
        >
          <AsyncSection
            loading={loading}
            error={error}
            onRetry={onRetry}
            skeleton={<AttachmentsSkeleton />}
            errorTitle='Couldn’t load the attachments'
          >
            <div className='flex flex-col gap-2'>
              {(attachments ?? []).map(attachment => (
                <AttachmentRow
                  key={attachment.uuid}
                  attachment={attachment}
                  onOpen={onOpenAttachment}
                />
              ))}
            </div>
          </AsyncSection>
        </RailCard>
      ) : null}

      {/* ── licence ──────────────────────────────────────────────────── */}
      {licence ? (
        <Card className='border-primary/30 bg-primary/10 gap-0 px-[17px] py-[15px]'>
          <div className='mb-2 flex items-center gap-2'>
            <Lock className='text-primary size-[15px] flex-none stroke-[1.9]' aria-hidden />
            <span className='text-[13px] font-bold'>{licenceTitle ?? licence.title}</span>
          </div>

          <p className='text-foreground/80 mb-2.5 text-[12.5px] leading-[1.55]'>
            {fillCourseCopy(licenceBlurb ?? licence.blurb, vars)}
          </p>

          <ul className='flex flex-col gap-[7px]'>
            {terms.map(term => (
              <li
                key={term.label}
                className={cn(
                  'flex items-start gap-2 text-xs leading-[1.45]',
                  courseGrantLabelClass(term.tone)
                )}
              >
                <CourseGrantIcon tone={term.tone} className='mt-px size-[13px]' />
                {fillCourseCopy(term.label, vars)}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* ── notes ────────────────────────────────────────────────────── */}
      {note ? (
        <RailCard title='Your notes'>
          <AsyncSection
            loading={loading}
            error={error}
            onRetry={onRetry}
            skeleton={<NoteSkeleton />}
            errorTitle='Couldn’t load your notes'
          >
            <div
              className={cn(
                'border-muted-foreground/30 bg-muted rounded-[11px] border border-dashed p-3 text-[12.5px] leading-[1.55]',
                note.body ? 'text-muted-foreground' : 'text-muted-foreground/70 italic'
              )}
            >
              {note.body || 'Nothing noted on this item yet.'}
            </div>
            <div className='text-muted-foreground/70 mt-2 text-[11px]'>
              {['Private to you', note.savedLabel].filter(Boolean).join(' · ')}
            </div>
          </AsyncSection>
        </RailCard>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pieces
 * ────────────────────────────────────────────────────────────────────────── */

function RailCard({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <Card className='gap-0 px-[17px] py-[15px]'>
      <div className='mb-[9px] flex items-center justify-between gap-2'>
        <span className='text-[13.5px] font-bold'>{title}</span>
        {meta ? <span className='text-muted-foreground text-[11.5px]'>{meta}</span> : null}
      </div>
      {children}
    </Card>
  );
}

function AttachmentRow({
  attachment,
  onOpen,
}: {
  attachment: CourseReaderAttachment;
  onOpen?: (attachment: CourseReaderAttachment) => void;
}) {
  const extension = attachmentExtension(attachment);
  const tone = ATTACHMENT_TONES[attachmentTone(extension)];

  const body = (
    <>
      <span
        className={cn(
          'inline-flex size-7 flex-none items-center justify-center rounded-[9px] text-[9.5px] font-extrabold tracking-[0.02em]',
          tone
        )}
        aria-hidden
      >
        {extension}
      </span>

      <span className='min-w-0 flex-1'>
        <span className='block truncate text-xs font-semibold'>{attachment.name}</span>
        {attachment.size ? (
          <span className='text-muted-foreground block text-[10.5px]'>{attachment.size}</span>
        ) : null}
      </span>

      <Download className='text-muted-foreground/70 size-3.5 flex-none stroke-[1.9]' aria-hidden />
    </>
  );

  const className =
    'flex min-h-11 w-full items-center gap-2.5 rounded-[11px] border px-2.5 py-2 text-left transition-colors xl:min-h-0';

  if (onOpen) {
    return (
      <button
        type='button'
        onClick={() => onOpen(attachment)}
        className={cn(className, 'hover:bg-muted/60')}
      >
        {body}
      </button>
    );
  }

  if (attachment.url) {
    return (
      <a href={attachment.url} className={cn(className, 'hover:bg-muted/60 no-underline')}>
        {body}
      </a>
    );
  }

  return <div className={className}>{body}</div>;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeletons
 * ────────────────────────────────────────────────────────────────────────── */

function LinesSkeleton({ rows }: { rows: number }) {
  return (
    <div className='flex flex-col gap-2'>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className='flex gap-2'>
          <Skeleton className='mt-0.5 size-3.5 flex-none rounded-full' />
          <Skeleton className='h-3 flex-1' />
        </div>
      ))}
    </div>
  );
}

function NoteSkeleton() {
  return (
    <>
      <Skeleton className='h-[62px] w-full rounded-[11px]' />
      <Skeleton className='mt-2 h-2.5 w-40' />
    </>
  );
}

function AttachmentsSkeleton() {
  return (
    <div className='flex flex-col gap-2'>
      {[0, 1, 2].map(row => (
        <div key={row} className='flex items-center gap-2.5 rounded-[11px] border px-2.5 py-2'>
          <Skeleton className='size-7 flex-none rounded-[9px]' />
          <div className='min-w-0 flex-1 space-y-1'>
            <Skeleton className='h-2.5 w-3/5' />
            <Skeleton className='h-2 w-16' />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The whole rail, for a caller skeletoning the column. */
export function CourseReaderRailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-3.5', className)}>
      <RailCard title='Lesson objectives'>
        <LinesSkeleton rows={3} />
      </RailCard>
      <RailCard title='Attachments'>
        <AttachmentsSkeleton />
      </RailCard>
    </div>
  );
}
