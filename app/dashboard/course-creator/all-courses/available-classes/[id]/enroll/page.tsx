import ClassEnrollmentPage from '@/src/features/dashboard/courses/pages/ClassEnrollmentPage';

type CourseCreatorClassEnrollRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function CourseCreatorClassEnrollRoute({ params, searchParams }: CourseCreatorClassEnrollRouteProps) {
  const { id } = await params;
  const { id: classId = '' } = await searchParams;
  return <ClassEnrollmentPage courseId={id} classId={classId} />;
}
