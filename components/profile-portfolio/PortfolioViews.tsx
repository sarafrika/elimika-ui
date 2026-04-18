'use client';

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Layers3,
  Play,
  Search,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import type {
  PortfolioAsset,
  PortfolioProject,
  PortfolioRole,
  PortfolioTabId,
} from './data';
import { getPortfolioContent } from './data';

const getPortfolioHref = (projectId?: string) =>
  projectId ? `/dashboard/portfolio/${projectId}` : '/dashboard/portfolio';

function ProjectThumbnail({
  variant,
  compact,
}: {
  variant: 'document' | 'video' | 'presentation';
  compact?: boolean;
}) {
  const isVideo = variant === 'video';
  const isPresentation = variant === 'presentation';

  return (
    <div
      className={cn(
        'bg-secondary relative overflow-hidden rounded-md border shadow-inner',
        compact ? 'h-24 w-full sm:h-28' : 'h-28 w-full sm:h-[118px]'
      )}
      aria-hidden='true'
    >
      <div className='absolute inset-0 bg-[linear-gradient(135deg,var(--el-accent-azure),var(--el-brand-100)_52%,var(--el-neutral-0))]' />
      <div className='bg-card absolute top-3 left-3 h-[72%] w-[58%] rounded-sm shadow-sm'>
        <div className='h-4 rounded-t-sm bg-[color-mix(in_srgb,var(--primary)_62%,var(--el-accent-azure))]' />
        <div className='space-y-2 p-2'>
          <div className='bg-muted h-2 w-3/4 rounded-full' />
          <div className='h-2 w-1/2 rounded-full bg-[color-mix(in_srgb,var(--el-accent-amber)_75%,var(--card))]' />
          <div className='bg-muted h-2 w-2/3 rounded-full' />
          <div className='h-2 w-1/3 rounded-full bg-[color-mix(in_srgb,var(--success)_55%,var(--card))]' />
        </div>
      </div>
      <div className='bg-card absolute right-4 bottom-3 h-[58%] w-[45%] rounded-sm shadow-md'>
        <div className='h-3 rounded-t-sm bg-[color-mix(in_srgb,var(--primary)_72%,var(--card))]' />
        <div className='space-y-1.5 p-2'>
          <div className='bg-muted h-1.5 w-4/5 rounded-full' />
          <div className='bg-muted h-1.5 w-3/5 rounded-full' />
          <div className='h-1.5 w-2/3 rounded-full bg-[color-mix(in_srgb,var(--el-accent-amber)_70%,var(--card))]' />
        </div>
      </div>
      <div className='text-primary-foreground absolute top-8 left-5 grid size-7 place-items-center rounded-sm bg-[color-mix(in_srgb,var(--primary)_80%,var(--card))]'>
        <span className='text-base leading-none'>+</span>
      </div>
      {isPresentation ? (
        <div className='absolute top-5 right-5 flex gap-1'>
          {[0, 1, 2].map(item => (
            <span key={item} className='bg-primary/60 size-2 rounded-full' />
          ))}
        </div>
      ) : null}
      <Search className='text-card absolute top-3 right-3 size-4' />
      {isVideo ? (
        <div className='bg-foreground/10 absolute inset-0 grid place-items-center'>
          <span className='bg-foreground/65 text-background grid size-12 place-items-center rounded-full shadow-lg'>
            <Play className='ml-0.5 size-6 fill-current' />
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ProjectDateBadge({ date, badge }: { date: string; badge: string }) {
  return (
    <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
      <span>{date}</span>
      <Badge
        variant='secondary'
        className='text-foreground border-transparent bg-[color-mix(in_srgb,var(--el-accent-amber)_24%,var(--card))] px-3 text-[11px] font-medium'
      >
        {badge}
      </Badge>
    </div>
  );
}

function StatusLine({
  status,
  sponsor,
  muted,
}: {
  status?: 'approved' | 'verified';
  sponsor?: string;
  muted?: boolean;
}) {
  if (!status && !sponsor) {
    return null;
  }

  return (
    <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-sm'>
      {status === 'approved' ? (
        <span className='text-success inline-flex items-center gap-1.5 font-semibold'>
          <CheckCircle2 className='fill-success text-success-foreground size-4' />
          Approved
        </span>
      ) : null}

      {status === 'verified' ? (
        <span className='text-primary inline-flex items-center gap-1.5 font-semibold'>
          <CheckCircle2 className='size-4' />
          Verified
        </span>
      ) : null}

      {sponsor ? (
        <span
          className={cn(
            'flex min-w-0 items-start gap-1.5 font-medium',
            muted && 'text-muted-foreground'
          )}
        >
          <CheckCircle2 className='text-primary mt-0.5 size-4 shrink-0' />
          <span className='min-w-0 leading-snug'>
            Verified by <strong className='text-primary break-words'>{sponsor}</strong>
          </span>
        </span>
      ) : null}
    </div>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <span className='inline-flex items-center gap-0.5' aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={cn(
            'text-base leading-none',
            star <= value
              ? 'text-[color-mix(in_srgb,var(--el-accent-amber)_90%,var(--foreground))]'
              : 'text-muted-foreground/35'
          )}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function RecentProjectCard({ project }: { project: PortfolioProject }) {
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
            <Link href={getPortfolioHref(project.id)}>View Details</Link>
          </Button>
          <div className='mt-3 space-y-2 md:mt-0'>
            <StatusLine status={project.status} sponsor={project.sponsor} />
          </div>
        </div>
      </div>
    </article>
  );
}

function CompactProjectRow({
  project,
  showThumbnail,
}: {
  project: PortfolioProject;
  showThumbnail?: boolean;
}) {
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
          <Link href={getPortfolioHref(project.id)}>View Details</Link>
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

function CollectionItemCard({ item }: { item: PortfolioAsset }) {
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
        {item.rating ? <Rating value={item.rating} /> : null}
      </div>
    </article>
  );
}

function FeaturedProjectCard({ project }: { project: PortfolioProject }) {
  const Icon = project.icon;

  return (
    <article className='bg-card overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md'>
      <div className='flex items-center justify-between gap-3 border-b px-4 py-3'>
        <h3 className='text-foreground truncate text-base font-semibold'>{project.title}</h3>
        <Button variant='outline' size='sm' className='h-8 shrink-0 px-3 text-xs' asChild>
          <Link href={getPortfolioHref(project.id)}>View Details</Link>
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
        </div>
        <Button variant='ghost' size='sm' className='text-primary h-8 px-2' asChild>
          <Link href={getPortfolioHref(project.id)}>
            <span>View Details</span>
            <ChevronRight className='size-4' />
          </Link>
        </Button>
      </footer>
    </article>
  );
}

function CourseProgressCard({ project }: { project: PortfolioProject }) {
  return (
    <article className='bg-card overflow-hidden rounded-lg border shadow-sm'>
      <div className='flex items-center justify-between border-b px-4 py-3'>
        <h3 className='text-foreground text-base font-semibold'>Portfolio Progress Snapshot</h3>
        <Button variant='outline' size='sm' className='h-8 px-3' asChild>
          <Link href={getPortfolioHref(project.id)}>View Details</Link>
        </Button>
      </div>
      <div className='flex items-center gap-4 p-4'>
        <span className='bg-primary/15 text-primary grid size-12 place-items-center rounded-full'>
          <Clock3 className='size-6' />
        </span>
        <div className='min-w-0 flex-1 space-y-4'>
          <h4 className='text-foreground text-base font-semibold'>{project.title}</h4>
          <Progress value={project.progress} className='bg-muted h-2' indicatorClassName='bg-primary/35' />
          <div className='text-muted-foreground flex items-center justify-between text-sm'>
            <span>{project.evidenceCount} evidence items</span>
            <span>{project.progress ?? 0}% complete</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function SectionHeader({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
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

function ProjectsPanel({ content }: { content: ReturnType<typeof getPortfolioContent> }) {
  return (
    <div className='space-y-4 p-3 sm:p-5'>
      <SectionHeader
        title={content.copy.projectsHeading}
        description={content.copy.projectListDescription}
      />
      <div className='bg-card overflow-hidden rounded-lg border shadow-sm'>
        {content.projects.map(project => (
          <CompactProjectRow key={project.id} project={project} showThumbnail />
        ))}
      </div>
    </div>
  );
}

function AssetPanel({
  title,
  description,
  items,
  actionLabel,
}: {
  title: string;
  description: string;
  items: PortfolioAsset[];
  actionLabel?: string;
}) {
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

function SidebarCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='bg-card rounded-lg border p-4 shadow-sm' aria-labelledby={title}>
      <h2 id={title} className='text-foreground mb-3 text-lg font-semibold'>
        {title}
      </h2>
      {children}
    </section>
  );
}

function PortfolioSidebar({ content }: { content: ReturnType<typeof getPortfolioContent> }) {
  const InsightIcon = content.insightHighlight.icon;
  const verifiedEvidence = content.projects.reduce(
    (total, project) => total + (project.status ? 1 : 0),
    0
  );
  const totalEvidence = content.projects.reduce((total, project) => total + project.evidenceCount, 0);

  return (
    <aside className='grid gap-4 lg:grid-cols-2 xl:grid-cols-1 xl:content-start'>
      <SidebarCard title={content.copy.sidebarInsightTitle}>
        <div className='bg-secondary/40 rounded-md border p-3'>
          <div className='grid grid-cols-3 gap-2 text-center'>
            {content.evidenceItems.map(item => (
              <div key={item.label}>
                <p className='text-foreground text-2xl font-semibold'>{item.value}</p>
                <p className='text-muted-foreground text-xs leading-4'>{item.label}</p>
              </div>
            ))}
          </div>
          <div className='my-4 border-t' />
          <div className='space-y-3'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground font-medium'>Total Evidence:</span>
              <span className='text-foreground font-semibold'>{totalEvidence} tracked</span>
            </div>
            <Progress
              value={Math.min(100, verifiedEvidence * 20)}
              className='bg-muted h-3'
              indicatorClassName='bg-[color-mix(in_srgb,var(--el-accent-amber)_78%,var(--warning))]'
            />
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Pending Verifications:</span>
                <strong className='text-foreground'>
                  {Math.max(content.projects.length - verifiedEvidence, 0)}
                </strong>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Verified Evidence:</span>
                <strong className='text-foreground'>{verifiedEvidence}</strong>
              </div>
            </div>
          </div>
        </div>
      </SidebarCard>

      <SidebarCard title={content.copy.sidebarHighlightsTitle}>
        <div className='bg-secondary/30 divide-y rounded-md border'>
          {content.highlights.map(item => {
            const Icon = item.icon;

            return (
              <article key={item.title} className='flex items-center gap-3 p-3'>
                <span className='text-primary grid size-9 shrink-0 place-items-center rounded-md'>
                  <Icon className='size-6' />
                </span>
                <div className='min-w-0'>
                  <h3 className='text-foreground truncate text-sm font-semibold'>{item.title}</h3>
                  <Rating value={item.rating} />
                </div>
              </article>
            );
          })}
        </div>
        <Button className='mt-4 w-full'>
          {content.copy.sidebarReportAction}
          <ChevronRight className='size-4' />
        </Button>
      </SidebarCard>

      <SidebarCard title={content.copy.sidebarLedgerTitle}>
        <div className='bg-secondary/30 rounded-md border'>
          <div className='text-foreground flex items-center gap-2 border-b px-3 py-2 text-sm font-medium'>
            <Trophy className='text-primary size-4' />
            {content.copy.sidebarLedgerTitle}
          </div>
          <div className='p-3'>
            <p className='text-muted-foreground text-sm'>{content.copy.sidebarLedgerLabel}</p>
            <article className='mt-3 flex items-center gap-3'>
              <span className='bg-success text-success-foreground grid size-10 shrink-0 place-items-center rounded-md'>
                <InsightIcon className='size-6' />
              </span>
              <div>
                <h3 className='text-foreground text-sm font-semibold'>
                  {content.insightHighlight.title}
                </h3>
                <Rating value={content.insightHighlight.rating} />
              </div>
            </article>
            <Progress value={78} className='bg-muted mt-3 h-2' indicatorClassName='bg-success' />
          </div>
        </div>
        <Button className='mt-4 w-full'>
          {content.copy.sidebarUploadAction}
          <ChevronRight className='size-4' />
        </Button>
      </SidebarCard>
    </aside>
  );
}

function ProjectSections({
  content,
  onOpenProjects,
}: {
  content: ReturnType<typeof getPortfolioContent>;
  onOpenProjects: () => void;
}) {
  const recentProject = content.projects[0];
  const compactProjects = content.projects.slice(0, 1);
  const featuredProjects = content.projects.slice(0, 2);
  const featuredCta = content.copy.featuredProjectsCta;

  return (
    <div className='space-y-5 p-3 sm:p-5'>
      <section aria-labelledby='recent-updates' className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h2 id='recent-updates' className='text-foreground text-lg font-semibold'>
            {content.copy.recentUpdatesHeading}
          </h2>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='min-w-36 justify-between'
            onClick={onOpenProjects}
          >
            {content.copy.recentUpdatesAction}
            <ChevronDown className='size-4' />
          </Button>
        </div>
        {recentProject ? <RecentProjectCard project={recentProject} /> : null}
      </section>

      <section aria-labelledby='portfolio-primary-projects' className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h2 id='portfolio-primary-projects' className='text-foreground text-lg font-semibold'>
            {content.copy.primaryProjectsHeading}
          </h2>
          <Button type='button' variant='ghost' size='sm' className='text-primary'>
            View Details
          </Button>
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          <div className='bg-card overflow-hidden rounded-lg border shadow-sm'>
            {compactProjects.map(project => (
              <CompactProjectRow key={project.id} project={project} />
            ))}
          </div>
          {recentProject ? <CourseProgressCard project={recentProject} /> : null}
        </div>
      </section>

      <section aria-labelledby='portfolio-featured-projects' className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h2 id='portfolio-featured-projects' className='text-foreground text-lg font-semibold'>
            {content.copy.featuredProjectsHeading}
          </h2>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-primary'
            onClick={onOpenProjects}
          >
            {featuredCta}
            <ChevronRight className='size-4' />
          </Button>
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          {featuredProjects.map(project => (
            <FeaturedProjectCard key={project.id} project={project} />
          ))}
        </div>
        <div className='flex justify-center pt-1'>
          <Button type='button' variant='outline' className='min-w-48' onClick={onOpenProjects}>
            {featuredCta}
            <ChevronRight className='size-4' />
          </Button>
        </div>
      </section>
    </div>
  );
}

export function SharedPortfolioShell({ role }: { role: PortfolioRole }) {
  const content = getPortfolioContent(role);
  const [activeTab, setActiveTab] = useState<PortfolioTabId>('dashboard');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'projects':
        return <ProjectsPanel content={content} />;
      case 'videos':
        return (
          <AssetPanel
            title={content.copy.videosTitle}
            description={content.copy.videosDescription}
            items={content.videos}
            actionLabel={content.copy.videosActionLabel}
          />
        );
      case 'assessment':
        return (
          <AssetPanel
            title={content.copy.assessmentsTitle}
            description={content.copy.assessmentsDescription}
            items={content.assessments}
            actionLabel={content.copy.assessmentsActionLabel}
          />
        );
      case 'files':
        return (
          <AssetPanel
            title={content.copy.filesTitle}
            description={content.copy.filesDescription}
            items={content.files}
            actionLabel={content.copy.filesActionLabel}
          />
        );
      case 'skill-badges':
        return (
          <AssetPanel
            title={content.copy.badgesTitle}
            description={content.copy.badgesDescription}
            items={content.badges}
          />
        );
      case 'dashboard':
      default:
        return <ProjectSections content={content} onOpenProjects={() => setActiveTab('projects')} />;
    }
  };

  return (
    <main className='bg-muted/30 text-foreground min-h-screen px-3 py-4 sm:px-5 lg:px-7'>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-4'>
        <header className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
            <h1 className='text-foreground text-2xl font-semibold tracking-normal sm:text-3xl'>
              {content.copy.pageTitle}
            </h1>
            {/* <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              <Search className='size-4' aria-hidden='true' />
              <span>{content.copy.ownerName}</span>
            </div> */}
          </div>
        </header>

        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_270px]'>
          <section className='bg-card min-w-0 rounded-lg border shadow-sm'>
            <nav
              className='scrollbar-hidden flex overflow-x-auto border-b px-3 sm:px-5'
              aria-label={`${content.copy.ownerLabel} sections`}
            >
              {content.tabs.map(tab => (
                <button
                  type='button'
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'text-muted-foreground hover:text-foreground focus-visible:ring-ring relative min-h-12 shrink-0 px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:px-4',
                    activeTab === tab.id && 'text-foreground'
                  )}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  {tab.label}
                  {activeTab === tab.id ? (
                    <span className='bg-primary absolute inset-x-0 bottom-0 h-0.5 rounded-full' />
                  ) : null}
                </button>
              ))}
            </nav>

            {renderActiveTab()}
          </section>

          <PortfolioSidebar content={content} />
        </div>
      </div>
    </main>
  );
}

export function SharedProjectDetailsView({
  role,
  projectId,
}: {
  role: PortfolioRole;
  projectId: string;
}) {
  const content = getPortfolioContent(role);
  const project = content.projects.find(item => item.id === projectId);

  if (!project) {
    return null;
  }

  const Icon = project.icon;

  return (
    <main className='bg-muted/30 text-foreground min-h-screen px-3 py-4 sm:px-5 lg:px-7'>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-4'>
        <header className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <Button variant='ghost' size='sm' className='text-primary mb-2 -ml-2' asChild>
              <Link href={getPortfolioHref()}>
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
            {content.copy.sidebarUploadAction}
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

          <PortfolioSidebar content={content} />
        </div>
      </div>
    </main>
  );
}
