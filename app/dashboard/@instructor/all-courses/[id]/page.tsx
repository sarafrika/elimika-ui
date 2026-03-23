import CourseDetailsPage from '@/src/features/dashboard/courses/pages/CourseDetailsPage';

export default function InstructorCourseDetailsRoute({ params }: { params: { id: string } }) {
  return <CourseDetailsPage courseId={params.id} />;
}
