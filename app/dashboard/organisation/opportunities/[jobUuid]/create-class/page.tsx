'use client';

import { useParams } from 'next/navigation';
import { OrganisationCreateClassFromJobPage } from '@/components/profile-job-marketplace/_components/OrganisationCreateClassFromJobPage';

export default function OrganisationCreateClassFromJobRoute() {
  const params = useParams();
  const id = params?.jobUuid as string;

  return <OrganisationCreateClassFromJobPage jobUuid={id} />;
}
