'use client';

import Link from 'next/link';

export function TrainingHubHeader() {
  return (
    <header className='flex flex-col gap-4 rounded-[14px] border border-border/50 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_4%,white),white_54%,color-mix(in_srgb,var(--primary)_9%,white))] px-4 py-4 shadow-[0_12px_30px_rgba(31,79,183,0.08)] sm:px-5 sm:py-5 lg:flex-row lg:items-start lg:justify-between lg:px-6 lg:py-5'>
      <div className='min-w-0'>
        <h1 className='text-[1.7rem] leading-none font-semibold tracking-[-0.03em] text-foreground sm:text-[1.85rem] lg:text-[1.95rem]'>
          Training Hub
        </h1>
        <p className='mt-2 max-w-[720px] text-[0.92rem] leading-6 text-muted-foreground sm:text-[0.97rem] lg:text-[1rem]'>
          Organize and manage your courses, live classes, and invited students.
        </p>
      </div>

      <Link
        href='/dashboard/all-courses'
        className='inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-[0.92rem] font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:self-start lg:h-12 lg:px-7 lg:text-[0.98rem]'
      >
        Explore All Courses
      </Link>
    </header>
  );
}
