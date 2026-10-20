import {
  HeaderSkeleton,
  OrgLoadingPage,
  StatRowSkeleton,
  TabsSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';
import { SectionCardSkeleton } from '@/components/data-display/section-card';

export default function RevenueLoading() {
  return (
    <OrgLoadingPage width='standard'>
      <HeaderSkeleton action={false} />
      <StatRowSkeleton />
      <TabsSkeleton count={2} />
      <div className='grid gap-4 xl:grid-cols-2'>
        <SectionCardSkeleton rows={6} />
        <SectionCardSkeleton rows={4} />
      </div>
    </OrgLoadingPage>
  );
}
