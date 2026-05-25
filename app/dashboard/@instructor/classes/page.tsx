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
import { useClassLessonContent } from '@/hooks/use-class-lesson-content';
import { useClassRoster } from '@/hooks/use-class-roster';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { InstructorClassWithSchedule, useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import { startScheduledInstanceMutation } from '@/services/client/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';
import { NotebookPen, PanelBottom, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '../../../../context/profile-context';
import { ClassDeliveryStatusTab } from './_components/class-delivery-status-tab';
import { ClassLessonOverviewTab, ClassOverviewTab } from './_components/class-overview-tab';
import { ClassScheduleTab } from './_components/class-schedule-tab';
import { ClassSidebar } from './_components/class-sidebar';
import { ClassStudentsTab } from './_components/class-students-tab';
import {
  classTabs,
  dateFilterDescriptions,
  getPreferredScheduleInstance,
  useFilteredInstructorClasses,
  type ClassTab,
  type DateFilter,
} from './_components/new-class-page.utils';
import { PlaceholderTab } from './_components/placeholder-tab';

export default function NewClassPage() {
  const profile = useUserProfile();
  const instructor = profile?.instructor;
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { difficultyMap } = useDifficultyLevels();
  const router = useRouter();

  const [, setExpandedModuleId] = useState<string | null>(null);
  const [selectedClassUuid, setSelectedClassUuid] = useState<string | null>(null);
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

  const filteredClasses = useFilteredInstructorClasses({
    classes,
    searchTerm,
    dateFilter,
  });

  useEffect(() => {
    if (!filteredClasses.length) {
      setSelectedClassUuid(null);
      return;
    }

    setSelectedClassUuid(previous =>
      previous && filteredClasses.some(classItem => classItem.uuid === previous)
        ? previous
        : (filteredClasses[0]?.uuid ?? null)
    );
  }, [filteredClasses]);

  const selectedClass = useMemo(
    () => filteredClasses.find(classItem => classItem.uuid === selectedClassUuid) ?? null,
    [filteredClasses, selectedClassUuid]
  );
  const selectedScheduleInstance = useMemo(
    () => getPreferredScheduleInstance(selectedClass?.schedule ?? []),
    [selectedClass?.schedule]
  );
  const { roster, isLoading: isLoadingStudents } = useClassRoster(selectedClassUuid ?? undefined);
  const {
    isLoading: isLoadingLessons,
    lessonModules,
    contentTypeMap,
    programCourses,
  } = useClassLessonContent({
    courseUuid: selectedClass?.course_uuid,
    programUuid: selectedClass?.program_uuid,
  });
  const selectedClassForDisplay = useMemo<InstructorClassWithSchedule | null>(() => {
    if (!selectedClass) return null;
    if (!selectedClass.program_uuid || selectedClass.course) return selectedClass;

    const selectedLessonModule = lessonModules.find(module =>
      module.content?.data?.some(content => content.uuid === selectedLessonUuid)
    );
    const selectedProgramCourse =
      selectedLessonModule?.course ??
      programCourses.find(course => course.uuid === selectedLessonModule?.course?.uuid) ??
      programCourses[0] ??
      null;
    if (!selectedProgramCourse) return selectedClass;

    return {
      ...selectedClass,
      course: selectedProgramCourse,
    };
  }, [lessonModules, programCourses, selectedClass, selectedLessonUuid]);

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
  const selectedLessonCourseUuid =
    selectedModule?.course?.uuid ?? selectedClassForDisplay?.course?.uuid ?? '';

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
    if (selectedScheduleInstance?.uuid) {
      params.set('schedule', selectedScheduleInstance.uuid);
    }
    if (selectedModule?.lesson?.uuid) {
      params.set('lesson', selectedModule.lesson.uuid);
    }
    if (selectedLesson?.uuid) {
      params.set('content', selectedLesson.uuid);
    }
    if (selectedLessonCourseUuid) {
      params.set('course', selectedLessonCourseUuid);
    }

    const queryString = params.toString();
    return `/dashboard/classes/class-training/${selectedClassUuid}${queryString ? `?${queryString}` : ''
      }`;
  }, [
    selectedClassUuid,
    selectedScheduleInstance?.uuid,
    selectedLesson?.uuid,
    selectedModule?.lesson?.uuid,
    selectedLessonCourseUuid,
  ]);

  const getStartLessonHref = useCallback(
    (lessonUuid?: string | null, contentUuid?: string | null) => {
      if (!selectedClassUuid) return '#';

      const params = new URLSearchParams();
      if (selectedScheduleInstance?.uuid) {
        params.set('schedule', selectedScheduleInstance.uuid);
      }
      if (lessonUuid) {
        params.set('lesson', lessonUuid);
      }
      if (contentUuid) {
        params.set('content', contentUuid);
      }
      const lessonCourseUuid =
        lessonModules.find(module => module.lesson.uuid === lessonUuid)?.course?.uuid ??
        selectedClassForDisplay?.course?.uuid ??
        '';
      if (lessonCourseUuid) {
        params.set('course', lessonCourseUuid);
      }

      const queryString = params.toString();
      return `/dashboard/classes/class-training/${selectedClassUuid}${queryString ? `?${queryString}` : ''
        }`;
    },
    [lessonModules, selectedClassForDisplay?.course?.uuid, selectedClassUuid, selectedScheduleInstance?.uuid]
  );

  const handleStartLesson = useCallback(
    (lessonUuid?: string | null, contentUuid?: string | null) => {
      if (!selectedClassUuid || !selectedScheduleInstance?.uuid) {
        return;
      }

      const href = getStartLessonHref(lessonUuid, contentUuid);
      const shouldResumeLesson = Boolean(
        selectedScheduleInstance?.started_at && !selectedScheduleInstance?.concluded_at
      );

      if (shouldResumeLesson) {
        router.push(href);
        return;
      }

      startClassMut.mutate(
        { path: { instanceUuid: selectedScheduleInstance.uuid } },
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
      selectedScheduleInstance?.concluded_at,
      selectedScheduleInstance?.started_at,
      selectedScheduleInstance?.uuid,
      startClassMut,
    ]
  );

  return (
    <div className='min-h-full rounded-lg px-3 py-8 shadow-sm sm:px-5'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-foreground text-md leading-tight sm:text-lg'>
          {dateFilterDescriptions[dateFilter]} <span className='font-semibold'>Start training</span>
        </p>
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
            selectedClassUuid={selectedClassUuid}
            searchTerm={searchTerm}
            draftSearchTerm={draftSearchTerm}
            dateFilter={dateFilter}
            onSelectClass={setSelectedClassUuid}
            onSearchChange={value => {
              setDraftSearchTerm(value);
              setSearchTerm(value.trim());
            }}
            onDateFilterChange={setDateFilter}
          />
        </aside>

        {!selectedClass && !isLoadingClasses ? (
          <Card className='border-border/70 bg-card/90 shadow-sm'>
            <CardContent className='flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center'>
              <div className='bg-primary/10 text-primary rounded-full p-4'>
                <Search className='h-6 w-6' />
              </div>
              <div className='space-y-2'>
                <h3 className='text-foreground text-lg font-semibold'>No classes available</h3>
                <p className='text-muted-foreground max-w-lg text-sm'>
                  Try another search term or switch the date filter to load more classes.
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
                selectedClass={selectedClassForDisplay}
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
                  selectedScheduleInstance?.started_at && !selectedScheduleInstance?.concluded_at
                    ? 'Resume Lesson'
                    : 'Start Lesson'
                }
                onAddClasses={() => router.push(`/dashboard/classes/new?id=${selectedClass?.uuid}`)}
              />
            </TabsContent>


            <TabsContent value='lessons' className='mt-0'>
              <ClassLessonOverviewTab
                isLoadingClasses={isLoadingClasses}
                isLoadingLessons={isLoadingLessons}
                selectedClass={selectedClassForDisplay}
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
                  selectedScheduleInstance?.started_at && !selectedScheduleInstance?.concluded_at
                    ? 'Resume Lesson'
                    : 'Start Lesson'
                }
                onAddClasses={() => router.push(`/dashboard/classes/new?id=${selectedClass?.uuid}`)}
              />
            </TabsContent>

            {/* <TabsContent value='lessons' className='mt-0'>
              <ClassLessonsTab
                isLoading={isLoadingClasses || isLoadingLessons}
                classTitle={selectedClass?.title}
                lessonModules={lessonModules}
              />
            </TabsContent> */}

            <TabsContent value='schedule' className='mt-0'>
              <ClassScheduleTab isLoading={isLoadingClasses} selectedClass={selectedClass} />
            </TabsContent>

            <TabsContent value='students' className='mt-0'>
              <ClassStudentsTab isLoadingStudents={isLoadingStudents} rosterEntries={roster} />
            </TabsContent>

            <TabsContent value='delivery' className='mt-0'>
              <ClassDeliveryStatusTab
                isLoadingClasses={isLoadingClasses}
                selectedClass={selectedClass}
                dateFilter={dateFilter}
                difficultyMap={difficultyMap}
                instructorName={instructor?.full_name}
                studentCount={roster.length}
                totalInstances={totalInstances}
                completionRate={completionRate}
                selectedInstanceUuid={selectedScheduleInstance?.uuid}
                visibleInstances={visibleInstances}
                onAddClasses={() => router.push('/dashboard/classes/new')}
              />
            </TabsContent>

            <TabsContent value='announcements' className='mt-0'>
              <PlaceholderTab
                title='Announcements'
                description='No announcements yet. Updates, reminders, and important messages for this class will appear here.'
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
