'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

import { AssetPanel, ProjectsPanel } from './PortfolioCollections';
import { PortfolioSidebar } from './PortfolioSidebar';
import { ProjectSections } from './ProjectSections';
import {
  portfolioAssessments,
  portfolioFiles,
  portfolioProjects,
  portfolioTabs,
  portfolioVideos,
  skillBadges,
  type PortfolioTabId,
} from './portfolio-data';

const studentName = 'Sarah Otieno';

export function PortfolioShell() {
  const [activeTab, setActiveTab] = useState<PortfolioTabId>('dashboard');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'projects':
        return <ProjectsPanel projects={portfolioProjects} />;
      case 'videos':
        return (
          <AssetPanel
            title='Uploaded Videos'
            description='Video evidence attached to the portfolio, including demos, walkthroughs, and presentation recordings.'
            items={portfolioVideos}
            actionLabel='Upload Video'
          />
        );
      case 'assessment':
        return (
          <AssetPanel
            title='Portfolio Assessments'
            description='Reviewed assessments and rubrics connected to portfolio evidence and project submissions.'
            items={portfolioAssessments}
            actionLabel='Add Assessment'
          />
        );
      case 'files':
        return (
          <AssetPanel
            title='Portfolio Files'
            description='Documents, archives, spreadsheets, and other files associated with this portfolio.'
            items={portfolioFiles}
            actionLabel='Upload File'
          />
        );
      case 'skill-badges':
        return (
          <AssetPanel
            title='Skill Badges'
            description='Badges earned from verified project work, assessments, and portfolio milestones.'
            items={skillBadges}
          />
        );
      case 'dashboard':
      default:
        return <ProjectSections onOpenProjects={() => setActiveTab('projects')} />;
    }
  };

  return (
    <main className='bg-muted/30 text-foreground min-h-screen px-3 py-4 sm:px-5 lg:px-7'>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-4'>
        <header className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
            <h1 className='text-foreground text-2xl font-semibold tracking-normal sm:text-3xl'>
              My Portfolio
            </h1>
            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              <Search className='size-4' aria-hidden='true' />
              <span>{studentName}</span>
            </div>
          </div>
        </header>

        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_270px]'>
          <section className='bg-card min-w-0 rounded-lg border shadow-sm'>
            <nav
              className='scrollbar-hidden flex overflow-x-auto border-b px-3 sm:px-5'
              aria-label='Portfolio sections'
            >
              {portfolioTabs.map(tab => (
                <button
                  type='button'
                  key={tab.label}
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

          <PortfolioSidebar />
        </div>
      </div>
    </main>
  );
}
