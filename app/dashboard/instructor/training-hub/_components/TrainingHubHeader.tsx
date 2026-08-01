'use client';

import Link from 'next/link';

export function TrainingHubHeader() {
  return (
    <header className='border-border/50 dark:border-border/30 flex flex-col gap-4 rounded-[14px] border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_4%,white),white_54%,color-mix(in_srgb,var(--primary)_9%,white))] px-4 py-4 shadow-[0_12px_30px_rgba(31,79,183,0.08)] sm:px-5 sm:py-5 lg:flex-row lg:items-start lg:justify-between lg:px-6 lg:py-5 dark:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_12%,var(--background)),var(--background)_60%,color-mix(in_srgb,var(--primary)_18%,var(--background)))] dark:shadow-[0_12px_30px_rgba(0,0,0,0.6)]'>
      <div className='min-w-0'>
        <h1 className='text-foreground text-[1.7rem] leading-none font-semibold tracking-[-0.03em] sm:text-[1.85rem] lg:text-[1.95rem]'>
          Training Hub
        </h1>
        <p className='text-muted-foreground mt-2 max-w-[720px] text-[0.92rem] leading-6 sm:text-[0.97rem] lg:text-[1rem]'>
          Organize and manage your courses, live classes, and invited students.
        </p>
      </div>

      <Link
        href='/dashboard/instructor/courses'
        className='bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/30 inline-flex h-11 items-center justify-center rounded-full px-6 text-[0.92rem] font-medium transition focus-visible:ring-2 focus-visible:outline-none sm:self-start lg:h-12 lg:px-7 lg:text-[0.98rem]'
      >
        Explore All Courses
      </Link>
    </header>
  );
}
