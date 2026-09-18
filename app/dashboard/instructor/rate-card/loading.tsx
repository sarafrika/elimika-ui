import { Skeleton } from '@/components/ui/skeleton';

export default function InstructorRateCardLoading() {
  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 px-4 py-4 pb-10 sm:px-6'>
      <div className='space-y-2 border-b pb-4'>
        <Skeleton className='h-8 w-40' />
        <Skeleton className='h-4 w-[36rem] max-w-full' />
      </div>
      {[0, 1].map(index => (
        <div key={index} className='bg-card space-y-4 rounded-xl border p-5'>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-72 max-w-full' />
            <Skeleton className='h-4 w-48' />
          </div>
          <Skeleton className='h-56 w-full' />
        </div>
      ))}
    </div>
  );
}
