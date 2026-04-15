import { ChevronDown, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  CompactProjectRow,
  CourseProgressCard,
  FeaturedProjectCard,
  RecentProjectCard,
} from './ProjectCard';
import { compactProjects, featuredProjects, recentProject } from './portfolio-data';

type ProjectSectionsProps = {
  onOpenProjects: () => void;
};

export function ProjectSections({ onOpenProjects }: ProjectSectionsProps) {
  return (
    <div className='space-y-5 p-3 sm:p-5'>
      <section aria-labelledby='recent-updates' className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h2 id='recent-updates' className='text-foreground text-lg font-semibold'>
            Recent Portfolio Updates
          </h2>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='min-w-36 justify-between'
            onClick={onOpenProjects}
          >
            All Projects
            <ChevronDown className='size-4' />
          </Button>
        </div>
        <RecentProjectCard project={recentProject} />
      </section>

      <section aria-labelledby='my-projects-list' className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h2 id='my-projects-list' className='text-foreground text-lg font-semibold'>
            My Projects
          </h2>
          <Button type='button' variant='ghost' size='sm' className='text-primary'>
            View Details
          </Button>
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          <div className='bg-card overflow-hidden rounded-lg border shadow-sm'>
            {compactProjects.slice(0, 1).map(project => (
              <CompactProjectRow key={project.title} project={project} />
            ))}
          </div>
          <CourseProgressCard />
        </div>
      </section>

      <section aria-labelledby='my-projects-grid' className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h2 id='my-projects-grid' className='text-foreground text-lg font-semibold'>
            My Projects
          </h2>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-primary'
            onClick={onOpenProjects}
          >
            View All 6 Projects
            <ChevronRight className='size-4' />
          </Button>
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          {featuredProjects.map(project => (
            <FeaturedProjectCard key={project.title} project={project} />
          ))}
        </div>
        <div className='flex justify-center pt-1'>
          <Button type='button' variant='outline' className='min-w-48' onClick={onOpenProjects}>
            View All 6 Projects
            <ChevronRight className='size-4' />
          </Button>
        </div>
      </section>
    </div>
  );
}
