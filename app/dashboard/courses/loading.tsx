import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';

/** Entry redirect to the role's course catalogue: header, filters, card grid. */
export default function CoursesEntryLoading() {
  return (
    <div className={`${surfaceTheme.pageWide} py-4`} role='status' aria-label='Loading courses'>
      <span className='sr-only'>Loading courses…</span>
      <div className={surfaceTheme.pageStack}>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <Skeleton className='h-10 w-full max-w-xl' />
        <div className={surfaceTheme.cardGrid}>
          {Array.from({ length: 6 }, (_, index) => (
            <SectionCardSkeleton key={index} rows={3} withHeader={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
