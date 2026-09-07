import { PublicTopNav } from '@/components/PublicTopNav';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * The public course record's loading shape.
 *
 * It traces the real page — back bar, hero band and stat strip, gate banner,
 * body column and 380px rail — so the skeleton settles into the record rather
 * than reflowing into it.
 */
export default function CourseDetailLoading() {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav />
      <div className='mx-auto flex w-full max-w-6xl flex-col px-6 py-10 lg:py-12'>
        <div className='mb-5 flex items-center justify-between gap-4'>
          <Skeleton className='h-8 w-40' />
          <Skeleton className='h-[26px] w-48 rounded-[10px]' />
        </div>

        <div className='bg-card mb-5 overflow-hidden rounded-xl border shadow-sm'>
          <Skeleton className='h-[172px] w-full rounded-none sm:h-[200px] lg:h-[244px]' />
          <div className='bg-border grid grid-cols-2 gap-px sm:grid-cols-4'>
            {[0, 1, 2, 3].map(cell => (
              <div key={cell} className='bg-card flex items-center gap-3 px-4 py-4 sm:px-6'>
                <Skeleton className='size-10 rounded-xl' />
                <div className='flex-1 space-y-1.5'>
                  <Skeleton className='h-2.5 w-20' />
                  <Skeleton className='h-4 w-12' />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Skeleton className='mb-[22px] h-[86px] w-full rounded-xl' />

        <div className='grid items-start gap-[22px] lg:grid-cols-[minmax(0,1fr)_380px]'>
          <div className='flex min-w-0 flex-col gap-[18px]'>
            <Skeleton className='h-[168px] rounded-xl' />
            <div className='grid gap-[18px] md:grid-cols-2'>
              <Skeleton className='h-[196px] rounded-xl' />
              <Skeleton className='h-[196px] rounded-xl' />
            </div>
            <Skeleton className='h-[240px] rounded-xl' />
          </div>

          <div className='flex flex-col gap-4'>
            <Skeleton className='h-[212px] rounded-xl' />
            <Skeleton className='h-[152px] rounded-xl' />
            <Skeleton className='h-[228px] rounded-xl' />
          </div>
        </div>
      </div>
    </div>
  );
}
