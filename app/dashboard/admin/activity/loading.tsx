import { surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminActivityLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <Skeleton className='h-9 w-full' />
        <div className='space-y-2 rounded-md border p-3'>
          {[0, 1, 2, 3, 4, 5, 6].map(item => (
            <Skeleton key={item} className='h-12 w-full' />
          ))}
        </div>
      </div>
    </div>
  );
}
