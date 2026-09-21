import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPeopleLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-3 w-20' />
          <Skeleton className='h-8 w-64' />
        </div>
        <div className='flex gap-4'>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className='h-6 w-24' />
          ))}
        </div>
        <Skeleton className='h-9 w-full max-w-xl' />
        <SectionCardSkeleton rows={8} withHeader={false} />
      </div>
    </div>
  );
}
