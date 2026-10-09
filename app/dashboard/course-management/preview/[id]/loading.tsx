import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Shaped like the course record: header band, tab strip, content beside a rail. */
export default function CoursePreviewLoading() {
  return (
    <div className={cn(surfaceTheme.pageWide, 'flex flex-col gap-4 py-4 pb-10')}>
      <div className='bg-card grid gap-5 rounded-2xl border p-4 sm:p-5 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)_340px]'>
        <Skeleton className='h-[140px] rounded-xl md:h-[160px]' />
        <div className='flex flex-col gap-3'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-8 w-3/4' />
          <Skeleton className='h-4 w-full max-w-prose' />
          <Skeleton className='h-4 w-1/2' />
        </div>
        <Skeleton className='hidden h-[140px] rounded-[14px] lg:block' />
      </div>
      <Skeleton className='h-10 w-full' />
      <div className='grid gap-4 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <SectionCardSkeleton rows={6} />
        </div>
        <SectionCardSkeleton rows={4} />
      </div>
    </div>
  );
}
