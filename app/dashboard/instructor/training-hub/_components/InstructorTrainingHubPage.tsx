'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FolderKanban,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { EmptyState } from '../../../../../components/ui/empty-state';
import { TrainingHubSectionHeader } from './TrainingHubSectionHeader';

function TabLoading() {
  return (
    <div className='space-y-4 p-4' role='status' aria-label='Loading training hub content'>
      <Skeleton className='h-10 w-64 max-w-full rounded-lg' />
      <Skeleton className='h-80 w-full rounded-xl' />
    </div>
  );
}

const MyCoursesTab = dynamic(
  () => import('@/src/features/dashboard/courses/pages/InstructorApprovedCoursesPage'),
  { loading: TabLoading }
);
const ClassesTab = dynamic(
  () => import('./TrainingHubClassesTab').then(module => module.TrainingHubClassesTab),
  { loading: TabLoading }
);
const AssignmentTab = dynamic(
  () =>
    import('../../assignment/_components/AssignmentPageClient').then(
      module => module.AssignmentPageClient
    ),
  { loading: TabLoading }
);
const AssessmentTab = dynamic(
  () =>
    import('@/components/assessment/shared-assessment-workspace').then(
      module => module.SharedAssessmentWorkspace
    ),
  { loading: TabLoading }
);
const AttendanceTab = dynamic(
  () => import('./TrainingHubAttendanceTab').then(module => module.TrainingHubAttendanceTab),
  { loading: TabLoading }
);

const TABS = [
  { id: 'my-courses', label: 'My Courses', icon: BookOpen },
  { id: 'classes', label: 'Classes', icon: Users },
  { id: 'assignment', label: 'Assignment', icon: ClipboardList },
  { id: 'assessment', label: 'Assessment', icon: FileCheck2 },
  { id: 'progress', label: 'Progress', icon: ChartNoAxesCombined },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
] as const;

type TabId = (typeof TABS)[number]['id'];

function isTabId(value: string | null): value is TabId {
  return TABS.some(tab => tab.id === value);
}

export function InstructorTrainingHubPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab = isTabId(requestedTab) ? requestedTab : 'my-courses';
  const tabNavigationRef = useRef<HTMLDivElement>(null);
  const tabRowRef = useRef<HTMLDivElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<TabId, HTMLButtonElement>());
  const [hasTabOverflow, setHasTabOverflow] = useState(false);

  useEffect(() => {
    const navigation = tabNavigationRef.current;
    const list = tabListRef.current;
    if (!navigation || !list) return;

    const updateOverflow = () => {
      // Compare with the full row so the arrows cannot create overflow themselves.
      setHasTabOverflow(list.scrollWidth > navigation.clientWidth);
    };

    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(navigation);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    tabRefs.current.get(tab)?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [tab]);

  const handleTabChange = (nextTab: string) => {
    if (!isTabId(nextTab)) return;

    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'my-courses') {
      params.delete('tab');
    } else {
      params.set('tab', nextTab);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    tabRowRef.current?.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    });
  };

  return (
    <div className='w-full min-w-0 px-6 py-6'>
      <PageHeader
        eyebrow='INSTRUCTOR TRAINING HUB'
        title='Training Hub'
        description='Manage your courses, classes, assignments, and assessments in one place.'
      />

      {/* <div className='w-full 2xl:max-w-[80%] mt-4'>
        <ReportsDueSection />
      </div> */}

      <section className='grid w-full max-w-full min-w-0 gap-4 overflow-hidden sm:w-full'>
        <div className='min-w-0 space-y-3 overflow-hidden'>
          <TrainingHubSectionHeader
            actionLabel={``}
            href='/dashboard/instructor/classes'
            title=''
          />
          <Tabs value={tab} onValueChange={handleTabChange} className='min-w-0 gap-0'>
            <div ref={tabNavigationRef} className='mt-4 flex min-w-0 items-center gap-1'>
              {hasTabOverflow && (
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
              )}

              <div
                ref={tabRowRef}
                className='min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              >
                <TabsList
                  ref={tabListRef}
                  aria-label='Training hub sections'
                  className='h-auto w-max justify-start gap-2 rounded-none bg-transparent p-0'
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

              {hasTabOverflow && (
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
              )}
            </div>

            <TabsContent value='my-courses' className='min-w-0'>
              <MyCoursesTab />
            </TabsContent>
            <TabsContent value='classes' className='min-w-0'>
              <ClassesTab />
            </TabsContent>
            <TabsContent value='assignment' className='min-w-0'>
              <AssignmentTab />
            </TabsContent>
            <TabsContent value='assessment' className='min-w-0'>
              <AssessmentTab role='instructor' />
            </TabsContent>
            <TabsContent value='progress' className='p-3'>
              <EmptyState
                icon={FolderKanban}
                title='Progress tracking is not yet available'
                description='Your learning progress, completed activities, and assessment results will appear here when they become available.'
              />
            </TabsContent>

            <TabsContent value='attendance' className='min-w-0'>
              <AttendanceTab />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
