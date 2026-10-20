import {
  HeaderSkeleton,
  OrgLoadingPage,
  StatRowSkeleton,
  TableSkeleton,
  TabsSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';

export default function SkillsFundLoading() {
  return (
    <OrgLoadingPage width='standard'>
      <HeaderSkeleton />
      <StatRowSkeleton />
      <TabsSkeleton count={2} />
      <TableSkeleton rows={5} />
    </OrgLoadingPage>
  );
}
