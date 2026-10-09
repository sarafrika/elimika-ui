import {
  CardGridSkeleton,
  HeaderSkeleton,
  OrgLoadingPage,
} from '@/app/dashboard/organisation/_components/org-loading';

export default function BranchesLoading() {
  return (
    <OrgLoadingPage>
      <HeaderSkeleton />
      <CardGridSkeleton count={6} />
    </OrgLoadingPage>
  );
}
