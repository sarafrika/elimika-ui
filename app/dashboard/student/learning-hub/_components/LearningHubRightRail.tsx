'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { LearningHubRecommendedCourse } from './useStudentLearningHubData';

type LearningHubRightRailProps = {
  recommendedCourses: LearningHubRecommendedCourse[];
  loading?: boolean;
};

export function LearningHubRightRail({
  recommendedCourses,
  loading = false,
}: LearningHubRightRailProps) {
  const [visibleRecommendations, setVisibleRecommendations] = useState(3);
  const recommendationPlaceholders: LearningHubRecommendedCourse[] = [
    { id: 'placeholder-1', title: '', level: '', duration: '' },
    { id: 'placeholder-2', title: '', level: '', duration: '' },
    { id: 'placeholder-3', title: '', level: '', duration: '' },
  ];

  const displayedRecommendations = useMemo(
    () => recommendedCourses.slice(0, visibleRecommendations),
    [recommendedCourses, visibleRecommendations]
  );
  const hasMoreRecommendations = displayedRecommendations.length < recommendedCourses.length;

  const hasPath = false;

  return (
    <aside className='space-y-3'>
      <Card className='border-border/70 bg-background rounded-[18px] border p-3 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-foreground text-[1rem] font-semibold'>Class Invites</h2>

          <span className='border-border/70 bg-muted/40 text-muted-foreground inline-flex items-center rounded-full border px-2.5 py-1 text-[0.72rem] font-medium'>
            0
          </span>
        </div>
        <div className='border-border/70 bg-background rounded-[12px] border border-dashed p-5 text-center'>
          <p className='text-foreground text-sm font-medium'>No class invites yet</p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Invite data will appear here once the endpoint is available.
          </p>
        </div>
      </Card>

      <Card className='border-border/70 bg-background rounded-[18px] border p-3 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <h2 className='text-foreground text-[1rem] font-semibold'>Recommended Pathways</h2>
        <div className='border-border/70 bg-background rounded-[12px] border p-3'>
          {loading ? (
            <>
              <div className='flex gap-3'>
                <Skeleton className='size-10 rounded-full' />
                <div className='min-w-0 flex-1 space-y-2'>
                  <Skeleton className='h-5 w-36' />
                  <Skeleton className='h-4 w-20' />
                </div>
              </div>
              <Skeleton className='mt-3 h-4 w-32' />
              <Skeleton className='mt-4 h-9 w-full rounded-[8px]' />
            </>
          ) : (
            <>
              <div className='flex gap-3'>
                <div className='grid size-10 place-items-center rounded-full bg-[linear-gradient(135deg,color-mix(in_srgb,var(--success)_76%,black_6%),color-mix(in_srgb,var(--success)_56%,white_26%))] text-white'>
                  ✦
                </div>

                <div className='min-w-0'>
                  {hasPath ? (
                    <>
                      <h3 className='text-foreground text-[0.95rem] leading-tight font-semibold'>
                        Discover Career Paths
                      </h3>
                      <p className='text-muted-foreground mt-1 text-[0.72rem]'>Advanced</p>
                    </>
                  ) : (
                    <>
                      <h3 className='text-foreground text-[0.95rem] leading-tight font-semibold'>
                        No career path yet
                      </h3>
                      <p className='text-muted-foreground mt-1 text-[0.72rem]'>
                        Start by exploring recommended paths
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className='text-muted-foreground mt-3 flex items-center gap-2 text-[0.72rem]'>
                {hasPath ? (
                  <>
                    <span>4 Steps Completed</span>
                    <span className='bg-border size-1 rounded-full' />
                    <span>14 h</span>
                  </>
                ) : (
                  <>
                    <span>0 Steps Completed</span>
                    <span className='bg-border size-1 rounded-full' />
                    <span>—</span>
                  </>
                )}
              </div>

              {hasPath ? (
                <Link
                  prefetch
                  href='/dashboard/student/courses'
                  className='mt-4 inline-flex w-full items-center justify-center rounded-[8px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_88%,black_8%),color-mix(in_srgb,var(--primary)_74%,black_18%))] px-4 py-2 text-[0.78rem] font-medium text-white transition hover:opacity-95'
                >
                  Resume
                </Link>
              ) : (
                <Link
                  prefetch
                  href='/dashboard/student/courses'
                  className='text-primary mt-4 inline-flex w-full items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--primary)_12%,white)] px-4 py-2 text-[0.78rem] font-medium transition hover:opacity-95'
                >
                  Explore Paths
                </Link>
              )}
            </>
          )}
        </div>
      </Card>

      <Card className='border-border/70 bg-background rounded-[18px] border p-3 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <div className='flex flex-row items-center justify-between'>
          <h2 className='text-foreground text-[1rem] font-semibold'>Recommended Courses</h2>
          <Link
            prefetch
            href='/dashboard/student/courses'
            className='bg-background text-muted-foreground hover:text-primary inline-flex items-center justify-center gap-1 px-4 py-2 text-[0.78rem] font-medium transition'
          >
            See All {recommendedCourses.length}
            <ChevronRight className='size-4' />
          </Link>
        </div>
        <div className='space-y-3'>
          {(loading ? recommendationPlaceholders : displayedRecommendations).map(course => (
            <div
              key={course.id}
              className='border-border/50 flex items-start gap-3 rounded-[10px] border p-2.5'
            >
              {loading ? (
                <>
                  <Skeleton className='size-8 rounded-full' />
                  <div className='min-w-0 flex-1 space-y-2'>
                    <Skeleton className='h-4 w-4/5' />
                    <Skeleton className='h-3 w-24' />
                  </div>
                </>
              ) : (
                <Link
                  href={`/dashboard/student/learning-hub/classes/${course?.id}`}
                  className='flex w-full min-w-0 flex-row items-center gap-3'
                >
                  <div className='text-primary grid size-8 place-items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,white)]'>
                    ⊕
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h3 className='text-foreground truncate text-[0.9rem] font-semibold'>
                      {course.title}
                    </h3>
                    <div className='text-muted-foreground mt-1 flex items-center gap-2 text-[0.72rem]'>
                      <span>{course.level}</span>
                      <span className='bg-border size-1 rounded-full' />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>

        {hasMoreRecommendations && !loading ? (
          <button
            type='button'
            onClick={() => setVisibleRecommendations(current => current + 3)}
            className='border-border/70 text-foreground hover:border-primary/40 hover:text-primary mt-3 inline-flex w-full items-center justify-center rounded-[10px] border px-4 py-2 text-[0.8rem] font-medium transition'
          >
            See More Recommended Courses
          </button>
        ) : null}
      </Card>
    </aside>
  );
}
