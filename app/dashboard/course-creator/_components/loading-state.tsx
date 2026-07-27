'use client';

import Spinner from '@/components/ui/spinner';

export function CourseCreatorLoadingState({
  headline = 'Preparing your course creator workspace…',
}: {
  headline?: string;
}) {
  return (
    <div className='border-border bg-card flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border px-6 py-12 text-center shadow-lg backdrop-blur'>
      <Spinner className='text-primary h-7 w-7' />
      <p className='text-foreground text-sm font-semibold'>{headline}</p>
      <p className='text-muted-foreground max-w-sm text-xs'>
        Fetching the latest profile, course catalogue, and analytics data tailored to your domain.
      </p>
    </div>
  );
}

export function CourseCreatorEmptyState() {
  return (
    <div className='border-border bg-card flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border px-6 py-12 text-center shadow-lg backdrop-blur'>
      <p className='text-foreground text-sm font-semibold'>Course creator profile unavailable</p>
      <p className='text-muted-foreground max-w-sm text-xs'>
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
      <Spinner className='text-primary h-7 w-7' />
      <p className='text-foreground text-sm font-semibold'>{headline}</p>
      <p className='text-muted-foreground max-w-sm text-xs'>{subHeading}</p>
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
    <div className='border-border bg-card flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border px-6 py-12 text-center shadow-lg backdrop-blur'>
      <p className='text-foreground text-sm font-semibold'>{headline}</p>
      <p className='text-muted-foreground max-w-sm text-xs'>{subHeading}</p>
    </div>
  );
}
