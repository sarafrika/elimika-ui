import ProgramClassEnrollmentPage from '@/src/features/dashboard/courses/pages/ProgramClassEnrollmentPage';

type StudentProgramEnrollRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function StudentProgramEnrollRoute({ params, searchParams }: StudentProgramEnrollRouteProps) {
  const { id } = await params;
  const { id: classId = '' } = await searchParams;
  return <ProgramClassEnrollmentPage programId={id} classId={classId} />;
}
