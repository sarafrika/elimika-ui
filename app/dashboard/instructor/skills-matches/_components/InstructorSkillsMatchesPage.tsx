'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  isSkillsMatchTab,
  skillsMatchesHref,
} from '@/src/features/dashboard/lib/skills-matches-url';
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

function TabLoading() {
  return (
    <div className='space-y-4 p-4' role='status' aria-label='Loading skills matches'>
      <Skeleton className='h-10 w-64 max-w-full rounded-lg' />
      <Skeleton className='h-80 w-full rounded-xl' />
    </div>
  );
}

const AllMatchesTab = dynamic(() => import('./AllMatchesTab'), { loading: TabLoading });
const JobsTab = dynamic(
  () =>
    import('@/src/features/instructor-jobs/find-work/find-work-page').then(
      module => module.FindWorkPage
    ),
  { loading: TabLoading }
);
const ApplyToTrainTab = dynamic(
  () =>
    import('@/src/features/apply-to-train/apply-to-train-page').then(
      module => module.ApplyToTrainPage
    ),
  { loading: TabLoading }
);
const MyApplicationsTab = dynamic(
  () =>
    import('@/components/profile-job-marketplace/_components/MyJobApplicationsPage').then(
      module => module.MyJobApplicationsPage
    ),
  { loading: TabLoading }
);

const TABS = [
  { id: 'all-matches', label: 'All Matches', icon: Sparkles },
  { id: 'jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { id: 'apply-to-train', label: 'Apply to Train', icon: GraduationCap },
  { id: 'my-applications', label: 'My Applications', icon: FileText },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'workshop', label: 'Workshop', icon: CalendarDays },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function InstructorSkillsMatchesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab = isSkillsMatchTab(requestedTab) ? requestedTab : 'all-matches';
  const tabRowRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<TabId, HTMLButtonElement>());

  useEffect(() => {
    tabRefs.current.get(tab)?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [tab]);

  const handleTabChange = (nextTab: string) => {
    if (!isSkillsMatchTab(nextTab)) return;

    const params = new URLSearchParams(searchParams.toString());
    router.replace(skillsMatchesHref(nextTab, params), { scroll: false });
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    tabRowRef.current?.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    });
  };

  return (
    <div className='w-full min-w-0 px-3 py-4 sm:px-6 sm:py-6'>
      <PageHeader
        eyebrow='INSTRUCTOR SKILLS MATCHES'
        title='Skills Matches'
        description='Discover opportunities for your skills and follow your applications.'
      />

      <Tabs value={tab} onValueChange={handleTabChange} className='min-w-0 gap-0'>
        <div className='mt-4 flex min-w-0 items-center gap-1'>
          <Button
            type='button'
            variant='outline'
            size='icon'
            aria-label='Scroll tabs left'
            onClick={() => scrollTabs('left')}
            className='border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground size-7 rounded-full'
          >
            <ChevronLeft className='size-4' />
          </Button>

          <div
            ref={tabRowRef}
            className='min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          >
            <TabsList
              aria-label='Skills matches sections'
              className='h-auto justify-start gap-2 rounded-none bg-transparent p-0'
            >
              {TABS.map(({ id, label, icon: Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  ref={element => {
                    if (element) {
                      tabRefs.current.set(id, element);
                    } else {
                      tabRefs.current.delete(id);
                    }
                  }}
                  className='border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shrink-0 gap-2 rounded-full border px-4 py-1.5 font-normal data-[state=active]:shadow-sm'
                >
                  <Icon className='size-3.5' />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Button
            type='button'
            variant='outline'
            size='icon'
            aria-label='Scroll tabs right'
            onClick={() => scrollTabs('right')}
            className='border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground size-7 rounded-full'
          >
            <ChevronRight className='size-4' />
          </Button>
        </div>

        <TabsContent value='all-matches' className='min-w-0 py-4'>
          <AllMatchesTab />
        </TabsContent>
        <TabsContent value='jobs' className='min-w-0 py-4'>
          <JobsTab embedded />
        </TabsContent>
        <TabsContent value='apply-to-train' className='min-w-0 py-4'>
          <ApplyToTrainTab embedded />
        </TabsContent>
        <TabsContent value='my-applications' className='min-w-0 py-4'>
          <MyApplicationsTab embedded />
        </TabsContent>
        <TabsContent value='projects' className='min-w-0 py-4'>
          <EmptyState
            icon={FolderKanban}
            title='Projects are not yet available'
            description='Project opportunities will appear here when they become available.'
          />
        </TabsContent>
        <TabsContent value='workshop' className='min-w-0 py-4'>
          <EmptyState
            icon={CalendarDays}
            title='Workshops are not yet available'
            description='Workshop opportunities will appear here when they become available.'
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
