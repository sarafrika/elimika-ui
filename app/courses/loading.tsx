import { PublicTopNav } from '@/components/PublicTopNav';
import { Skeleton } from '@/components/ui/skeleton';

export default function CoursesLoading() {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav />
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
        <Skeleton className='h-[220px] w-full rounded-[36px]' />
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3, 4, 5, 6].map(idx => (
            <Skeleton key={idx} className='h-[360px] w-full rounded-[28px]' />
          ))}
        </div>
      </div>
    </div>
  );
}
