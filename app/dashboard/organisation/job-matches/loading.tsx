import {
  CardGridSkeleton,
  HeaderSkeleton,
  OrgLoadingPage,
  StatRowSkeleton,
  ToolbarSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';

export default function JobMatchesLoading() {
  return (
    <OrgLoadingPage>
      <HeaderSkeleton action={false} />
      <StatRowSkeleton count={5} />
      <ToolbarSkeleton />
      <CardGridSkeleton count={6} />
    </OrgLoadingPage>
  );
}
