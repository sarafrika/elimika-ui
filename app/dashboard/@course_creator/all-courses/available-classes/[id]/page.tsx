import AvailableClassesPage from '@/src/features/dashboard/courses/pages/AvailableClassesPage';

export default function CourseCreatorAvailableClassesRoute({ params }: { params: { id: string } }) {
  return <AvailableClassesPage courseId={params.id} />;
}
