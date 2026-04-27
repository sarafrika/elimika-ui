'use client'

import { OrganisationJobApplicationsPage } from '@/components/profile-job-marketplace/_components/OrganisationJobApplicationsPage';
import { useParams } from 'next/navigation';

export default function OrganisationJobApplicationsRoute() {
  const params = useParams()
  const id = params?.jobUuid as string

  return <OrganisationJobApplicationsPage jobUuid={id} />;
}
