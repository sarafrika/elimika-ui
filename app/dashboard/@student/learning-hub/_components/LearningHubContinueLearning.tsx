'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { LearningHubClass } from './useStudentLearningHubData';

const buttonAccentClasses = {
  blue: 'bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_88%,black_8%),color-mix(in_srgb,var(--primary)_74%,black_18%))] text-white',
  green:
    'bg-[linear-gradient(180deg,color-mix(in_srgb,var(--success)_76%,black_6%),color-mix(in_srgb,var(--success)_68%,black_18%))] text-white',
  slate: 'border border-border/70 bg-background text-foreground',
};

type LearningHubContinueLearningProps = {
  classes: LearningHubClass[];
  loading?: boolean;
};

const INITIAL_VISIBLE_CLASSES = 6;

export function LearningHubContinueLearning({
  classes,
  loading = false,
}: LearningHubContinueLearningProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleClasses = useMemo(
    () => (showAll ? classes : classes.slice(0, INITIAL_VISIBLE_CLASSES)),
    [classes, showAll]
  );
  const hiddenClassCount = Math.max(0, classes.length - INITIAL_VISIBLE_CLASSES);

  return (
    <Card className='border-border/70 bg-background rounded-[18px] border p-3.5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-foreground text-[1.08rem] font-semibold'>Continue Learning</h2>
        <Link
          prefetch
          href='/dashboard/learning-hub/classes' className='inline-flex items-center gap-1 text-[0.82rem] font-medium text-primary transition hover:text-primary/80'
        >
          View all classes
          <ChevronRight className='size-4' />
        </Link>
      </div>

      <div className='mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3'>
        {loading
          ? Array.from({ length: INITIAL_VISIBLE_CLASSES }).map((_, index) => (
            <article
              key={`learning-course-skeleton-${index}`}
              className='space-y-2 rounded-[10px]'
            >
              <Skeleton className='h-[86px] rounded-[8px]' />
              <div className='space-y-2'>
                <Skeleton className='h-4 w-4/5' />
                <Skeleton className='h-3 w-20' />
              </div>
              <div className='flex items-center gap-1.5'>
                {Array.from({ length: 4 }).map((__, dotIndex) => (
                  <Skeleton key={dotIndex} className='size-2 rounded-full' />
                ))}
              </div>
              <Skeleton className='h-9 w-full rounded-[8px]' />
            </article>
          ))
          : visibleClasses.map(classItem => (
            <article key={classItem.id} className='space-y-2 rounded-[10px]'>
              <div className='border-border/60 h-[86px] overflow-hidden rounded-[8px] border'>
                {classItem.bannerUrl ? (
                  <img
                    src={classItem.bannerUrl}
                    alt={classItem.title}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='text-muted-foreground flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,white),white)] text-xs'>
                    No image
                  </div>
                )}
              </div>
              <div>
                <h3 className='text-foreground truncate text-[0.95rem] font-semibold'>
                  {classItem.title}
                </h3>
                <p className='text-muted-foreground mt-1 truncate text-[0.72rem]'>
                  {classItem.courseName}
                </p>
              </div>
              <div className='text-muted-foreground flex items-center justify-between gap-2 text-[0.7rem]'>
                <span>{classItem.statusLabel}</span>
                <span className='truncate'>{classItem.scheduleLabel}</span>
              </div>
              <div className='flex items-center gap-1.5'>
                {[0, 1, 2, 3].map(index => (
                  <span
                    key={`${classItem.id}-${index}`}
                    className={`size-2 rounded-full ${index < Math.max(1, Math.round(classItem.progress / 25))
                      ? 'bg-[color:color-mix(in_srgb,var(--primary)_52%,white)]'
                      : 'bg-muted'
                      }`}
                  />
                ))}
              </div>
              <Link
                prefetch
                href={classItem.href}
                className={`inline-flex w-full items-center justify-center rounded-[8px] px-3 py-2 text-[0.78rem] font-medium transition hover:opacity-95 ${buttonAccentClasses[classItem.accent]}`}
              >
                {classItem.ctaLabel}
              </Link>
            </article>
          ))}
      </div>

      {!loading && classes.length === 0 && (
        <div className='border-border/80 bg-muted/30 mt-4 rounded-[10px] border border-dashed p-5 text-center'>
          <p className='text-foreground text-sm font-medium'>No enrolled classes yet</p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Enrolled classes will appear here when they are added to your schedule.
          </p>
        </div>
      )}

      {!loading && hiddenClassCount > 0 && !showAll && (
        <div className='mt-4 flex justify-center'>
          <Button variant='outline' size='sm' onClick={() => setShowAll(true)}>
            Show more classes
          </Button>
        </div>
      )}
    </Card>
  );
}
