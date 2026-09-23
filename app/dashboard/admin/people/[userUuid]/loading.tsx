import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPersonLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <div className='flex items-start gap-4'>
          <Skeleton className='size-14 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-7 w-56' />
            <Skeleton className='h-4 w-80' />
          </div>
        </div>
        <Skeleton className='h-11 w-full' />
        <div className='grid gap-4 xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(300px,360px)]'>
          <SectionCardSkeleton rows={5} />
          <SectionCardSkeleton rows={6} />
          <SectionCardSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}
