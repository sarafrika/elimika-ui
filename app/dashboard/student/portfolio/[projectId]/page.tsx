import { notFound } from 'next/navigation';

import {
  SharedProjectDetailsView,
  getPortfolioContent,
} from '@/components/profile-portfolio';

type ProjectDetailsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { projectId } = await params;
  const content = getPortfolioContent('student');
  const project = content.projects.find(item => item.id === projectId);

  if (!project) {
    notFound();
  }

  return <SharedProjectDetailsView role='student' projectId={projectId} />;
}
