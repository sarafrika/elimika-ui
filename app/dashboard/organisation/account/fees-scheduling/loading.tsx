import {
  HeaderSkeleton,
  OrgLoadingPage,
} from '@/app/dashboard/organisation/_components/org-loading';
import { Skeleton } from '@/components/ui/skeleton';

/** Shaped like the per-class fee rows: title column then five inline fields. */
export default function FeesSchedulingLoading() {
  return (
    <OrgLoadingPage width='standard'>
      <HeaderSkeleton action={false} />
      <div className='bg-card rounded-xl border px-6'>
        {[0, 1, 2, 3, 4].map(row => (
          <div
            key={row}
            className='grid items-end gap-3 border-b py-4 last:border-b-0 md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_1fr_auto]'
          >
            <div className='space-y-1.5'>
              <Skeleton className='h-4 w-48 max-w-full' />
              <Skeleton className='h-3 w-32' />
            </div>
            {[0, 1, 2, 3].map(field => (
              <Skeleton key={field} className='h-9 w-full' />
            ))}
            <Skeleton className='h-9 w-20' />
          </div>
        ))}
      </div>
    </OrgLoadingPage>
  );
}
