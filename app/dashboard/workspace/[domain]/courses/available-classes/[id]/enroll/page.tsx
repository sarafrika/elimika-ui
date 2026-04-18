import { notFound } from 'next/navigation';
import ClassEnrollmentPage from '@/src/features/dashboard/courses/pages/ClassEnrollmentPage';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';

type WorkspaceClassEnrollPageProps = {
  params: Promise<{ domain: string; id: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function WorkspaceClassEnrollPage({ params, searchParams }: WorkspaceClassEnrollPageProps) {
  const { domain, id } = await params;
  const { id: classId } = await searchParams;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  if ((normalizedDomain !== 'student' && normalizedDomain !== 'instructor' && normalizedDomain !== 'course_creator') || !classId) {
    notFound();
  }

  return <ClassEnrollmentPage courseId={id} classId={classId} />;
}
