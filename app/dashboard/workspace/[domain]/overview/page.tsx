import { notFound } from 'next/navigation';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';
import { InstructorOverviewRoute } from '@/src/features/dashboard/instructor-overview/InstructorOverviewRoute';
import { CourseCreatorOverviewPage } from '@/src/features/dashboard/workspace/pages/CourseCreatorOverviewPage';
import StudentOverviewPage from '@/src/features/dashboard/workspace/pages/StudentOverviewPage';

type WorkspaceOverviewPageProps = {
  params: Promise<{ domain: string }>
};

export default async function WorkspaceOverviewPage({ params }: WorkspaceOverviewPageProps) {
  const { domain } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  switch (normalizedDomain) {
    case 'student':
      return <StudentOverviewPage />;
    case 'instructor':
      return <InstructorOverviewRoute />;
    case 'course_creator':
      return <CourseCreatorOverviewPage />;
    default:
      notFound();
  }
}
