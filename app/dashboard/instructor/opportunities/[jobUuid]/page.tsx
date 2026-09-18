import { JobPage } from '@/src/features/instructor-jobs/job-page/job-page';

export default async function InstructorJobPage({
  params,
}: {
  params: Promise<{ jobUuid: string }>;
}) {
  const { jobUuid } = await params;
  return <JobPage jobUuid={jobUuid} />;
}
