import { ListPageSkeleton } from '@/app/dashboard/instructor/_components/route-skeletons';

export default function InstructorTrainingHubBookingsLoading() {
  return <ListPageSkeleton stats={4} tabs={3} rows={6} />;
}
