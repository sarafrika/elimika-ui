import { BookOpen } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface CourseRailItem {
  id: string | number;
  name: string;
  subtitle?: string;
  category?: string;
  metaLeft?: string;
  metaRight?: string;
  href?: string;
}

/**
 * Horizontal, scroll-snapping rail of course cards ported from the Lovable
 * dashboard. Presentational — data comes from a container via `items`.
 */
export function CourseRail({
  items,
  title = 'Active courses',
  viewAllHref,
  className,
}: {
  items: CourseRailItem[];
  title?: string;
  viewAllHref?: string;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>{title}</h3>
        {viewAllHref && (
          <Button asChild variant='link' size='sm' className='h-auto px-0 text-primary'>
            <Link href={viewAllHref}>View all</Link>
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground'>
            <BookOpen className='h-5 w-5' />
          </div>
          <p className='text-sm text-muted-foreground'>No active courses yet.</p>
        </div>
      ) : (
        <div className='-mx-1 overflow-x-auto px-1 pb-2'>
          <div className='flex snap-x gap-3'>
            {items.map(course => (
              <CourseRailCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CourseRailCard({ course }: { course: CourseRailItem }) {
  const inner = (
    <div className='w-60 shrink-0 snap-start rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md 2xl:w-72'>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 font-semibold text-teal-600 dark:bg-teal-950/50 dark:text-teal-300'>
            {course.name.slice(0, 2).toUpperCase()}
          </div>
          <div className='min-w-0'>
            <p className='truncate text-sm font-semibold'>{course.name}</p>
            {course.subtitle && (
              <p className='truncate text-xs text-muted-foreground'>{course.subtitle}</p>
            )}
          </div>
        </div>
        {course.category && (
          <Badge variant='outline' className='shrink-0 text-xs'>
            {course.category}
          </Badge>
        )}
      </div>
      <div className='mt-4 flex items-center justify-between text-xs text-muted-foreground'>
        <span>{course.metaLeft}</span>
        {course.metaRight && <span className='font-medium text-teal-600'>{course.metaRight}</span>}
      </div>
    </div>
  );
  return course.href ? (
    <Link href={course.href} className='block focus-visible:outline-none'>
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function CourseRailSkeleton({ cards = 5 }: { cards?: number }) {
  return (
    <section className='space-y-4'>
      <Skeleton className='h-5 w-32' />
      <div className='-mx-1 overflow-x-auto px-1 pb-2'>
        <div className='flex gap-4'>
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className='w-64 shrink-0 rounded-xl border bg-card p-4 shadow-sm 2xl:w-72'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-10 w-10 rounded-lg' />
                <div className='flex-1 space-y-1.5'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-3 w-16' />
                </div>
              </div>
              <Skeleton className='mt-4 h-3 w-full' />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
