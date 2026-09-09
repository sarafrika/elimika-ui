import { cn } from '@/lib/utils';
import {
  TONE_DOTS,
  TONE_INK,
  TONE_WASH,
  toneFor,
} from '@/src/features/marketing/components/discipline-tone';
import { DISPLAY } from '@/src/features/marketing/components/display-font';
import type { HomeCourseCard as HomeCourseCardModel } from '@/src/features/marketing/server';
import { Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function HomeCourseCard({ course }: { course: HomeCourseCardModel }) {
  return (
    <Link
      href={course.href}
      className={cn(
        toneFor(course.primaryCategory),
        'group border-border bg-card focus-visible:ring-ring/50 flex h-full flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:outline-none'
      )}
    >
      <div className={cn(TONE_WASH, 'relative flex h-[116px] items-end p-3')}>
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt=''
            fill
            sizes='(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw'
            className='object-cover transition duration-500 group-hover:scale-[1.03]'
          />
        ) : (
          <span className={cn(TONE_DOTS, 'absolute inset-0')} aria-hidden='true' />
        )}
        {course.primaryCategory ? (
          <span
            className={cn(
              course.thumbnailUrl ? 'text-foreground' : TONE_INK,
              'bg-card relative inline-flex h-6 max-w-full items-center truncate rounded-full px-2.5 text-[11.5px] font-bold'
            )}
          >
            {course.primaryCategory}
          </span>
        ) : null}
      </div>

      <div className='flex flex-1 flex-col p-4'>
        {course.tags.length > 0 ? (
          <p className='text-muted-foreground mb-2 flex flex-wrap items-center gap-x-1.5 text-[11.5px] font-semibold'>
            {course.tags.map((tag, index) => (
              <span key={tag} className='flex items-center gap-x-1.5'>
                {index > 0 ? <span aria-hidden='true'>·</span> : null}
                <span className='truncate'>{tag}</span>
              </span>
            ))}
          </p>
        ) : null}

        <h3
          className={cn(
            DISPLAY,
            'text-foreground mb-2 line-clamp-2 min-h-[2.5em] text-[16.5px] leading-[1.25] font-bold tracking-tight'
          )}
        >
          {course.title}
        </h3>

        {course.durationLabel ? (
          <p className='text-muted-foreground mb-3 flex items-center gap-2 text-[12.5px]'>
            <Clock className='size-3.5 shrink-0' aria-hidden='true' />
            <span className='truncate'>{course.durationLabel}</span>
          </p>
        ) : null}

        <div className='border-muted mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3'>
          <span className={cn(DISPLAY, 'text-foreground text-base font-bold tracking-tight')}>
            {course.priceLabel}
          </span>
          <span className='text-primary text-[13px] font-semibold group-hover:underline'>
            View course
          </span>
        </div>
      </div>
    </Link>
  );
}
