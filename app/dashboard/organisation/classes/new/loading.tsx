import { Skeleton } from '@/components/ui/skeleton';

export default function CreateClassLoading() {
  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-5 px-3 py-3 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <div className='space-y-2 border-b pb-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-[36rem] max-w-full' />
      </div>
      <Skeleton className='h-16 w-full rounded-md' />
      <Skeleton className='h-5 w-44' />
      <div className='grid gap-4 md:grid-cols-2'>
        <Skeleton className='h-48 rounded-xl' />
        <Skeleton className='h-48 rounded-xl' />
      </div>
      <Skeleton className='h-20 w-full rounded-xl' />
    </div>
  );
}
