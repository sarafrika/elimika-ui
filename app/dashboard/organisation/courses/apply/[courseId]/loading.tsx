import {
  HeaderSkeleton,
  OrgLoadingPage,
} from '@/app/dashboard/organisation/_components/org-loading';
import { Skeleton } from '@/components/ui/skeleton';

/** Shaped like the apply wizard: step strip, then one step card with its footer. */
export default function ApplyToTrainLoading() {
  return (
    <OrgLoadingPage width='standard'>
      <HeaderSkeleton action={false} back />
      <div className='hidden gap-2 sm:flex'>
        {[0, 1, 2, 3].map(step => (
          <Skeleton key={step} className='h-7 flex-1' />
        ))}
      </div>
      <div className='space-y-4 rounded-xl border p-6'>
        <Skeleton className='h-5 w-40' />
        <Skeleton className='h-4 w-72 max-w-full' />
        <Skeleton className='h-48 w-full' />
        <div className='flex justify-between border-t pt-4'>
          <Skeleton className='h-9 w-24' />
          <Skeleton className='h-9 w-28' />
        </div>
      </div>
    </OrgLoadingPage>
  );
}
