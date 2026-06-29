'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cn } from '../../../../../lib/utils';
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '../../../../../src/lib/media-url';
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
    <Card className='border-border/70 bg-background rounded-sm border p-3.5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-foreground text-[1.08rem] font-semibold'>Continue Learning</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {loading
          ? Array.from({ length: INITIAL_VISIBLE_CLASSES }).map((_, index) => (
            <article
              key={`learning-course-skeleton-${index}`}
              className="space-y-2 rounded-[10px]"
            >
              <Skeleton className="h-[86px] rounded-[8px]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 4 }).map((__, dotIndex) => (
                  <Skeleton key={dotIndex} className="size-2 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-9 w-full rounded-[8px]" />
            </article>
          ))
          : visibleClasses.map(classItem => {
            const isCompleted = classItem.progress === 100;

            return (
              <article
                key={classItem.id}
                className={cn(
                  "flex flex-col gap-2 rounded-sm p-3 transition-colors",
                  isCompleted && "bg-success/10"
                )}
              >
                <div className="space-y-1">
                  <div className="h-[150px] border overflow-hidden rounded-sm">
                    {classItem?.bannerUrl ? (
                      <Image
                        src={
                          toAuthenticatedMediaUrl(classItem?.bannerUrl) ||
                          classItem?.bannerUrl
                        }
                        alt="Course banner"
                        className="h-full w-full object-cover"
                        priority
                        width={400}
                        height={200}
                        unoptimized={isAuthenticatedMediaUrl(
                          toAuthenticatedMediaUrl(classItem?.bannerUrl)
                        )}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,white),white)] text-muted-foreground text-xs">
                        <BookOpen size={32} />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="truncate text-[0.95rem] font-semibold text-foreground">
                      {classItem.title}
                    </h3>

                    <p className="mt-1 truncate text-[0.72rem] text-muted-foreground">
                      {classItem.courseName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[0.7rem]">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 font-medium text-success">
                        <CheckCircle2 className="size-3.5" />
                        Class Completed
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {classItem.statusLabel}
                      </span>
                    )}

                    <span className="truncate text-muted-foreground">
                      {classItem.scheduleLabel}
                    </span>
                  </div>

                  {!isCompleted && (
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3].map(index => (
                        <span
                          key={`${classItem.id}-${index}`}
                          className={cn(
                            "size-2 rounded-full",
                            index <
                              Math.max(
                                1,
                                Math.round(classItem.progress / 25)
                              )
                              ? "bg-primary"
                              : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {isCompleted && (
                    <div className="rounded-md bg-background/60 px-3 py-2">
                      <p className="text-[0.72rem] text-muted-foreground">
                        All sessions completed successfully.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <Link
                      prefetch
                      href={`/dashboard/learning-hub/${classItem.id}`}
                      className="inline-flex w-full items-center justify-center rounded-[8px] bg-primary px-3 py-2 text-[0.78rem] font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                      View Details
                    </Link>
                  ) : (
                    <>
                      <Link
                        prefetch
                        href={`/dashboard/learning-hub/classes/${classItem.id}`}
                        className={cn(
                          "inline-flex flex-1 items-center justify-center rounded-[8px] bg-primary px-3 py-2 text-[0.78rem] font-medium text-primary-foreground transition hover:opacity-95",
                          buttonAccentClasses[classItem.accent]
                        )}
                      >
                        {classItem.ctaLabel}
                      </Link>

                      <Link
                        prefetch
                        href={`/dashboard/learning-hub/${classItem.id}`}
                        className="inline-flex flex-1 items-center justify-center rounded-[8px] border border-border px-3 py-2 text-[0.78rem] font-medium text-muted-foreground transition hover:bg-muted"
                      >
                        View Details
                      </Link>
                    </>
                  )}
                </div>
              </article>
            );
          })}
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
