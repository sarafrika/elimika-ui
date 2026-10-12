import {
  CardGridSkeleton,
  HeaderSkeleton,
  OrgLoadingPage,
  ToolbarSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';

export default function VenuesLoading() {
  return (
    <OrgLoadingPage>
      <HeaderSkeleton />
      <ToolbarSkeleton />
      <CardGridSkeleton count={6} />
    </OrgLoadingPage>
  );
}
