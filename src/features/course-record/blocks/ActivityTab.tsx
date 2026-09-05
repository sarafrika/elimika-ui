import { AsyncSection } from '@/components/data/async-section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { type CourseAccess, type CourseBlockAsyncProps, hasTab } from '../types';
import { COURSE_PLACEHOLDER, formatCourseDate } from './_shared';

/**
 * The activity tab — every publish, edit-diff and admin decision on the record,
 * as one vertical timeline.
 *
 * ## Who sees it
 *
 * The capability map, and only the capability map: `tabs` includes `activity`
 * for the creator and platform admins and for nobody else, so the gate is
 * {@link hasTab} rather than a comparison against the viewer's domain.
 *
 * ## The dots
 *
 * The artboard marks entries in three hues, two of which are dashboard brand
 * hues — the same `--primary` seen through two different domains. So the tone
 * vocabulary here is semantic rather than literal: `primary` follows the
 * dashboard, `success`/`warning`/`destructive` are fixed everywhere, and
 * `muted` is for an entry that is merely noted. The route picks the tone; this
 * block never infers one from the wording of a title.
 */

/** How an entry is marked. Semantic, so it survives the domain re-hue. */
export type CourseActivityTone = 'primary' | 'success' | 'warning' | 'destructive' | 'muted';

/** One entry on the record's history. */
export interface CourseActivityEvent {
  id: string;
  title: string;
  /** ISO date, or a string already formatted for display. */
  date?: string;
  /** The line under it — what changed, and who decided it. */
  detail?: string;
  /** Defaults to `primary`. */
  tone?: CourseActivityTone;
}

const ACTIVITY_DOT_TONE: Record<CourseActivityTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground/40',
};

export interface ActivityTabProps extends CourseBlockAsyncProps {
  /** From the API. The capability map decides whether this tab exists at all. */
  access: CourseAccess;
  /** Newest first — the order the timeline reads in. */
  events?: readonly CourseActivityEvent[];
  className?: string;
}

export function ActivityTab({
  access,
  events,
  loading,
  error,
  onRetry,
  className,
}: ActivityTabProps) {
  if (!hasTab(access, 'activity')) return null;

  const rows = events ?? [];

  return (
    <Card className={cn('gap-0 px-5 py-[18px]', className)}>
      <h3 className='text-[15px] font-bold tracking-tight'>Versions &amp; moderation</h3>
      <p className='text-muted-foreground mt-[3px] mb-4 text-[12.5px] leading-[1.45]'>
        Every publish, edit-diff and admin decision on this course record.
      </p>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={rows.length === 0}
        skeleton={<TimelineSkeleton />}
        errorTitle='Couldn’t load the course history'
        emptyTitle='Nothing recorded yet'
        emptyDescription='Publishes, edit diffs and moderation decisions are listed here as they happen.'
      >
        <ol className='relative list-none pl-[22px]'>
          {/* The spine, inset to run through the middle of every dot. */}
          <span
            aria-hidden
            className='bg-muted absolute top-1.5 bottom-1.5 left-[5px] w-0.5 rounded-full'
          />

          {rows.map(event => (
            <li key={event.id} className='relative pb-[18px] last:pb-0'>
              <span
                aria-hidden
                className={cn(
                  'border-card ring-border absolute top-1 -left-[22px] size-3 rounded-full border-2 ring-1',
                  ACTIVITY_DOT_TONE[event.tone ?? 'primary']
                )}
              />
              <div className='flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5'>
                <span className='text-[13.5px] font-semibold'>{event.title}</span>
                <span className='text-muted-foreground text-[11.5px]'>
                  {formatEventDate(event.date)}
                </span>
              </div>
              {event.detail ? (
                <div className='text-muted-foreground mt-[3px] text-[12.5px] leading-[1.45]'>
                  {event.detail}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </AsyncSection>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skeleton
 * ────────────────────────────────────────────────────────────────────────── */

export function ActivityTabSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('gap-0 px-5 py-[18px]', className)}>
      <Skeleton className='h-4 w-44' />
      <Skeleton className='mt-2.5 mb-4 h-3 w-80 max-w-full' />
      <TimelineSkeleton />
    </Card>
  );
}

function TimelineSkeleton() {
  return (
    <div className='relative pl-[22px]'>
      <span className='bg-muted absolute top-1.5 bottom-1.5 left-[5px] w-0.5 rounded-full' />
      {[0, 1, 2, 3, 4].map(row => (
        <div key={row} className='relative pb-[18px] last:pb-0'>
          <Skeleton className='absolute top-1 -left-[22px] size-3 rounded-full' />
          <div className='flex items-baseline gap-2.5'>
            <Skeleton className='h-3.5 w-44 max-w-full' />
            <Skeleton className='h-2.5 w-20 flex-none' />
          </div>
          <Skeleton className='mt-2 h-3 w-72 max-w-full' />
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Formatting
 * ────────────────────────────────────────────────────────────────────────── */

/** Routes may hand over an ISO date or one already formatted; both render. */
function formatEventDate(value: string | undefined): string {
  if (!value) return COURSE_PLACEHOLDER;
  return formatCourseDate(value) ?? value;
}
