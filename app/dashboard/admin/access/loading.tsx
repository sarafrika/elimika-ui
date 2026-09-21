import { surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAccessLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <Skeleton className='h-11 w-full max-w-md' />
        <div className='space-y-2 rounded-md border p-3'>
          {[0, 1, 2, 3, 4].map(item => (
            <Skeleton key={item} className='h-12 w-full' />
          ))}
        </div>
        <Skeleton className='h-40 w-full rounded-md' />
      </div>
    </div>
  );
}
