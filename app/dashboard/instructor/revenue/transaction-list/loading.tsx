import { ListPageSkeleton } from '@/app/dashboard/instructor/_components/route-skeletons';

export default function InstructorRevenueTransactionListLoading() {
  return <ListPageSkeleton stats={3} rows={10} />;
}
