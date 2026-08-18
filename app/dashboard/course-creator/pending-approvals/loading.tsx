import { Skeleton } from '@/components/ui/skeleton';
import { adminTheme } from '../../admin/_components/ui/admin-theme';

export default function Loading() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Skeleton className='h-28 w-full rounded-md' />
        <div className='grid gap-3 md:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-20 rounded-md' />
          ))}
        </div>
        <Skeleton className='h-[36rem] w-full rounded-md' />
      </div>
    </main>
  );
}
