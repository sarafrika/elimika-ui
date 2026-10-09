import { CardGridPageSkeleton } from '@/app/dashboard/instructor/_components/route-skeletons';

export default function InstructorLearningLoading() {
  return <CardGridPageSkeleton tabs={3} cards={6} actions={1} />;
}
