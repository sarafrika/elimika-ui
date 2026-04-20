'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, Clock3, Gauge, GraduationCap, Plus } from 'lucide-react';
import Link from 'next/link';
import type { LearningHubStat } from './useStudentLearningHubData';

const statIcons = {
  blue: GraduationCap,
  green: Clock3,
  red: CheckSquare,
  orange: Gauge,
};

const statToneClasses = {
  blue: 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_88%,black_8%),color-mix(in_srgb,var(--primary)_72%,white_22%))]',
  green:
    'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--success)_78%,black_12%),color-mix(in_srgb,var(--success)_58%,white_28%))]',
  red: 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--destructive)_82%,black_6%),color-mix(in_srgb,var(--destructive)_70%,white_20%))]',
  orange:
    'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--warning)_82%,black_4%),color-mix(in_srgb,var(--warning)_72%,white_16%))]',
};

type LearningHubHeroProps = {
  firstName: string;
  studentName: string;
  stats: LearningHubStat[];
  loading?: boolean;
};

export function LearningHubHero({
  firstName,
  studentName: _studentName,
  stats,
  loading = false,
}: LearningHubHeroProps) {
  return (
    <Card className='border-border/70 bg-background relative overflow-hidden rounded-[26px] border p-0 shadow-[0_26px_56px_-48px_rgba(15,23,42,0.2)]'>
      <div className='relative min-h-[150px] overflow-hidden rounded-t-[26px] bg-[linear-gradient(90deg,rgba(255,255,255,0.98),rgba(242,246,255,0.94),rgba(236,242,255,0.92))] px-4 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7'>
        <div className='relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='max-w-2xl min-w-0 space-y-2'>
            {loading ? (
              <>
                <Skeleton className='h-11 w-64 sm:h-12 sm:w-80 lg:h-14 lg:w-96' />
                <Skeleton className='h-5 w-72 sm:w-96' />
              </>
            ) : (
              <>
                <h1 className='text-foreground text-[2rem] leading-[1.08] font-semibold tracking-tight sm:text-[2.4rem] lg:text-[3rem]'>
                  Welcome back, {firstName}!
                </h1>
                <p className='text-muted-foreground text-[0.92rem] sm:text-[1rem] lg:text-[1.04rem]'>
                  Keep learning and track your progress here in your Learning Hub.
                </p>
              </>
            )}
          </div>

          {/* RIGHT: CTA */}
          <div className='mt-3 flex w-full flex-col gap-2 sm:w-auto lg:mt-0'>
            <Link
              prefetch
              href='/dashboard/workspace/student/courses'
              className='inline-flex items-center justify-center gap-2 rounded-[8px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--success)_80%,black_6%),color-mix(in_srgb,var(--success)_70%,black_18%))] px-4 py-2.5 text-[0.85rem] font-medium text-white transition hover:opacity-95'
            >
              <Plus className='size-4' />
              Go to My Courses
            </Link>

            <Link
              prefetch
              href='/dashboard/workspace/student/courses'
              className='border-border/70 bg-background text-muted-foreground hover:text-primary inline-flex items-center justify-center gap-2 rounded-[8px] border px-4 py-2.5 text-[0.85rem] font-medium transition'
            >
              <Plus className='size-4' />
              Enroll in New Course
            </Link>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className='grid gap-3 px-4 pb-5 sm:px-6 sm:pb-6 md:grid-cols-2 lg:px-7 xl:grid-cols-4'>
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`hero-stat-${index}`}
                className='rounded-[10px] px-4 py-3 shadow-[0_18px_35px_-24px_rgba(15,23,42,0.35)] sm:px-5 sm:py-4'
              >
                <Skeleton className='h-16 w-full rounded-[10px]' />
              </div>
            ))
          : stats.map(stat => {
              const Icon = statIcons[stat.tone];
              return (
                <div
                  key={stat.id}
                  className={`rounded-[10px] px-4 py-3 text-white shadow-[0_18px_35px_-24px_rgba(15,23,42,0.35)] sm:px-5 sm:py-4 ${statToneClasses[stat.tone]}`}
                >
                  <div className='flex items-start gap-3'>
                    <Icon className='mt-0.5 size-5 shrink-0 text-white/95' />
                    <div className='min-w-0'>
                      <div className='text-[1.5rem] leading-none font-semibold sm:text-[1.75rem] lg:text-[2rem]'>
                        {stat.value}
                      </div>
                      <div className='mt-1.5 text-[0.82rem] font-medium text-white/95 sm:mt-2 sm:text-[0.9rem] lg:text-[0.95rem]'>
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </Card>
  );
}
