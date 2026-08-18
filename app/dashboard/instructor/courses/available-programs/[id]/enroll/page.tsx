import ProgramClassEnrollmentPage from '@/src/features/dashboard/courses/pages/ProgramClassEnrollmentPage';

type WorkspaceProgramEnrollPageProps = {
  params: Promise<{ domain: string; id: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function WorkspaceProgramEnrollPage({
  params,
  searchParams,
}: WorkspaceProgramEnrollPageProps) {
  const { id } = await params;
  const { id: classId } = await searchParams;

  return <ProgramClassEnrollmentPage programId={id} classId={classId as string} />;
}
