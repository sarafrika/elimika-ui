import { notFound } from 'next/navigation';
import { SharedCoursesPage } from './_components/SharedCoursesPage';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';

type WorkspaceCoursesPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function WorkspaceCoursesPage({ params }: WorkspaceCoursesPageProps) {
  const { domain } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);

  if (!normalizedDomain) {
    notFound();
  }

  return <SharedCoursesPage domain={normalizedDomain} />;
}
