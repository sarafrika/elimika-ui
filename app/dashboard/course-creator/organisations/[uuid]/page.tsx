import OrganisationDetails from './_components/OrganisationDetails';

export default async function OrganisationPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <OrganisationDetails organisationUuid={uuid} />;
}
