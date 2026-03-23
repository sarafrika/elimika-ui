import { notFound } from 'next/navigation';
import CourseDetailsPage from '@/src/features/dashboard/courses/pages/CourseDetailsPage';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';

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
    normalizedDomain !== 'course_creator'
  ) {
    notFound();
  }

  return <CourseDetailsPage courseId={id} />;
}
