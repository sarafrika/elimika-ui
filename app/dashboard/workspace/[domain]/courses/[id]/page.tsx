import { notFound } from 'next/navigation';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';
import ClassCourseDetailsPage from '../_components/ClassCourseDetailsPage';

type WorkspaceCourseDetailsPageProps = {
  params: Promise<{ domain: string; id: string }>;
};

export default async function WorkspaceCourseDetailsPage({
  params,
}: WorkspaceCourseDetailsPageProps) {
  const { domain, id } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  if (
    normalizedDomain !== 'student' &&
    normalizedDomain !== 'instructor' &&
    normalizedDomain !== 'course_creator' &&
    normalizedDomain !== 'organisation' &&
    normalizedDomain !== 'organisation_user'
  ) {
    notFound();
  }

  return <ClassCourseDetailsPage courseId={id} type='course' />;
}
