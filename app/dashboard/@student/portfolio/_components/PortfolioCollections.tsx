import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { CollectionItemCard, CompactProjectRow } from './ProjectCard';
import type { PortfolioAsset, PortfolioProject } from './portfolio-data';

type SectionHeaderProps = {
  title: string;
  description: string;
  actionLabel?: string;
};

function SectionHeader({ title, description, actionLabel }: SectionHeaderProps) {
  return (
    <div className='flex flex-wrap items-start justify-between gap-3'>
      <div>
        <h2 className='text-foreground text-lg font-semibold'>{title}</h2>
        <p className='text-muted-foreground mt-1 max-w-2xl text-sm leading-5'>{description}</p>
      </div>
      {actionLabel ? (
        <Button type='button' variant='outline' size='sm'>
          {actionLabel}
          <ChevronRight className='size-4' />
        </Button>
      ) : null}
    </div>
  );
}

type ProjectsPanelProps = {
  projects: PortfolioProject[];
};

export function ProjectsPanel({ projects }: ProjectsPanelProps) {
  return (
    <div className='space-y-4 p-3 sm:p-5'>
      <SectionHeader
        title='All Portfolio Projects'
        description='A complete list of projects in this portfolio, including verification status, evidence progress, and supporting artifacts.'
      />
      <div className='bg-card overflow-hidden rounded-lg border shadow-sm'>
        {projects.map(project => (
          <CompactProjectRow key={project.id} project={project} showThumbnail />
        ))}
      </div>
    </div>
  );
}

type AssetPanelProps = {
  title: string;
  description: string;
  items: PortfolioAsset[];
  actionLabel?: string;
};

export function AssetPanel({ title, description, items, actionLabel }: AssetPanelProps) {
  return (
    <div className='space-y-4 p-3 sm:p-5'>
      <SectionHeader title={title} description={description} actionLabel={actionLabel} />
      <div className='grid gap-3'>
        {items.map(item => (
          <CollectionItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
