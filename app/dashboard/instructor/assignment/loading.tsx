import { ListPageSkeleton } from '@/app/dashboard/instructor/_components/route-skeletons';

export default function InstructorAssignmentLoading() {
  return <ListPageSkeleton stats={0} rows={6} />;
}
