import { UserDetailView } from '../../users/_components/UserDetailView';

export default async function InstructorDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <UserDetailView uuid={uuid} backHref='/dashboard/admin/instructors' backLabel='Back to instructors' />;
}
