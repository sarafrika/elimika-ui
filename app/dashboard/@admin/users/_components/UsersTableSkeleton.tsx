import { Skeleton } from '@/components/ui/skeleton';

/** Matches the AdminTable layout for streaming fallback. */
export function UsersTableSkeleton() {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-9 w-72 rounded-md' />
        <div className='flex gap-2'>
          <Skeleton className='h-9 w-24 rounded-md' />
          <Skeleton className='h-9 w-24 rounded-md' />
        </div>
      </div>
      <div className='overflow-hidden rounded-md border border-border/70 bg-card shadow-sm'>
        <div className='border-b border-border/60 bg-muted/60 px-4 py-3'>
          <Skeleton className='h-4 w-40' />
        </div>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className='flex items-center gap-3 border-b border-border/50 px-4 py-3'>
            <Skeleton className='size-9 rounded-full' />
            <div className='flex-1 space-y-1.5'>
              <Skeleton className='h-3.5 w-48' />
              <Skeleton className='h-3 w-32' />
            </div>
            <Skeleton className='h-5 w-16 rounded-md' />
          </div>
        ))}
      </div>
    </div>
  );
}
