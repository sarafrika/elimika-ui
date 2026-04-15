import { ArrowLeft, CalendarDays, CheckCircle2, Layers3 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { PortfolioSidebar } from './PortfolioSidebar';
import { ProjectDateBadge, StatusLine } from './ProjectMeta';
import { ProjectThumbnail } from './ProjectThumbnail';
import type { PortfolioProject } from './portfolio-data';

type ProjectDetailsViewProps = {
  project: PortfolioProject;
};

export function ProjectDetailsView({ project }: ProjectDetailsViewProps) {
  const Icon = project.icon;

  return (
    <main className='bg-muted/30 text-foreground min-h-screen px-3 py-4 sm:px-5 lg:px-7'>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-4'>
        <header className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <Button variant='ghost' size='sm' className='text-primary mb-2 -ml-2' asChild>
              <Link href='/dashboard/my-portfolio'>
                <ArrowLeft className='size-4' />
                Back to Portfolio
              </Link>
            </Button>
            <h1 className='text-foreground text-2xl font-semibold tracking-normal sm:text-3xl'>
              {project.title}
            </h1>
            <div className='mt-2'>
              <ProjectDateBadge date={project.date} badge={project.badge} />
            </div>
          </div>
          <Button>
            Upload Evidence
            <CheckCircle2 className='size-4' />
          </Button>
        </header>

        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_270px]'>
          <section className='bg-card min-w-0 overflow-hidden rounded-lg border shadow-sm'>
            <div className='grid gap-5 p-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:p-5'>
              <ProjectThumbnail variant={project.accent} />
              <div className='min-w-0 space-y-4'>
                <div className='flex items-start gap-3'>
                  <span className='bg-primary/15 text-primary grid size-12 shrink-0 place-items-center rounded-md'>
                    <Icon className='size-6' />
                  </span>
                  <div>
                    <h2 className='text-foreground text-xl font-semibold'>{project.title}</h2>
                    <p className='text-muted-foreground mt-1 text-sm'>{project.category}</p>
                  </div>
                </div>
                <p className='text-muted-foreground text-sm leading-6'>{project.description}</p>
                <div className='grid gap-3 sm:grid-cols-3'>
                  <div className='rounded-md border p-3'>
                    <p className='text-muted-foreground text-xs'>Evidence</p>
                    <p className='text-foreground mt-1 text-2xl font-semibold'>
                      {project.evidenceCount}
                    </p>
                  </div>
                  <div className='rounded-md border p-3'>
                    <p className='text-muted-foreground text-xs'>Progress</p>
                    <p className='text-foreground mt-1 text-2xl font-semibold'>
                      {project.progress ?? 0}%
                    </p>
                  </div>
                  <div className='rounded-md border p-3'>
                    <p className='text-muted-foreground text-xs'>Status</p>
                    <p className='text-foreground mt-1 text-base font-semibold'>
                      {project.status ?? 'In Review'}
                    </p>
                  </div>
                </div>
                <Progress
                  value={project.progress}
                  className='bg-muted h-2'
                  indicatorClassName='bg-primary'
                />
                <StatusLine status={project.status} sponsor={project.sponsor} />
              </div>
            </div>

            <div className='grid gap-4 border-t p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-5'>
              <article className='space-y-3'>
                <h2 className='text-foreground text-lg font-semibold'>Project Outcome</h2>
                <p className='text-muted-foreground text-sm leading-6'>{project.outcome}</p>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='rounded-lg border p-4'>
                    <div className='text-primary mb-2 flex items-center gap-2 text-sm font-medium'>
                      <Layers3 className='size-4' />
                      Tools Used
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {project.tools.map(tool => (
                        <span
                          key={tool}
                          className='bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 text-xs font-medium'
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className='rounded-lg border p-4'>
                    <div className='text-primary mb-2 flex items-center gap-2 text-sm font-medium'>
                      <CalendarDays className='size-4' />
                      Timeline
                    </div>
                    <p className='text-muted-foreground text-sm leading-6'>
                      Submitted on {project.date} and connected to {project.category} evidence.
                    </p>
                  </div>
                </div>
              </article>

              <aside className='rounded-lg border p-4'>
                <h2 className='text-foreground text-lg font-semibold'>Evidence Checklist</h2>
                <div className='mt-4 space-y-3 text-sm'>
                  {['Project summary', 'Supporting files', 'Review notes', 'Verification'].map(
                    item => (
                      <div key={item} className='flex items-center gap-2'>
                        <CheckCircle2 className='text-success size-4' />
                        <span className='text-muted-foreground'>{item}</span>
                      </div>
                    )
                  )}
                </div>
              </aside>
            </div>
          </section>

          <PortfolioSidebar />
        </div>
      </div>
    </main>
  );
}
