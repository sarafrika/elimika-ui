'use client';

import { useParams } from 'next/navigation';
import { JobApplicantReviewPage } from '@/components/profile-job-marketplace/_components/JobApplicantReviewPage';

export default function OrganisationJobApplicantReviewRoute() {
  const params = useParams();
  const jobUuid = params?.jobUuid as string;
  const applicationUuid = params?.applicationUuid as string;

  return <JobApplicantReviewPage jobUuid={jobUuid} applicationUuid={applicationUuid} />;
}
