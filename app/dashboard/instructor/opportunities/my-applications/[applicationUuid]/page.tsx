import { ApplicationDetailPage } from '@/src/features/instructor-jobs/applications/components/application-detail-page';

export default async function InstructorApplicationPage({
  params,
}: {
  params: Promise<{ applicationUuid: string }>;
}) {
  const { applicationUuid } = await params;
  return <ApplicationDetailPage applicationUuid={applicationUuid} />;
}
