import AvailableClassesPage from '@/src/features/dashboard/courses/pages/AvailableClassesPage';

export default function InstructorAvailableClassesRoute({ params }: { params: { id: string } }) {
  return <AvailableClassesPage courseId={params.id} />;
}
