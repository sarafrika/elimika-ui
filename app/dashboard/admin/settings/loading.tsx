import { surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSettingsLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <Skeleton className='h-28 w-full rounded-md' />
        <Skeleton className='h-72 w-full rounded-md' />
        <Skeleton className='h-40 w-full rounded-md' />
      </div>
    </div>
  );
}
