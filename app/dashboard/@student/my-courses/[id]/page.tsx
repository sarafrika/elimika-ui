import ReusableCourseDetailsPage from '@/app/dashboard/_components/reusable-course-details';

export default async function CourseDetailsPage({ params }: any) {
  const { data } = await params;
  return <ReusableCourseDetailsPage courseId={data?.id} handleEnroll={() => {}} />;
}
