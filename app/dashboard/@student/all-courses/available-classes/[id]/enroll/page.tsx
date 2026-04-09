import ClassEnrollmentPage from '@/src/features/dashboard/courses/pages/ClassEnrollmentPage';

type StudentClassEnrollRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function StudentClassEnrollRoute({ params, searchParams }: StudentClassEnrollRouteProps) {
  const { id } = await params;
  const { id: classId = '' } = await searchParams;
  return <ClassEnrollmentPage courseId={id} classId={classId} />;
}
