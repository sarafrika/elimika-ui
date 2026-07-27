import { AssignmentSubmissionOverlay } from '../_components/AssignmentSubmissionOverlay';

type AssignmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { id } = await params;
  return <AssignmentSubmissionOverlay taskId={id} />;
}
