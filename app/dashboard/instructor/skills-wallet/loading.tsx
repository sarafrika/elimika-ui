import { Skeleton } from '@/components/ui/skeleton';

export default function InstructorSkillsWalletLoading() {
  return (
    <div className='mx-auto w-full max-w-7xl space-y-6 px-3 py-4 sm:px-4 lg:px-6'>
      <Skeleton className='h-24 w-full rounded-xl' />
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-24 rounded-xl' />
        ))}
      </div>
      <Skeleton className='h-[480px] w-full rounded-xl' />
    </div>
  );
}
