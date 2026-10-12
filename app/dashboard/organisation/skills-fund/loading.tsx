import {
  HeaderSkeleton,
  OrgLoadingPage,
  StatRowSkeleton,
  TableSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';
import { SectionCardSkeleton } from '@/components/data-display/section-card';

export default function SkillsFundLoading() {
  return (
    <OrgLoadingPage>
      <HeaderSkeleton />
      <StatRowSkeleton />
      <div className='grid gap-4 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <TableSkeleton rows={6} />
        </div>
        <SectionCardSkeleton rows={5} />
      </div>
    </OrgLoadingPage>
  );
}
