import { notFound } from 'next/navigation';
import ProgramClassEnrollmentPage from '@/src/features/dashboard/courses/pages/ProgramClassEnrollmentPage';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';

type WorkspaceProgramEnrollPageProps = {
  params: Promise<{ domain: string; id: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function WorkspaceProgramEnrollPage({ params, searchParams }: WorkspaceProgramEnrollPageProps) {
  const { domain, id } = await params;
  const { id: classId } = await searchParams;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  if ((normalizedDomain !== 'student' && normalizedDomain !== 'instructor' && normalizedDomain !== 'course_creator') || !classId) {
    notFound();
  }

  return <ProgramClassEnrollmentPage programId={id} classId={classId} />;
}
