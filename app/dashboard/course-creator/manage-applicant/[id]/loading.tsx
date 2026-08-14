import { Skeleton } from '@/components/ui/skeleton';
import { adminTheme } from '../../../admin/_components/ui/admin-theme';

export default function Loading() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Skeleton className='h-28 w-full rounded-md' />
        <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]'>
          <div className='space-y-4'>
            <Skeleton className='h-56 w-full rounded-md' />
            <Skeleton className='h-[36rem] w-full rounded-md' />
          </div>
          <Skeleton className='h-[30rem] w-full rounded-md' />
        </div>
      </div>
    </main>
  );
}
