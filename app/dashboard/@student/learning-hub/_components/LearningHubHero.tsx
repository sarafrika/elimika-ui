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
  blue: 'bg-primary text-primary-foreground',
  green: 'bg-success text-success-foreground',
  red: 'bg-destructive text-destructive-foreground',
  orange: 'bg-warning text-warning-foreground',
};

type LearningHubHeroProps = {
  firstName: string;
  studentName: string;
  stats: LearningHubStat[];
  loading?: boolean;
};

export function LearningHubHero({
  firstName,
  stats,
  loading = false,
}: LearningHubHeroProps) {
  return (
    <Card className="bg-background relative overflow-hidden p-0 shadow-[0_26px_56px_-48px_rgba(15,23,42,0.2)]">
      <div className="relative min-h-[150px] overflow-hidden rounded-t-md bg-muted/40 px-4 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-11 w-64 sm:h-12 sm:w-80 lg:h-14 lg:w-96" />
                <Skeleton className="h-5 w-72 sm:w-96" />
              </>
            ) : (
              <>
                <h1 className="text-foreground text-[2rem] leading-[1.08] font-semibold tracking-tight sm:text-[2.4rem] lg:text-[2rem]">
                  Welcome back, {firstName}!
                </h1>
                <p className="text-muted-foreground text-[0.92rem] sm:text-[1rem] lg:text-[1.04rem]">
                  Keep learning and track your progress here in your Learning Hub.
                </p>
              </>
            )}

            {!loading && (
              <div className="flex flex-wrap gap-x-4 gap-y-3 pt-2">
                {stats.map(stat => {
                  const Icon = statIcons[stat.tone];

                  return (
                    <div
                      key={stat.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Icon className="size-4 text-foreground" />
                      <span className="font-medium text-foreground">
                        {stat.value}
                      </span>
                      <span>{stat.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 flex w-full flex-col gap-2 sm:w-auto lg:mt-0">
            <Link
              prefetch
              href="/dashboard/workspace/student/courses/my-courses"
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-success px-4 py-2.5 text-[0.85rem] font-medium text-success-foreground transition hover:opacity-95"
            >
              <Plus className="size-4" />
              Go to My Courses
            </Link>

            <Link
              prefetch
              href="/dashboard/workspace/student/courses"
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-border bg-background px-4 py-2.5 text-[0.85rem] font-medium text-muted-foreground transition hover:text-primary"
            >
              <Plus className="size-4" />
              Enroll in New Course
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}