import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';
import { notFound } from 'next/navigation';
import { StudentMyCoursesPage } from '../_components/StudentMyCoursesPage';

type WorkspaceStudentMyCoursesPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function WorkspaceStudentMyCoursesPage({
  params,
}: WorkspaceStudentMyCoursesPageProps) {
  const { domain } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  if (normalizedDomain !== 'student') {
    notFound();
  }

  return <StudentMyCoursesPage />;
}
