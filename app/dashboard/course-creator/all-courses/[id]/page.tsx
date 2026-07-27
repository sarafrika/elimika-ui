import CourseDetailsPage from '@/src/features/dashboard/courses/pages/CourseDetailsPage';

export default function CourseCreatorCourseDetailsRoute({ params }: { params: { id: string } }) {
  return <CourseDetailsPage courseId={params.id} />;
}
