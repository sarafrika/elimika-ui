import ProgramClassEnrollmentPage from '@/src/features/dashboard/courses/pages/ProgramClassEnrollmentPage';

type ParentProgramEnrollRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function ParentProgramEnrollRoute({
  params,
  searchParams,
}: ParentProgramEnrollRouteProps) {
  const { id } = await params;
  const { id: classId = '' } = await searchParams;
  return <ProgramClassEnrollmentPage programId={id} classId={classId} />;
}
