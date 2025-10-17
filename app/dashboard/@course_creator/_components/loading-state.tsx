'use client';

import Spinner from '@/components/ui/spinner';

export function CourseCreatorLoadingState({
  headline = 'Preparing your course creator workspace…',
}: {
  headline?: string;
}) {
  return (
    <div className='flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-purple-200/40 bg-gradient-to-br from-white via-purple-50 to-purple-100/60 px-6 py-12 text-center shadow-lg shadow-purple-200/40 backdrop-blur dark:border-purple-500/25 dark:from-purple-950/60 dark:via-purple-900/40 dark:to-slate-950/80 dark:text-slate-200 dark:shadow-purple-900/20'>
      <Spinner className='h-7 w-7 text-purple-500 dark:text-purple-200' />
      <p className='text-sm font-semibold text-slate-800 dark:text-white'>{headline}</p>
      <p className='max-w-sm text-xs text-slate-500 dark:text-slate-300'>
        Fetching the latest profile, course catalogue, and analytics data tailored to your domain.
      </p>
    </div>
  );
}

export function CourseCreatorEmptyState() {
  return (
    <div className='flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-purple-200/40 bg-gradient-to-br from-white via-purple-50 to-purple-100/60 px-6 py-12 text-center shadow-lg shadow-purple-200/40 backdrop-blur dark:border-purple-500/25 dark:from-purple-950/60 dark:via-purple-900/40 dark:to-slate-950/80 dark:text-slate-200 dark:shadow-purple-900/20'>
      <p className='text-sm font-semibold text-slate-800 dark:text-white'>Course creator profile unavailable</p>
      <p className='max-w-sm text-xs text-slate-500 dark:text-slate-300'>
        Switch to a domain with course creation rights or contact your administrator for access.
      </p>
    </div>
  );
}
