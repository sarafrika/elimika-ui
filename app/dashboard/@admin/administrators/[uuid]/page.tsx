import { UserDetailView } from '../../users/_components/UserDetailView';

export default async function AdministratorDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <UserDetailView uuid={uuid} backHref='/dashboard/administrators' backLabel='Back to administrators' />;
}
