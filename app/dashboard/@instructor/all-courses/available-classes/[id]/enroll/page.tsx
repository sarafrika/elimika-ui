import ClassEnrollmentPage from '@/src/features/dashboard/courses/pages/ClassEnrollmentPage';

type InstructorClassEnrollRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function InstructorClassEnrollRoute({ params, searchParams }: InstructorClassEnrollRouteProps) {
  const { id } = await params;
  const { id: classId = '' } = await searchParams;
  return <ClassEnrollmentPage courseId={id} classId={classId} />;
}
