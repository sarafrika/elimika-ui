import { notFound } from 'next/navigation';
import InstructorBookingPage from '@/src/features/dashboard/courses/pages/InstructorBookingPage';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';

type WorkspaceInstructorBookingPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function WorkspaceInstructorBookingPage({
  params,
}: WorkspaceInstructorBookingPageProps) {
  const { domain } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  if (
    normalizedDomain !== 'student' &&
    normalizedDomain !== 'instructor' &&
    normalizedDomain !== 'course_creator'
  ) {
    notFound();
  }

  return <InstructorBookingPage classes={[]} />;
}
