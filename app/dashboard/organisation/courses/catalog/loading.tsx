import {
  CardGridSkeleton,
  OrgLoadingPage,
  TabsSkeleton,
  ToolbarSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';
import { Skeleton } from '@/components/ui/skeleton';

/** Shaped like the catalogue: search bar, facet chips, category tabs, course cards. */
export default function CatalogLoading() {
  return (
    <OrgLoadingPage>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-56' />
        <Skeleton className='h-4 w-96 max-w-full' />
      </div>
      <ToolbarSkeleton filters={3} />
      <TabsSkeleton count={6} />
      <CardGridSkeleton count={8} />
    </OrgLoadingPage>
  );
}
