import {
  HeaderSkeleton,
  OrgLoadingPage,
  StatRowSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';
import { SectionCardSkeleton } from '@/components/data-display/section-card';

export default function AccountOverviewLoading() {
  return (
    <OrgLoadingPage width='standard'>
      <HeaderSkeleton />
      <StatRowSkeleton />
      <div className='grid gap-4 xl:grid-cols-2'>
        <SectionCardSkeleton rows={5} />
        <SectionCardSkeleton rows={5} />
      </div>
    </OrgLoadingPage>
  );
}
