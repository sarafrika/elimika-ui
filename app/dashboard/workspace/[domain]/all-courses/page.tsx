import { notFound } from 'next/navigation';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';
import { SharedAllCoursesPage } from '@/src/features/dashboard/workspace/pages/SharedAllCoursesPage';

type WorkspaceAllCoursesPageProps = {
  params: Promise<{ domain: string }>
};

export default async function WorkspaceAllCoursesPage({ params }: WorkspaceAllCoursesPageProps) {
  const { domain } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  if (normalizedDomain !== 'student' && normalizedDomain !== 'instructor' && normalizedDomain !== 'course_creator') {
    notFound();
  }

  return <SharedAllCoursesPage />;
}
