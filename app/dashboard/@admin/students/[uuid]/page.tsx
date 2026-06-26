import { UserDetailView } from '../../users/_components/UserDetailView';

export default async function StudentDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <UserDetailView uuid={uuid} backHref='/dashboard/students' backLabel='Back to students' />;
}
