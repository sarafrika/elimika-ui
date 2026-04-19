import { notFound } from 'next/navigation';
import AvailableClassesPage from '@/src/features/dashboard/courses/pages/AvailableClassesPage';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';

type WorkspaceAvailableClassesPageProps = {
  params: Promise<{ domain: string; id: string }>;
};

export default async function WorkspaceAvailableClassesPage({ params }: WorkspaceAvailableClassesPageProps) {
  const { domain, id } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  if (normalizedDomain !== 'student' && normalizedDomain !== 'instructor' && normalizedDomain !== 'course_creator') {
    notFound();
  }

  return <AvailableClassesPage courseId={id} />;
}
