import { UserDetailView } from '../_components/UserDetailView';

export default async function UserDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <UserDetailView uuid={uuid} />;
}
