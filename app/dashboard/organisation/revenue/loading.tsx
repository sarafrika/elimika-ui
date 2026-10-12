import {
  HeaderSkeleton,
  OrgLoadingPage,
  StatRowSkeleton,
  TableSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';
import { SectionCardSkeleton } from '@/components/data-display/section-card';

export default function RevenueLoading() {
  return (
    <OrgLoadingPage width='standard'>
      <HeaderSkeleton action={false} />
      <StatRowSkeleton />
      <div className='grid gap-4 xl:grid-cols-2'>
        <SectionCardSkeleton rows={4} />
        <SectionCardSkeleton rows={4} />
      </div>
      <TableSkeleton rows={5} />
    </OrgLoadingPage>
  );
}
