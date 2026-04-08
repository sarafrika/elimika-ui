import ProgramClassEnrollmentPage from '@/src/features/dashboard/courses/pages/ProgramClassEnrollmentPage';

type InstructorProgramEnrollRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function InstructorProgramEnrollRoute({ params, searchParams }: InstructorProgramEnrollRouteProps) {
  const { id } = await params;
  const { id: classId = '' } = await searchParams;
  return <ProgramClassEnrollmentPage programId={id} classId={classId} />;
}
