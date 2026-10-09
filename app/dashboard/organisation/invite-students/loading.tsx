import {
  HeaderSkeleton,
  OrgLoadingPage,
} from '@/app/dashboard/organisation/_components/org-loading';
import { SectionCardSkeleton } from '@/components/data-display/section-card';
import { Skeleton } from '@/components/ui/skeleton';

/** Shaped like the three-step invite flow: step strip, step card, history card. */
export default function InviteStudentsLoading() {
  return (
    <OrgLoadingPage>
      <HeaderSkeleton action={false} />
      <div className='grid gap-2 sm:grid-cols-3'>
        {[0, 1, 2].map(step => (
          <Skeleton key={step} className='h-14 w-full rounded-md' />
        ))}
      </div>
      <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(item => (
          <Skeleton key={item} className='h-24 w-full rounded-md' />
        ))}
      </div>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-9 w-24' />
        <Skeleton className='h-9 w-28' />
      </div>
      <SectionCardSkeleton rows={4} />
    </OrgLoadingPage>
  );
}
