import { surfaceTheme } from '@/components/data-display/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * The public course page's loading shape: breadcrumb, the three-column header card, the
 * tab bar and an overview grid, so the skeleton settles into the page rather than
 * reflowing into it.
 */
export default function CourseDetailLoading() {
  return (
    <div className={cn(surfaceTheme.pageWide, 'flex flex-col gap-[18px] pt-5 pb-14')}>
      <Skeleton className='h-4 w-56' />

      <div className='bg-card grid gap-5 rounded-2xl border p-4 sm:p-5 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)_340px] lg:gap-6'>
        <Skeleton className='h-[160px] w-full rounded-xl md:h-full md:min-h-[180px]' />
        <div className='flex flex-col gap-3'>
          <Skeleton className='h-4 w-48' />
          <Skeleton className='h-8 w-3/4' />
          <Skeleton className='h-4 w-full max-w-prose' />
          <Skeleton className='h-4 w-2/3 max-w-prose' />
          <Skeleton className='h-6 w-56' />
          <Skeleton className='mt-auto h-5 w-full max-w-xl' />
        </div>
        <Skeleton className='hidden h-[220px] w-full rounded-[14px] md:col-span-2 md:block lg:col-span-1' />
      </div>

      <Skeleton className='h-[58px] w-full rounded-2xl' />

      <div className='grid items-start gap-[18px] lg:grid-cols-3'>
        <Skeleton className='h-64 w-full rounded-[14px] lg:col-span-2' />
        <Skeleton className='h-64 w-full rounded-[14px]' />
      </div>
    </div>
  );
}
