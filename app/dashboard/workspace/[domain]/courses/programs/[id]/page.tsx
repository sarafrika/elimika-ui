import { notFound } from 'next/navigation';
import ProgramDetailsPage from '@/src/features/dashboard/courses/pages/ProgramDetailsPage';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';

type WorkspaceProgramDetailsPageProps = {
  params: Promise<{ domain: string; id: string }>;
};

export default async function WorkspaceProgramDetailsPage({
  params,
}: WorkspaceProgramDetailsPageProps) {
  const { domain, id } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  if (
    normalizedDomain !== 'student' &&
    normalizedDomain !== 'instructor' &&
    normalizedDomain !== 'course_creator'
  ) {
    notFound();
  }

  return <ProgramDetailsPage programId={id} />;
}
