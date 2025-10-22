'use client';

import Spinner from '@/components/ui/spinner';

export function CourseCreatorLoadingState({
  headline = 'Preparing your course creator workspace…',
}: {
  headline?: string;
}) {
  return (
    <div className='flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-blue-200/40 bg-gradient-to-br from-white via-blue-50 to-blue-100/60 px-6 py-12 text-center shadow-lg shadow-blue-200/40 backdrop-blur dark:border-blue-500/25 dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80 dark:text-slate-200 dark:shadow-blue-900/20'>
      <Spinner className='h-7 w-7 text-blue-500 dark:text-blue-200' />
      <p className='text-sm font-semibold text-slate-800 dark:text-white'>{headline}</p>
      <p className='max-w-sm text-xs text-slate-500 dark:text-slate-300'>
        Fetching the latest profile, course catalogue, and analytics data tailored to your domain.
      </p>
    </div>
  );
}

export function CourseCreatorEmptyState() {
  return (
    <div className='flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-blue-200/40 bg-gradient-to-br from-white via-blue-50 to-blue-100/60 px-6 py-12 text-center shadow-lg shadow-blue-200/40 backdrop-blur dark:border-blue-500/25 dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80 dark:text-slate-200 dark:shadow-blue-900/20'>
      <p className='text-sm font-semibold text-slate-800 dark:text-white'>
        Course creator profile unavailable
      </p>
      <p className='max-w-sm text-xs text-slate-500 dark:text-slate-300'>
        Switch to a domain with course creation rights or contact your administrator for access.
      </p>
    </div>
  );
}

export function CustomLoadingState({
  headline = '',
  subHeading,
}: {
  headline?: string;
  subHeading: string;
}) {
  return (
    <div className='flex h-[240px] flex-col items-center justify-center gap-4'>
      <Spinner className='h-7 w-7 text-blue-500 dark:text-blue-200' />
      <p className='text-sm font-semibold text-slate-800 dark:text-white'>{headline}</p>
      <p className='max-w-sm text-xs text-slate-500 dark:text-slate-300'>{subHeading}</p>
    </div>
  );
}
