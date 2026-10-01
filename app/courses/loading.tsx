import { Skeleton } from '@/components/ui/skeleton';
import { CatalogueItemCardSkeleton } from '@/src/features/catalogue/components/CatalogueItemCard';

export default function CoursesLoading() {
  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pt-7 pb-14 sm:px-6'>
      <div className='flex flex-col gap-2 border-b pb-4'>
        <Skeleton className='h-3 w-20' />
        <Skeleton className='h-8 w-72 max-w-full' />
        <Skeleton className='h-4 w-96 max-w-full' />
      </div>
      <div className='grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]'>
        <Skeleton className='hidden h-[520px] w-full rounded-md lg:block' />
        <div className='flex min-w-0 flex-col gap-4'>
          <Skeleton className='h-[72px] w-full rounded-md' />
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3'>
            {[1, 2, 3, 4, 5, 6].map(idx => (
              <CatalogueItemCardSkeleton key={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
