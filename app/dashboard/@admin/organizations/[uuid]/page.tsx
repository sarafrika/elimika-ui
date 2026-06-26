import { OrganizationDetailView } from '../_components/OrganizationDetailView';

export default async function OrganizationDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <OrganizationDetailView uuid={uuid} />;
}
