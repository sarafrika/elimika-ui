import { CardGridPageSkeleton } from '@/app/dashboard/instructor/_components/route-skeletons';

export default function InstructorTrainingsOverviewLoading() {
  return <CardGridPageSkeleton stats={4} tabs={3} cards={6} />;
}
