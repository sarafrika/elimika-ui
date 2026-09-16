import { HiredJobDetailsPage } from '@/components/profile-job-marketplace/_components/HiredJobDetailsPage';

export default async function InstructorHiredJobPage({
  params,
}: {
  params: Promise<{ jobUuid: string }>;
}) {
  const { jobUuid } = await params;
  return <HiredJobDetailsPage jobUuid={jobUuid} />;
}
