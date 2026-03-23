import AvailableProgramsPage from '@/src/features/dashboard/courses/pages/AvailableProgramsPage';

export default function CourseCreatorAvailableProgramsRoute({ params }: { params: { id: string } }) {
  return <AvailableProgramsPage programId={params.id} />;
}
