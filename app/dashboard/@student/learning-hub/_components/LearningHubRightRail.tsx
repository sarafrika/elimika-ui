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

  return (
    <aside className='space-y-3'>
      <Card className='rounded-[18px] border border-border/70 bg-background p-3 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <h2 className='text-[1rem] font-semibold text-foreground'>Recommended Pathways</h2>
        <div className='mt-3 rounded-[12px] border border-border/70 bg-background p-3'>
          {loading ? (
            <>
              <Skeleton className='h-[118px] rounded-[10px]' />
              <Skeleton className='mt-3 h-5 w-40' />
              <Skeleton className='mt-2 h-4 w-24' />
              <Skeleton className='mt-4 h-9 w-full rounded-[8px]' />
            </>
          ) : (
            <>
              <div className='h-[118px] rounded-[10px] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,white),white)]' />
              <h3 className='mt-3 text-[1rem] font-semibold text-foreground'>Discover Career Paths</h3>
              <div className='mt-2 flex items-center gap-2 text-[0.72rem] text-muted-foreground'>
                <span>Advanced</span>
                <span className='size-1 rounded-full bg-border' />
                <span>7 - 2; 14 h</span>
              </div>
              <Link
                prefetch
                href='/dashboard/courses'
                className='mt-4 inline-flex w-full items-center justify-center rounded-[8px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_88%,black_8%),color-mix(in_srgb,var(--primary)_74%,black_18%))] px-4 py-2 text-[0.78rem] font-medium text-white transition hover:opacity-95'
              >
                Start
              </Link>
            </>
          )}
        </div>
      </Card>

      <Card className='rounded-[18px] border border-border/70 bg-background p-3 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <h2 className='text-[1rem] font-semibold text-foreground'>Recommended Pathways</h2>
        <div className='mt-3 rounded-[12px] border border-border/70 bg-background p-3'>
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
                  <h3 className='text-[0.95rem] font-semibold leading-tight text-foreground'>
                    Discover Career Paths
                  </h3>
                  <p className='mt-1 text-[0.72rem] text-muted-foreground'>Advanced</p>
                </div>
              </div>
              <div className='mt-3 flex items-center gap-2 text-[0.72rem] text-muted-foreground'>
                <span>4 Steps Completed</span>
                <span className='size-1 rounded-full bg-border' />
                <span>14 h</span>
              </div>
              <Link
                prefetch
                href='/dashboard/courses'
                className='mt-4 inline-flex w-full items-center justify-center rounded-[8px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_88%,black_8%),color-mix(in_srgb,var(--primary)_74%,black_18%))] px-4 py-2 text-[0.78rem] font-medium text-white transition hover:opacity-95'
              >
                Resume
              </Link>
            </>
          )}
        </div>
      </Card>

      <Card className='rounded-[18px] border border-border/70 bg-background p-3 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <div className='flex flex-row items-center justify-between' >
          <h2 className='text-[1rem] font-semibold text-foreground'>Recommended Courses</h2>
          <Link
            prefetch
            href='/dashboard/workspace/student/courses'
            className='inline-flex items-center justify-center gap-1 bg-background px-4 py-2 text-[0.78rem] font-medium text-muted-foreground transition hover:text-primary'
          >
            See All {recommendedCourses.length}
            <ChevronRight className='size-4' />
          </Link>
        </div>
        <div className='mt-3 space-y-3'>
          {(loading ? recommendationPlaceholders : displayedRecommendations).map(course => (
            <div
              key={course.id}
              className='flex items-start gap-3 rounded-[10px] border border-border/50 p-2.5'
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
                <>
                  <div className='grid size-8 place-items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,white)] text-primary'>
                    ⊕
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h3 className='truncate text-[0.9rem] font-semibold text-foreground'>{course.title}</h3>
                    <div className='mt-1 flex items-center gap-2 text-[0.72rem] text-muted-foreground'>
                      <span>{course.level}</span>
                      <span className='size-1 rounded-full bg-border' />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {hasMoreRecommendations && !loading ? (
          <button
            type='button'
            onClick={() => setVisibleRecommendations(current => current + 3)}
            className='mt-3 inline-flex w-full items-center justify-center rounded-[10px] border border-border/70 px-4 py-2 text-[0.8rem] font-medium text-foreground transition hover:border-primary/40 hover:text-primary'
          >
            See More Recommended Courses
          </button>
        ) : null}
      </Card>

    </aside>
  );
}
