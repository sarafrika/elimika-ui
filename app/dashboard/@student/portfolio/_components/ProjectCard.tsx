import { ChevronRight, Clock3, Play } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { ProjectDateBadge, StatusLine } from './ProjectMeta';
import { ProjectThumbnail } from './ProjectThumbnail';
import type { PortfolioAsset, PortfolioProject } from './portfolio-data';

const getProjectHref = (projectId: string) => `/dashboard/portfolio/${projectId}`;

type RecentProjectCardProps = {
  project: PortfolioProject;
};

export function RecentProjectCard({ project }: RecentProjectCardProps) {
  return (
    <article className='bg-card rounded-lg border p-3 shadow-sm sm:p-4'>
      <div className='grid gap-4 md:grid-cols-[210px_minmax(0,1fr)_170px]'>
        <ProjectThumbnail variant={project.accent} compact />
        <div className='min-w-0 space-y-3'>
          <div className='space-y-1.5'>
            <h3 className='text-foreground text-lg font-semibold'>{project.title}</h3>
            <ProjectDateBadge date={project.date} badge={project.badge} />
          </div>
          <p className='text-muted-foreground line-clamp-2 text-sm'>{project.description}</p>
          <StatusLine status='verified' sponsor={project.category} muted />
        </div>
        <div className='border-border flex flex-col justify-between md:border-l md:pl-4'>
          <Button variant='outline' size='sm' className='self-start md:self-end' asChild>
            <Link href={getProjectHref(project.id)}>View Details</Link>
          </Button>
          <div className='mt-3 space-y-2 md:mt-0'>
            <StatusLine status={project.status} sponsor={project.sponsor} />
          </div>
        </div>
      </div>
    </article>
  );
}

type CompactProjectRowProps = {
  project: PortfolioProject;
  showThumbnail?: boolean;
};

export function CompactProjectRow({ project, showThumbnail }: CompactProjectRowProps) {
  const Icon = project.icon;

  return (
    <article className='grid gap-3 border-t px-4 py-3 first:border-t-0 md:grid-cols-[minmax(0,1fr)_150px] md:items-center'>
      <div className='grid min-w-0 gap-3 sm:grid-cols-[auto_minmax(0,1fr)]'>
        {showThumbnail ? (
          <div className='w-full sm:w-36'>
            <ProjectThumbnail variant={project.accent} compact />
          </div>
        ) : null}
        <div className='min-w-0 space-y-3'>
          <div className='flex items-start gap-3'>
            <span className='bg-primary/15 text-primary grid size-9 shrink-0 place-items-center rounded-full'>
              <Icon className='size-5' />
            </span>
            <div className='min-w-0'>
              <h4 className='text-foreground truncate text-base font-semibold'>{project.title}</h4>
              <ProjectDateBadge date={project.date} badge={project.badge} />
            </div>
          </div>
          <p className='text-muted-foreground line-clamp-2 text-sm'>{project.description}</p>
          <StatusLine status={project.status} sponsor={project.sponsor} muted />
        </div>
      </div>
      <div className='space-y-3'>
        <Button variant='outline' size='sm' className='w-full justify-center' asChild>
          <Link href={getProjectHref(project.id)}>View Details</Link>
        </Button>
        <Progress
          value={project.progress}
          className='bg-muted h-2'
          indicatorClassName='bg-primary/55'
        />
      </div>
    </article>
  );
}

type CollectionItemCardProps = {
  item: PortfolioAsset;
};

export function CollectionItemCard({ item }: CollectionItemCardProps) {
  const Icon = item.icon;

  return (
    <article className='bg-card grid gap-4 rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center'>
      <span className='bg-primary/15 text-primary grid size-12 shrink-0 place-items-center rounded-md'>
        <Icon className='size-6' />
      </span>
      <div className='min-w-0 space-y-3'>
        <div>
          <h3 className='text-foreground text-base font-semibold'>{item.title}</h3>
          <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm'>
            <span>{item.date}</span>
            <span>{item.category}</span>
            <span>{item.meta}</span>
          </div>
        </div>
        <p className='text-muted-foreground text-sm leading-5'>{item.description}</p>
      </div>
      <div className='flex items-center gap-3 sm:flex-col sm:items-end'>
        {item.status ? (
          <span className='bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 text-xs font-medium'>
            {item.status}
          </span>
        ) : null}
        {item.rating ? (
          <span className='text-[color-mix(in_srgb,var(--el-accent-amber)_90%,var(--foreground))]'>
            {'★'.repeat(item.rating)}
            <span className='text-muted-foreground/35'>{'★'.repeat(5 - item.rating)}</span>
          </span>
        ) : null}
      </div>
    </article>
  );
}

type FeaturedProjectCardProps = {
  project: PortfolioProject;
};

export function FeaturedProjectCard({ project }: FeaturedProjectCardProps) {
  const Icon = project.icon;

  return (
    <article className='bg-card overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md'>
      <div className='flex items-center justify-between gap-3 border-b px-4 py-3'>
        <h3 className='text-foreground truncate text-base font-semibold'>{project.title}</h3>
        <Button variant='outline' size='sm' className='h-8 shrink-0 px-3 text-xs' asChild>
          <Link href={getProjectHref(project.id)}>View Details</Link>
        </Button>
      </div>
      <div className='grid gap-4 p-4 sm:grid-cols-[145px_minmax(0,1fr)]'>
        <ProjectThumbnail variant={project.accent} compact />
        <div className='min-w-0 space-y-2'>
          <h4 className='text-foreground text-lg font-semibold'>{project.title}</h4>
          <p className='text-muted-foreground text-sm'>{project.date}</p>
          <p className='text-muted-foreground text-sm leading-5'>{project.description}</p>
        </div>
      </div>
      <footer className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm'>
        <span className='text-primary inline-flex items-center gap-2 font-medium'>
          <Icon className='size-4' />
          {project.badge}
        </span>
        <div className='flex min-w-24 flex-1 items-center gap-2 sm:max-w-40'>
          <Progress
            value={project.progress}
            className='bg-muted h-1.5'
            indicatorClassName='bg-[color-mix(in_srgb,var(--primary)_60%,var(--el-accent-azure))]'
          />
          <span className='flex gap-1'>
            {[0, 1, 2].map(dot => (
              <span
                key={dot}
                className={cn('size-2 rounded-full', dot === 0 ? 'bg-primary/50' : 'bg-muted')}
              />
            ))}
          </span>
        </div>
        <Button variant='ghost' size='sm' className='text-primary h-8 px-2' asChild>
          <Link href={getProjectHref(project.id)}>
            <span>View Details</span>
            <ChevronRight className='size-4' />
          </Link>
        </Button>
      </footer>
    </article>
  );
}

export function CourseProgressCard() {
  return (
    <article className='bg-card overflow-hidden rounded-lg border shadow-sm'>
      <div className='flex items-center justify-between border-b px-4 py-3'>
        <h3 className='text-foreground text-base font-semibold'>Enroll dae Details</h3>
        <Button variant='outline' size='sm' className='h-8 px-3' asChild>
          <Link href={getProjectHref('graphic-design-portfolio')}>View Details</Link>
        </Button>
      </div>
      <div className='flex items-center gap-4 p-4'>
        <span className='bg-primary/15 text-primary grid size-12 place-items-center rounded-full'>
          <Clock3 className='size-6' />
        </span>
        <div className='min-w-0 flex-1 space-y-4'>
          <h4 className='text-foreground text-base font-semibold'>Graphic Design Portfolio</h4>
          <Progress value={72} className='bg-muted h-2' indicatorClassName='bg-primary/35' />
          <div className='flex items-center gap-3'>
            <Progress
              value={58}
              className='bg-muted h-2 max-w-40'
              indicatorClassName='bg-primary/20'
            />
            <span className='flex gap-1'>
              {[0, 1].map(dot => (
                <span key={dot} className='bg-muted size-2 rounded-full' />
              ))}
            </span>
          </div>
        </div>
      </div>
      <footer className='flex justify-end border-t px-4 py-3'>
        <Button variant='outline' size='sm' asChild>
          <Link href={getProjectHref('graphic-design-portfolio')}>View Details</Link>
        </Button>
      </footer>
    </article>
  );
}

export function VideoPlayBadge() {
  return (
    <span className='bg-foreground/65 text-background grid size-11 place-items-center rounded-full'>
      <Play className='ml-0.5 size-5 fill-current' />
    </span>
  );
}
