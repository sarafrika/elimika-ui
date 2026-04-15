'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useClassRoster } from '@/hooks/use-class-roster';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import { NotebookPen, PanelBottom, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ClassDeliveryStatusTab } from './_components/class-delivery-status-tab';
import { ClassOverviewTab } from './_components/class-overview-tab';
import { ClassSidebar } from './_components/class-sidebar';
import { ClassStudentsTab } from './_components/class-students-tab';
import {
  classTabs,
  useFilteredClassInstances,
  type ClassInstanceItem,
  type ClassTab,
  type DateFilter,
  type LessonModule,
} from './_components/new-class-page.utils';
import { PlaceholderTab } from './_components/placeholder-tab';

export default function NewClassPage() {
  const instructor = useInstructor();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { difficultyMap } = useDifficultyLevels();
  const router = useRouter();

  const [selectedInstanceUuid, setSelectedInstanceUuid] = useState<string | null>(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [selectedLessonUuid, setSelectedLessonUuid] = useState<string | null>(null);
  const [draftSearchTerm, setDraftSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('current-week');
  const [activeTab, setActiveTab] = useState<ClassTab>('overview');
  const [isTabsSheetOpen, setIsTabsSheetOpen] = useState(false);

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'new-class',
        title: 'New Class',
        url: '/dashboard/new-class',
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
        : filteredClasses[0]?.instanceUuid ?? null
    );
  }, [filteredClasses]);

  const selectedInstanceEntry = useMemo<ClassInstanceItem | null>(
    () => filteredClasses.find(classItem => classItem.instanceUuid === selectedInstanceUuid) ?? null,
    [filteredClasses, selectedInstanceUuid]
  );

  const selectedClass = selectedInstanceEntry?.classItem ?? null;
  const selectedClassUuid = selectedClass?.uuid ?? null;
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
      ) ?? lessonModules[0] ?? null,
    [lessonModules, selectedLessonUuid]
  );

  const selectedLesson = useMemo(
    () =>
      selectedModule?.content?.data?.find(content => content.uuid === selectedLessonUuid) ??
      selectedModule?.content?.data?.[0] ??
      null,
    [selectedLessonUuid, selectedModule]
  );

  const selectedModuleResources = selectedModule?.content?.data ?? [];

  const totalInstances = selectedClass?.schedule?.length ?? 0;
  const visibleInstances = selectedClass?.schedule ?? [];
  const completedInstances = visibleInstances.filter(
    instance =>
      instance.start_time &&
      instance.end_time &&
      new Date(instance.end_time) < new Date()
  ).length;
  const completionRate = visibleInstances.length
    ? Math.round((completedInstances / visibleInstances.length) * 100)
    : 0;
  const totalSessions = selectedClass?.schedule?.length ?? 0;
  const completedSessions =
    selectedClass?.schedule?.filter((session: { start_time?: string }) =>
      session.start_time ? new Date(session.start_time) < new Date() : false
    ).length ?? 0;
  const remainingSessions = Math.max(totalSessions - completedSessions, 0);
  const sessionProgress = totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0;

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
    return `/dashboard/classes/instructor-console/${selectedClassUuid}${queryString ? `?${queryString}` : ''
      }`;
  }, [
    selectedClassUuid,
    selectedInstanceEntry?.instanceUuid,
    selectedLesson?.uuid,
    selectedModule?.lesson?.uuid,
  ]);

  return (
    <div className='flex min-h-full flex-col gap-6 py-10 pb-8'>
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

      <div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
        <aside className='space-y-4'>
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
          <Card className='border-border/70 bg-card shadow-sm'>
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
            className='space-y-4'
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
                    <span className='text-muted-foreground text-xs uppercase tracking-[0.18em]'>
                      Open tabs
                    </span>
                  </Button>
                </SheetTrigger>
                <SheetContent side='bottom' className='rounded-t-[28px] border-border/70 px-0 pb-6'>
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
                            <span className='text-[10px] uppercase tracking-[0.18em]'>Active</span>
                          ) : null}
                        </Button>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <TabsList className='bg-card hidden h-auto w-full flex-wrap justify-start rounded-[28px] p-2 md:flex'>
              {classTabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className='rounded-[20px] px-4 py-2 text-[11px] uppercase tracking-[0.18em]'
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
                expandedModuleId={expandedModuleId}
                selectedLesson={selectedLesson}
                selectedModule={selectedModule}
                selectedModuleResources={selectedModuleResources}
                contentTypeMap={contentTypeMap}
                difficultyMap={difficultyMap}
                instructorName={instructor?.full_name}
                sessionProgress={sessionProgress}
                remainingSessions={remainingSessions}
                setExpandedModuleId={setExpandedModuleId}
                setSelectedLessonUuid={setSelectedLessonUuid}
                startLessonHref={startLessonHref}
                onAddClasses={() => router.push('/dashboard/trainings/create-new')}
              />
            </TabsContent>


            <TabsContent value='students' className='mt-0'>
              <ClassStudentsTab isLoadingStudents={isLoadingStudents} rosterEntries={roster} />
            </TabsContent>

            <TabsContent value='waiting-list' className='mt-0'>
              <PlaceholderTab
                title='Waiting List'
                description='This tab is ready for class-wide announcement tools and communication flows when you are ready to wire them in.'
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
                visibleInstances={visibleInstances}
                onAddClasses={() => router.push('/dashboard/trainings/create-new')}
              />
            </TabsContent>



            <TabsContent value='announcements' className='mt-0'>
              <PlaceholderTab
                title='Announcements'
                description='This tab is ready for class-wide announcement tools and communication flows when you are ready to wire them in.'
              />
            </TabsContent>

            <TabsContent value='tasks' className='mt-0'>
              <PlaceholderTab
                title='Tasks'
                description='Use this section to connect follow-up work such as assignments, reviews, or grading actions for the selected class.'
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
