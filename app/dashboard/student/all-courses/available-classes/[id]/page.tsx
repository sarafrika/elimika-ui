import AvailableClassesPage from '@/src/features/dashboard/courses/pages/AvailableClassesPage';

export default function StudentAvailableClassesRoute({ params }: { params: { id: string } }) {
  return <AvailableClassesPage courseId={params.id} />;
}
