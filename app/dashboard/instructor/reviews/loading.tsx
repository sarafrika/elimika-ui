import { ListPageSkeleton } from '@/app/dashboard/instructor/_components/route-skeletons';

export default function InstructorReviewsLoading() {
  return <ListPageSkeleton stats={3} rows={5} actions={0} />;
}
