'use client';

import { useParams } from 'next/navigation';

import { JobApplicantReviewPage } from '@/components/profile-job-marketplace/_components/JobApplicantReviewPage';

export default function OrganisationJobApplicantRoute() {
  const params = useParams<{ jobUuid: string; applicationUuid: string }>();
  return (
    <JobApplicantReviewPage jobUuid={params.jobUuid} applicationUuid={params.applicationUuid} />
  );
}
