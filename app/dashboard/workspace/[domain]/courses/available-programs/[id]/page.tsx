import AvailableProgramsPage from '@/src/features/dashboard/courses/pages/AvailableProgramsPage';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';
import { notFound } from 'next/navigation';

type WorkspaceAvailableProgramsPageProps = {
  params: Promise<{ domain: string; id: string }>;
};

export default async function WorkspaceAvailableProgramsPage({ params }: WorkspaceAvailableProgramsPageProps) {
  const { domain, id } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  if (normalizedDomain !== 'student' && normalizedDomain !== 'instructor' && normalizedDomain !== 'course_creator') {
    notFound();
  }

  return <AvailableProgramsPage programId={id} />;
}
