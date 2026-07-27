import { notFound } from 'next/navigation';

import {
  SharedProjectDetailsView,
  getPortfolioContent,
} from '@/components/profile-portfolio';

type InstructorProjectDetailsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function InstructorProjectDetailsPage({
  params,
}: InstructorProjectDetailsPageProps) {
  const { projectId } = await params;
  const content = getPortfolioContent('instructor');
  const project = content.projects.find(item => item.id === projectId);

  if (!project) {
    notFound();
  }

  return <SharedProjectDetailsView role='instructor' projectId={projectId} />;
}
