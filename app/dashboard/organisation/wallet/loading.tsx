import {
  HeaderSkeleton,
  OrgLoadingPage,
  StatRowSkeleton,
  TableSkeleton,
} from '@/app/dashboard/organisation/_components/org-loading';

export default function WalletLoading() {
  return (
    <OrgLoadingPage width='standard'>
      <HeaderSkeleton action={false} />
      <StatRowSkeleton />
      <TableSkeleton rows={5} />
    </OrgLoadingPage>
  );
}
