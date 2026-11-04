'use client';

import { CalendarDays, Clock, GraduationCap, MapPin, Video } from 'lucide-react';
import Link from 'next/link';
import { ImageWithFallback } from '@/components/data/image-with-fallback';
import { statusToneClass } from '@/components/data-display/tone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DistanceBandBadge } from '@/src/features/near-me/near-me-control';
import { type ClassCardFacts, formatKes, startChip } from './class-card-facts';

const MODE_LABEL: Record<string, string> = { ONLINE: 'Online', IN_PERSON: 'In person', HYBRID: 'Hybrid' };

function initials(name: string | undefined) {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

/** One class in Find classes, in the course catalogue card style: cover, facts, full price, actions. */
export function ClassCard({
  title,
  courseName,
  trainer,
  thumbnailUrl,
  locationType,
  facts,
  band,
  href,
}: {
  title: string;
  courseName?: string;
  trainer?: string;
  thumbnailUrl?: string | null;
  locationType?: string;
  facts: ClassCardFacts;
  band?: string;
  href: string | null;
}) {
  const mode = MODE_LABEL[locationType?.toUpperCase() ?? ''] ?? 'Class';
  const status = facts.closed
    ? { label: facts.closedReason === 'ended' ? 'Ended' : 'Closed', tone: statusToneClass.neutral }
    : facts.closingSoon
      ? { label: 'Closing soon', tone: statusToneClass.warning }
      : { label: 'Open', tone: statusToneClass.success };
  const taken =
    facts.capacity && facts.seatsLeft != null ? Math.min(100, ((facts.capacity - facts.seatsLeft) / facts.capacity) * 100) : null;
  const fewSeats = facts.seatsLeft != null && facts.seatsLeft <= 3 && !facts.closed;

  return (
    <article
      className={cn(
        'group border-border bg-card flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        facts.closed && 'opacity-80'
      )}
    >
      <div className='relative shrink-0'>
        <div className='bg-muted relative aspect-[16/10] w-full overflow-hidden'>
          <ImageWithFallback
            src={thumbnailUrl}
            alt=''
            fill
            sizes='(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw'
            className='object-cover transition-transform duration-500 group-hover:scale-105'
            fallback={
              <div
                aria-hidden
                className={cn(
                  'absolute inset-0 flex items-center justify-center bg-gradient-to-br',
                  facts.closed ? 'from-muted-foreground/40 to-muted' : 'from-primary/70 via-primary/40 to-primary/10'
                )}
              >
                <span className='bg-card/15 absolute -top-12 -right-10 size-44 rounded-full' />
                <span className='bg-card/10 absolute -bottom-9 -left-6 size-28 rotate-[18deg] rounded-[32px]' />
                <GraduationCap className='text-primary-foreground/60 relative size-14' />
              </div>
            }
          />
          <span className='bg-card/95 text-foreground absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm'>
            <CalendarDays aria-hidden className='text-primary size-3.5' />
            {startChip(facts.firstStart)}
          </span>
          <span className={cn('absolute top-3 right-3 rounded-full border px-2.5 py-0.5 text-xs font-semibold', status.tone)}>
            {status.label}
          </span>
        </div>
        <div className='ring-card bg-primary text-primary-foreground absolute -bottom-5 left-4 flex size-11 items-center justify-center rounded-full shadow-md ring-4'>
          <GraduationCap aria-hidden className='size-5' />
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-3 p-4 pt-7'>
        <div className='min-w-0'>
          <div className='flex items-start justify-between gap-2'>
            <h3 className='line-clamp-2 min-w-0 text-base leading-snug font-semibold'>{title}</h3>
            <span className='bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase'>
              {mode}
            </span>
          </div>
          {courseName ? <p className='text-muted-foreground mt-1 line-clamp-1 text-xs'>{courseName}</p> : null}
        </div>

        {trainer ? (
          <div className='flex min-w-0 items-center gap-2'>
            <span className='bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold'>
              {initials(trainer)}
            </span>
            <span className='text-foreground min-w-0 truncate text-xs font-medium'>{trainer}</span>
            <DistanceBandBadge band={band} className='ml-auto rounded-md' />
          </div>
        ) : band ? (
          <DistanceBandBadge band={band} className='self-start rounded-md' />
        ) : null}

        <div className='text-muted-foreground grid gap-1.5 text-[13px]'>
          <span className='flex min-w-0 items-center gap-2'>
            <Clock aria-hidden className='size-4 shrink-0' />
            <span className='truncate'>{facts.schedule}</span>
          </span>
          <span className='flex min-w-0 items-center gap-2'>
            {facts.online ? <Video aria-hidden className='size-4 shrink-0' /> : <MapPin aria-hidden className='size-4 shrink-0' />}
            <span className='truncate'>{facts.where}</span>
          </span>
        </div>

        {facts.seatsLeft != null && facts.capacity ? (
          <div className='flex flex-col gap-1.5'>
            <div className='flex justify-between text-xs'>
              <span className={cn('font-semibold', fewSeats ? 'text-warning' : 'text-foreground')}>
                {facts.closed
                  ? 'Not taking enrolments'
                  : facts.seatsLeft === 0
                    ? 'Full'
                    : `${fewSeats ? 'Only ' : ''}${facts.seatsLeft} seat${facts.seatsLeft === 1 ? '' : 's'} left`}
              </span>
              <span className='text-muted-foreground tabular-nums'>
                {facts.capacity - facts.seatsLeft} of {facts.capacity} taken
              </span>
            </div>
            <div aria-hidden className='bg-muted h-1.5 overflow-hidden rounded-full'>
              <div
                className={cn('h-1.5 rounded-full', fewSeats ? 'bg-warning' : 'bg-primary')}
                style={{ width: `${taken ?? 0}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className='border-border/60 flex items-end justify-between gap-2 border-t pt-3'>
          <span className='text-muted-foreground text-xs'>{facts.breakdown ?? 'Full class price'}</span>
          <span className='text-lg font-extrabold tracking-tight tabular-nums'>{formatKes(facts.total)}</span>
        </div>

        <div className='mt-auto grid gap-2 pt-1'>
          {facts.closed ? (
            <Button variant='outline' disabled>
              Registration closed
            </Button>
          ) : href ? (
            <>
              <Button asChild>
                <Link href={href}>Join class</Link>
              </Button>
              <Button asChild variant='outline'>
                <Link href={href}>View details</Link>
              </Button>
            </>
          ) : (
            <span className='text-muted-foreground text-center text-xs'>Join through its programme</span>
          )}
        </div>
      </div>
    </article>
  );
}
