import CourseDetailsPage from '@/src/features/dashboard/courses/pages/CourseDetailsPage';

export default function StudentCourseDetailsRoute({ params }: { params: { id: string } }) {
  return <CourseDetailsPage courseId={params.id} />;
}
