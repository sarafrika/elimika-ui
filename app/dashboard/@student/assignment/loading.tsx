import { Skeleton } from '@/components/ui/skeleton';

export default function AssignmentsLoading() {
  return (
    <div className='space-y-6 p-4 sm:p-6 lg:p-8'>
      {/* Header */}
      <div className='space-y-3'>
        <Skeleton className='h-6 w-32 rounded-full' />
        <Skeleton className='h-9 w-64 rounded-lg' />
        <Skeleton className='h-4 w-full max-w-xl rounded' />
      </div>

      {/* Tabs */}
      <Skeleton className='h-11 w-full max-w-xs rounded-xl' />

      {/* Stat tiles */}
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-28 rounded-2xl' />
        ))}
      </div>

      {/* Toolbar */}
      <Skeleton className='h-24 rounded-2xl' />

      {/* Card grid */}
      <div className='grid gap-4 lg:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-56 rounded-2xl' />
        ))}
      </div>
    </div>
  );
}
