import { notFound } from 'next/navigation';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';
import ClassProgramDetailsPage from '../../_components/ClassProgramDetaisPage';

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
    normalizedDomain !== 'course_creator' &&
    normalizedDomain !== 'organisation' &&
    normalizedDomain !== 'organisation_user'
  ) {
    notFound();
  }

  return <ClassProgramDetailsPage programId={id} type='program' />;
}
