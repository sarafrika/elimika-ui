import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className='bg-background text-foreground flex min-h-screen w-full flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-9 w-48 rounded-lg' />
        <Skeleton className='h-9 w-9 rounded-full' />
      </div>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[0, 1, 2, 3].map(idx => (
          <Skeleton key={idx} className='h-28 w-full rounded-2xl' />
        ))}
      </div>
      <Skeleton className='h-[420px] w-full rounded-2xl' />
    </div>
  );
}
