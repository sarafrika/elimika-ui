'use client';

import Spinner from '@/components/ui/spinner';

export function CourseCreatorLoadingState({
  headline = 'Preparing your course creator workspace…',
}: {
  headline?: string;
}) {
  return (
    <div className='flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-border bg-card px-6 py-12 text-center shadow-lg backdrop-blur'>
      <Spinner className='h-7 w-7 text-primary' />
      <p className='text-sm font-semibold text-foreground'>{headline}</p>
      <p className='max-w-sm text-xs text-muted-foreground'>
        Fetching the latest profile, course catalogue, and analytics data tailored to your domain.
      </p>
    </div>
  );
}

export function CourseCreatorEmptyState() {
  return (
    <div className='flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-border bg-card px-6 py-12 text-center shadow-lg backdrop-blur'>
      <p className='text-sm font-semibold text-foreground'>
        Course creator profile unavailable
      </p>
      <p className='max-w-sm text-xs text-muted-foreground'>
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
      <Spinner className='h-7 w-7 text-primary' />
      <p className='text-sm font-semibold text-foreground'>{headline}</p>
      <p className='max-w-sm text-xs text-muted-foreground'>{subHeading}</p>
    </div>
  );
}

export function CustomEmptyState({
  headline = '',
  subHeading,
}: {
  headline?: string;
  subHeading: string;
}) {
  return (
    <div className='flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-border bg-card px-6 py-12 text-center shadow-lg backdrop-blur'>
      <p className='text-sm font-semibold text-foreground'>{headline}</p>
      <p className='max-w-sm text-xs text-muted-foreground'>{subHeading}</p>
    </div>
  );
}
