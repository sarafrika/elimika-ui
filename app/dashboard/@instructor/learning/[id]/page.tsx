import ReusableCourseDetailsPage from '@/app/dashboard/_components/reusable-course-details';

type CourseDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  const { id } = await params;
  return <ReusableCourseDetailsPage courseId={id} />;
}
