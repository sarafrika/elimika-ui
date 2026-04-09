import { PublicTopNav } from '@/components/PublicTopNav';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseDetailLoading() {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav />
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12 lg:py-16'>
        <Skeleton className='h-12 w-48' />
        <Skeleton className='h-[400px] w-full rounded-[36px]' />
        <div className='grid gap-6 lg:grid-cols-3'>
          <Skeleton className='h-[300px] rounded-[28px] lg:col-span-2' />
          <Skeleton className='h-[300px] rounded-[28px]' />
        </div>
      </div>
    </div>
  );
}
