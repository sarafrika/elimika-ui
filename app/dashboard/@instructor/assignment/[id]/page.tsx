import { notFound } from 'next/navigation';
import { AssignmentSubmissionOverlay } from '../_components/AssignmentSubmissionOverlay';
import { getAssignmentById } from '../_components/assignment-data';

type AssignmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { id } = await params;
  const assignment = getAssignmentById(id);

  if (!assignment) {
    notFound();
  }

  return <AssignmentSubmissionOverlay assignment={assignment} />;
}
