import { Skeleton } from '@/components/ui/skeleton';
import { surfaceTheme } from '@/components/data-display';

export default function ClassesLoading() {
  return (
    <div className={`${surfaceTheme.pageWide} space-y-6 py-4`}>
      <div className='flex items-end justify-between gap-4 border-b pb-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <Skeleton className='h-9 w-32' />
      </div>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]'>
        {[0, 1, 2, 3].map(item => (
          <Skeleton key={item} className='h-24 rounded-xl' />
        ))}
      </div>
      <div className='space-y-2'>
        {[0, 1, 2, 3, 4, 5].map(item => (
          <Skeleton key={item} className='h-14 w-full' />
        ))}
      </div>
    </div>
  );
}
