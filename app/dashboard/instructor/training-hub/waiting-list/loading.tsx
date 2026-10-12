import { ListPageSkeleton } from '@/app/dashboard/instructor/_components/route-skeletons';

export default function InstructorTrainingHubWaitingListLoading() {
  return <ListPageSkeleton stats={3} rows={6} />;
}
