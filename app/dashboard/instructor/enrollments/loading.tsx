import { ListPageSkeleton } from '@/app/dashboard/instructor/_components/route-skeletons';

export default function InstructorEnrollmentsLoading() {
  return <ListPageSkeleton stats={4} rows={8} />;
}
