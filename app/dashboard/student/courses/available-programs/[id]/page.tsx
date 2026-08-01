import AvailableProgramsPage from '@/src/features/dashboard/courses/pages/AvailableProgramsPage';

type WorkspaceAvailableProgramsPageProps = {
  params: Promise<{ domain: string; id: string }>;
};

export default async function WorkspaceAvailableProgramsPage({ params }: WorkspaceAvailableProgramsPageProps) {
  const { id } = await params;

  return <AvailableProgramsPage programId={id} />;
}
