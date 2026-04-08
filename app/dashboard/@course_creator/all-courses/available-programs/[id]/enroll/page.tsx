import ProgramClassEnrollmentPage from '@/src/features/dashboard/courses/pages/ProgramClassEnrollmentPage';

type CourseCreatorProgramEnrollRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function CourseCreatorProgramEnrollRoute({ params, searchParams }: CourseCreatorProgramEnrollRouteProps) {
  const { id } = await params;
  const { id: classId = '' } = await searchParams;
  return <ProgramClassEnrollmentPage programId={id} classId={classId} />;
}
