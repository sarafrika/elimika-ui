'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useClassRoster } from '@/hooks/use-class-roster';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import { startScheduledInstanceMutation } from '@/services/client/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';
import { NotebookPen, PanelBottom, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '../../../../context/profile-context';
import { ClassDeliveryStatusTab } from './_components/class-delivery-status-tab';
import { ClassOverviewTab } from './_components/class-overview-tab';
import { ClassSidebar } from './_components/class-sidebar';
import { ClassStudentsTab } from './_components/class-students-tab';
import { ClassTasksTab } from './_components/class-tasks-tab';
import { ClassWaitingListTab } from './_components/class-waiting-list-tab';
import {
  classTabs,
  dateFilterDescriptions,
  useFilteredClassInstances,
  type ClassInstanceItem,
  type ClassTab,
  type DateFilter,
  type LessonModule,
} from './_components/new-class-page.utils';
import { PlaceholderTab } from './_components/placeholder-tab';

export default function NewClassPage() {
  const profile = useUserProfile()
  const instructor = profile?.instructor;
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { difficultyMap } = useDifficultyLevels();
  const router = useRouter();

  const [selectedInstanceUuid, setSelectedInstanceUuid] = useState<string | null>(null);
  const [, setExpandedModuleId] = useState<string | null>(null);
  const [selectedLessonUuid, setSelectedLessonUuid] = useState<string | null>(null);
  const [draftSearchTerm, setDraftSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('current-day');
  const [activeTab, setActiveTab] = useState<ClassTab>('overview');
  const [isTabsSheetOpen, setIsTabsSheetOpen] = useState(false);

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'classes',
        title: 'Classes',
        url: '/dashboard/classes',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const {
    classes,
    isLoading: isLoadingClasses,
    isError: hasClassesError,
  } = useInstructorClassesWithSchedules(instructor?.uuid);

  const filteredClasses = useFilteredClassInstances({
    classes,
    difficultyMap,
    searchTerm,
    dateFilter,
  });

  useEffect(() => {
    if (!filteredClasses.length) {
      setSelectedInstanceUuid(null);
      return;
    }

    setSelectedInstanceUuid(previous =>
      previous && filteredClasses.some(classItem => classItem.instanceUuid === previous)
        ? previous
        : (filteredClasses[0]?.instanceUuid ?? null)
    );
  }, [filteredClasses]);

  const selectedInstanceEntry = useMemo<ClassInstanceItem | null>(
    () =>
      filteredClasses.find(classItem => classItem.instanceUuid === selectedInstanceUuid) ?? null,
    [filteredClasses, selectedInstanceUuid]
  );

  const selectedClass = selectedInstanceEntry?.classItem ?? null;
  const selectedClassUuid = selectedClass?.uuid ?? null;
  const selectedInstance = selectedInstanceEntry?.instance ?? null;
  const { roster, isLoading: isLoadingStudents } = useClassRoster(selectedClassUuid ?? undefined);
  const {
    isLoading: isLoadingLessons,
    lessons,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: selectedClass?.course_uuid });
  const lessonModules = useMemo<LessonModule[]>(() => lessons ?? [], [lessons]);

  useEffect(() => {
    if (!lessonModules.length) {
      setExpandedModuleId(null);
      setSelectedLessonUuid(null);
      return;
    }

    const firstModule = lessonModules[0];
    const firstLesson = firstModule?.content?.data?.[0];

    setExpandedModuleId(previous =>
      previous && lessonModules.some(module => module.lesson.uuid === previous)
        ? previous
        : (firstModule?.lesson?.uuid ?? null)
    );

    setSelectedLessonUuid(previous => {
      if (
        previous &&
        lessonModules.some(module =>
          module.content?.data?.some(content => content.uuid === previous)
        )
      ) {
        return previous;
      }

      return firstLesson?.uuid ?? null;
    });
  }, [lessonModules]);

  const selectedModule = useMemo(
    () =>
      lessonModules.find(module =>
        module.content?.data?.some(content => content.uuid === selectedLessonUuid)
      ) ??
      lessonModules[0] ??
      null,
    [lessonModules, selectedLessonUuid]
  );

  const selectedLesson = useMemo(
    () =>
      selectedModule?.content?.data?.find(content => content.uuid === selectedLessonUuid) ??
      selectedModule?.content?.data?.[0] ??
      null,
    [selectedLessonUuid, selectedModule]
  );

  const startClassMut = useMutation(startScheduledInstanceMutation());

  const visibleInstances = selectedClass?.schedule ?? [];
  const countableInstances = visibleInstances.filter(instance => {
    const status = instance.status?.toUpperCase();
    return status !== 'CANCELLED' && status !== 'BLOCKED';
  });
  const apiTotalSessions =
    typeof selectedClass?.scheduled_session_count === 'number'
      ? selectedClass.scheduled_session_count
      : undefined;
  const apiCompletedSessions =
    typeof selectedClass?.completed_session_count === 'number'
      ? selectedClass.completed_session_count
      : undefined;
  const apiSessionProgress =
    typeof selectedClass?.class_progress_percentage === 'number'
      ? selectedClass.class_progress_percentage
      : undefined;
  const totalSessions = apiTotalSessions ?? countableInstances.length;
  const completedSessions =
    apiCompletedSessions ??
    countableInstances.filter(
      instance => instance.status?.toUpperCase() === 'COMPLETED' || instance.concluded_at
    ).length;
  const remainingSessions = Math.max(totalSessions - completedSessions, 0);
  const sessionProgress =
    apiSessionProgress !== undefined
      ? Math.round(apiSessionProgress)
      : totalSessions
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0;
  const totalInstances = totalSessions;
  const completionRate = sessionProgress;

  const startLessonHref = useMemo(() => {
    if (!selectedClassUuid) return '#';

    const params = new URLSearchParams();
    if (selectedInstanceEntry?.instanceUuid) {
      params.set('schedule', selectedInstanceEntry.instanceUuid);
    }
    if (selectedModule?.lesson?.uuid) {
      params.set('lesson', selectedModule.lesson.uuid);
    }
    if (selectedLesson?.uuid) {
      params.set('content', selectedLesson.uuid);
    }

    const queryString = params.toString();
    return `/dashboard/classes/class-training/${selectedClassUuid}${queryString ? `?${queryString}` : ''
      }`;
  }, [
    selectedClassUuid,
    selectedInstanceEntry?.instanceUuid,
    selectedLesson?.uuid,
    selectedModule?.lesson?.uuid,
  ]);

  const getStartLessonHref = useCallback(
    (lessonUuid?: string | null, contentUuid?: string | null) => {
      if (!selectedClassUuid) return '#';

      const params = new URLSearchParams();
      if (selectedInstanceEntry?.instanceUuid) {
        params.set('schedule', selectedInstanceEntry.instanceUuid);
      }
      if (lessonUuid) {
        params.set('lesson', lessonUuid);
      }
      if (contentUuid) {
        params.set('content', contentUuid);
      }

      const queryString = params.toString();
      return `/dashboard/classes/class-training/${selectedClassUuid}${queryString ? `?${queryString}` : ''
        }`;
    },
    [selectedClassUuid, selectedInstanceEntry?.instanceUuid]
  );

  const handleStartLesson = useCallback(
    (lessonUuid?: string | null, contentUuid?: string | null) => {
      if (!selectedClassUuid || !selectedInstanceEntry?.instanceUuid) {
        return;
      }

      const href = getStartLessonHref(lessonUuid, contentUuid);
      const shouldResumeLesson = Boolean(selectedInstance?.started_at && !selectedInstance?.concluded_at);

      if (shouldResumeLesson) {
        router.push(href);
        return;
      }

      startClassMut.mutate(
        { path: { instanceUuid: selectedInstanceEntry.instanceUuid } },
        {
          onSuccess: () => {
            router.push(href);
          },
          onError: error => {
            toast.error(error?.message || 'Could not start this class instance.');
          },
        }
      );
    },
    [
      getStartLessonHref,
      router,
      selectedClassUuid,
      selectedInstance?.concluded_at,
      selectedInstance?.started_at,
      selectedInstanceEntry?.instanceUuid,
      startClassMut,
    ]
  );

  return (
    <div className='min-h-full rounded-lg px-3 py-8 shadow-sm sm:px-5'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-foreground text-md leading-tight sm:text-lg'>
          {dateFilterDescriptions[dateFilter]} <span className='font-semibold'>Start training</span>
        </p>
        <Button
          type='button'
          onClick={() => router.push('/dashboard/classes/create-new')}
          className='inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-success px-8 text-sm font-semibold text-success-foreground transition hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/30'
        >
          <Plus className='h-4 w-4' />
          Create New class
        </Button>
      </div>

      {hasClassesError ? (
        <Card className='border-destructive/40'>
          <CardContent className='flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center'>
            <NotebookPen className='text-destructive h-8 w-8' />
            <div className='space-y-1'>
              <p className='text-foreground font-semibold'>Unable to load class workspace</p>
              <p className='text-muted-foreground text-sm'>
                We hit a problem while loading classes, instances, or student enrollments.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className='grid gap-3 xl:grid-cols-[290px_minmax(0,1fr)]'>
        <aside>
          <ClassSidebar
            isLoading={isLoadingClasses}
            classes={filteredClasses}
            selectedInstanceUuid={selectedInstanceUuid}
            searchTerm={searchTerm}
            draftSearchTerm={draftSearchTerm}
            dateFilter={dateFilter}
            onSelectClass={setSelectedInstanceUuid}
            onSearchChange={value => {
              setDraftSearchTerm(value);
              setSearchTerm(value.trim());
            }}
            onDateFilterChange={setDateFilter}
          />
        </aside>

        {!selectedInstanceEntry && !isLoadingClasses ? (
          <Card className='border-border/70 bg-card/90 shadow-sm'>
            <CardContent className='flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center'>
              <div className='bg-primary/10 text-primary rounded-full p-4'>
                <Search className='h-6 w-6' />
              </div>
              <div className='space-y-2'>
                <h3 className='text-foreground text-lg font-semibold'>No classes available</h3>
                <p className='text-muted-foreground max-w-lg text-sm'>
                  Try another search term or switch the date filter to load more class instances.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as ClassTab)}
            className='space-y-3'
          >
            <div className='flex md:hidden'>
              <Sheet open={isTabsSheetOpen} onOpenChange={setIsTabsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='bg-card text-foreground border-border/70 flex h-12 w-full items-center justify-between rounded-[22px] px-4'
                  >
                    <span className='flex items-center gap-2'>
                      <PanelBottom className='h-4 w-4' />
                      {classTabs.find(tab => tab.value === activeTab)?.label ?? 'Overview'}
                    </span>
                    <span className='text-muted-foreground text-xs tracking-[0.18em] uppercase'>
                      Open tabs
                    </span>
                  </Button>
                </SheetTrigger>
                <SheetContent side='bottom' className='border-border/70 rounded-t-[28px] px-0 pb-6'>
                  <SheetHeader className='px-5 pb-3'>
                    <SheetTitle>Class tabs</SheetTitle>
                    <SheetDescription>
                      Choose the section you want to view for this class.
                    </SheetDescription>
                  </SheetHeader>
                  <div className='space-y-2 px-5'>
                    {classTabs.map(tab => {
                      const isActive = tab.value === activeTab;

                      return (
                        <Button
                          key={tab.value}
                          type='button'
                          variant='ghost'
                          onClick={() => {
                            setActiveTab(tab.value);
                            setIsTabsSheetOpen(false);
                          }}
                          className={`h-12 w-full justify-between rounded-[18px] border px-4 ${isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/70 bg-background text-foreground'
                            }`}
                        >
                          <span>{tab.label}</span>
                          {isActive ? (
                            <span className='text-[10px] tracking-[0.18em] uppercase'>Active</span>
                          ) : null}
                        </Button>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <TabsList className='border-border/70 bg-card/70 hidden h-auto w-full flex-wrap justify-start gap-1 rounded-lg border p-1.5 shadow-sm md:flex'>
              {classTabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-3 py-2 text-xs font-semibold'
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='overview' className='mt-0'>
              <ClassOverviewTab
                isLoadingClasses={isLoadingClasses}
                isLoadingLessons={isLoadingLessons}
                selectedClass={selectedClass}
                selectedClassUuid={selectedClassUuid}
                lessonModules={lessonModules}
                selectedLesson={selectedLesson}
                contentTypeMap={contentTypeMap}
                difficultyMap={difficultyMap}
                instructorName={instructor?.full_name}
                rosterEntries={roster}
                sessionProgress={sessionProgress}
                remainingSessions={remainingSessions}
                setSelectedLessonUuid={setSelectedLessonUuid}
                startLessonHref={startLessonHref}
                getStartLessonHref={getStartLessonHref}
                onStartLesson={handleStartLesson}
                selectedLessonActionLabel={
                  selectedInstance?.started_at && !selectedInstance?.concluded_at
                    ? 'Resume Lesson'
                    : 'Start Lesson'
                }
                onAddClasses={() => router.push(`/dashboard/classes/create-new?id=${selectedClass?.uuid}`)}
              />
            </TabsContent>

            <TabsContent value='students' className='mt-0'>
              <ClassStudentsTab isLoadingStudents={isLoadingStudents} rosterEntries={roster} />
            </TabsContent>

            <TabsContent value='waiting-list' className='mt-0'>
              <ClassWaitingListTab
                isLoadingClasses={isLoadingClasses}
                selectedClass={selectedClass}
                selectedClassEntry={selectedInstanceEntry}
                visibleInstances={visibleInstances}
              />
            </TabsContent>

            <TabsContent value='delivery-status' className='mt-0'>
              <ClassDeliveryStatusTab
                isLoadingClasses={isLoadingClasses}
                selectedClass={selectedClass}
                selectedClassEntry={selectedInstanceEntry}
                dateFilter={dateFilter}
                difficultyMap={difficultyMap}
                instructorName={instructor?.full_name}
                studentCount={roster.length}
                totalInstances={totalInstances}
                completionRate={completionRate}
                selectedInstanceUuid={selectedInstanceUuid as string}
                visibleInstances={visibleInstances}
                onAddClasses={() => router.push('/dashboard/classes/create-new')}
              />
            </TabsContent>

            <TabsContent value='announcements' className='mt-0'>
              <PlaceholderTab
                title='Announcements'
                description='No announcements yet. Updates, reminders, and important messages for this class will appear here.'
              />
            </TabsContent>

            <TabsContent value='tasks' className='mt-0'>
              <ClassTasksTab
                classUuid={selectedClassUuid}
                classTitle={selectedClass?.title}
                courseTitle={selectedClass?.course?.name}
                isLoading={isLoadingClasses || isLoadingLessons}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
