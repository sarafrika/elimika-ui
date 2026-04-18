'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { LearningHubCourse } from './useStudentLearningHubData';

const buttonAccentClasses = {
  blue:
    'bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_88%,black_8%),color-mix(in_srgb,var(--primary)_74%,black_18%))] text-white',
  green:
    'bg-[linear-gradient(180deg,color-mix(in_srgb,var(--success)_76%,black_6%),color-mix(in_srgb,var(--success)_68%,black_18%))] text-white',
  slate: 'border border-border/70 bg-background text-foreground',
};

type LearningHubContinueLearningProps = {
  courses: LearningHubCourse[];
};

export function LearningHubContinueLearning({ courses }: LearningHubContinueLearningProps) {
  return (
    <Card className='rounded-[18px] border border-border/70 bg-background p-3.5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-[1.08rem] font-semibold text-foreground'>Continue Learning</h2>
        <ChevronRight className='size-4 text-muted-foreground' />
      </div>

      <div className='mt-3 grid gap-3 md:grid-cols-2 min-[1450px]:grid-cols-4'>
        {courses.map(course => (
          <article key={course.id} className='space-y-2 rounded-[10px]'>
            <div className='h-[86px] rounded-[8px] border border-border/60 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,white),white)]' />
            <div>
              <h3 className='truncate text-[0.95rem] font-semibold text-foreground'>{course.title}</h3>
              <p className='mt-1 text-[0.72rem] text-muted-foreground'>{course.level}</p>
            </div>
            <div className='flex items-center gap-1.5'>
              {[0, 1, 2, 3].map(index => (
                <span
                  key={`${course.id}-${index}`}
                  className={`size-2 rounded-full ${
                    index < Math.max(1, Math.round(course.progress / 25))
                      ? 'bg-[color:color-mix(in_srgb,var(--primary)_52%,white)]'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <Link
              prefetch
              href={course.href}
              className={`inline-flex w-full items-center justify-center rounded-[8px] px-3 py-2 text-[0.78rem] font-medium transition hover:opacity-95 ${buttonAccentClasses[course.accent]}`}
            >
              {course.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </Card>
  );
}
