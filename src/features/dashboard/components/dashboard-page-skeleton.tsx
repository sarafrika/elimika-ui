import { Skeleton } from '@/components/ui/skeleton';

/** Content-area placeholder while page context resolves; the shell stays interactive. */
export function DashboardPageSkeleton() {
  return (
    <div aria-busy='true' className='mx-auto flex w-full max-w-5xl flex-col gap-4 py-4'>
      <Skeleton className='bg-muted h-8 w-64' />
      <Skeleton className='bg-muted h-4 w-96 max-w-full' />
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Skeleton className='bg-muted h-28' />
        <Skeleton className='bg-muted h-28' />
        <Skeleton className='bg-muted h-28' />
      </div>
      <Skeleton className='bg-muted h-64' />
    </div>
  );
}
