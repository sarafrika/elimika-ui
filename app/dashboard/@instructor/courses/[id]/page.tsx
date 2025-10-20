import ReusableCourseDetailsPage from '@/app/dashboard/_components/reusable-course-details';

export default function CourseDetailsPage({ params }: { params: { id: string } }) {
  return <ReusableCourseDetailsPage courseId={params.id} userRole='instructor' />;
}
