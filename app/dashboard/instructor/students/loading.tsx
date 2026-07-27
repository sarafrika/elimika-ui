import { Skeleton } from '@/components/ui/skeleton';

export default function StudentsLoading() {
  return (
    <div className='flex w-full flex-col gap-4 p-4'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-10 w-56 rounded-lg' />
        <Skeleton className='h-10 w-40 rounded-lg' />
      </div>
      <Skeleton className='h-12 w-full rounded-xl' />
      {[0, 1, 2, 3, 4, 5].map(idx => (
        <Skeleton key={idx} className='h-16 w-full rounded-xl' />
      ))}
    </div>
  );
}
