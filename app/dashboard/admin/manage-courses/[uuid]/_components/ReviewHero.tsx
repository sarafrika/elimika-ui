'use client';

import { BookOpen, CalendarDays, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Course } from '@/services/client';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { StatusBadge } from '../../../_components/ui/StatusBadge';

function formatDate(value?: Date | string | null): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ReviewHero({ course, creatorName }: { course: Course; creatorName?: string }) {
  const banner = course.banner_url ? toAuthenticatedMediaUrl(course.banner_url) || course.banner_url : undefined;
  const thumb = course.thumbnail_url
    ? toAuthenticatedMediaUrl(course.thumbnail_url) || course.thumbnail_url
    : undefined;
  const approved = course.admin_approved === true;

  return (
    <header className='relative overflow-hidden rounded-md border border-border/70 bg-card shadow-sm'>
      {/* Banner backdrop */}
      <div className='relative h-40 w-full bg-gradient-to-r from-primary/15 via-muted/60 to-muted/30 sm:h-48'>
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt='' className='h-full w-full object-cover' />
        ) : null}
        <div className='absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent' />
      </div>

      <div className='relative -mt-12 flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end'>
        <div className='flex h-28 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 bg-muted/40 shadow-md'>
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt='' className='h-full w-full object-cover' />
          ) : (
            <BookOpen className='size-8 text-muted-foreground' />
          )}
        </div>

        <div className='min-w-0 flex-1 space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <StatusBadge status={course.status} />
            <StatusBadge
              tone={approved ? 'success' : 'warning'}
              label={approved ? 'Admin approved' : 'Awaiting approval'}
            />
          </div>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
            {course.name}
          </h1>
          <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground'>
            <span className='inline-flex items-center gap-1.5'>
              <UserRound className='size-4' />
              {creatorName ?? 'Course creator'}
            </span>
            <span className='inline-flex items-center gap-1.5'>
              <CalendarDays className='size-4' />
              Created {formatDate(course.created_date)}
            </span>
            {course.updated_date ? (
              <span className='inline-flex items-center gap-1.5'>Updated {formatDate(course.updated_date)}</span>
            ) : null}
          </div>
          {course.category_names?.length ? (
            <div className='flex flex-wrap items-center gap-1.5'>
              {course.category_names.map(category => (
                <Badge key={category} variant='secondary' className='rounded-md text-xs'>
                  {category}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
