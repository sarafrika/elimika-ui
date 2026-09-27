import { Skeleton } from '@/components/ui/skeleton';

export default function ProgramLoading() {
  return (
    <div
      className='mx-auto max-w-[1500px] space-y-5 p-6'
      aria-label='Loading program'
      role='status'
    >
      <Skeleton className='h-8 w-52' />
      <Skeleton className='h-4 w-80 max-w-full' />
      <div className='grid gap-2 sm:grid-cols-3 lg:grid-cols-6'>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className='h-12' />
        ))}
      </div>
      <Skeleton className='h-96 w-full' />
    </div>
  );
}
