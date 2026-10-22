import { Skeleton } from '@/components/ui/skeleton';

export default function SkillsMatchesLoading() {
  return (
    <div className='flex w-full flex-col gap-4 p-4 sm:p-6'>
      <Skeleton className='h-8 w-48' />
      <Skeleton className='h-4 w-80 max-w-full' />
      <div className='flex gap-2 overflow-hidden'>
        {[0, 1, 2, 3, 4, 5].map(index => (
          <Skeleton key={index} className='h-9 w-32 shrink-0 rounded-full' />
        ))}
      </div>
      <div className='grid gap-4 lg:grid-cols-3'>
        {[0, 1, 2].map(index => (
          <Skeleton key={index} className='h-80 rounded-xl' />
        ))}
      </div>
    </div>
  );
}
