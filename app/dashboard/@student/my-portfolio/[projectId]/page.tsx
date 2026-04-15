import { notFound } from 'next/navigation';

import { ProjectDetailsView } from '../_components/ProjectDetailsView';
import { portfolioProjects } from '../_components/portfolio-data';

type ProjectDetailsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { projectId } = await params;
  const project = portfolioProjects.find(item => item.id === projectId);

  if (!project) {
    notFound();
  }

  return <ProjectDetailsView project={project} />;
}
