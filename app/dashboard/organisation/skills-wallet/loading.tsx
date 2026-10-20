import {
  HeaderSkeleton,
  OrgLoadingPage,
  StatRowSkeleton,
  TableSkeleton,
  TabsSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';

export default function LearnerFundingLoading() {
  return (
    <OrgLoadingPage width='standard'>
      <HeaderSkeleton />
      <StatRowSkeleton count={3} />
      <TabsSkeleton count={1} />
      <TableSkeleton rows={5} />
    </OrgLoadingPage>
  );
}
