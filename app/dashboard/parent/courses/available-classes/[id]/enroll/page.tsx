import ClassEnrollmentPage from '@/src/features/dashboard/courses/pages/ClassEnrollmentPage';

type ParentClassEnrollRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function ParentClassEnrollRoute({
  params,
  searchParams,
}: ParentClassEnrollRouteProps) {
  const { id } = await params;
  const { id: classId = '' } = await searchParams;
  return <ClassEnrollmentPage courseId={id} classId={classId} />;
}
