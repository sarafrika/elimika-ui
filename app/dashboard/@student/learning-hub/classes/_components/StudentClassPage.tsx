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
import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import {
  getClassDefinitionOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, Course, StudentSchedule } from '@/services/client/types.gen';
import { useQueries } from '@tanstack/react-query';
import { PanelBottom, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClassDeliveryStatusTab } from '../../../../@instructor/classes/_components/class-delivery-status-tab';
import {
  ClassHero,
  ClassLessonTab,
  ClassOverviewTab,
} from '../../../../@instructor/classes/_components/class-overview-tab';
import { ClassScheduleTab } from '../../../../@instructor/classes/_components/class-schedule-tab';
import { ClassSidebar } from '../../../../@instructor/classes/_components/class-sidebar';
import { ClassStudentsTab } from '../../../../@instructor/classes/_components/class-students-tab';
import {
  dateFilterDescriptions,
  getPreferredScheduleInstance,
  studentClassTabs,
  useFilteredInstructorClasses,
  type ClassTab,
  type DateFilter
} from '../../../../@instructor/classes/_components/new-class-page.utils';
import { PlaceholderTab } from '../../../../@instructor/classes/_components/placeholder-tab';

type StudentClassDefinition = ClassDefinition & {
  course?: Course | null;
  schedule: StudentSchedule[];
};

type StudentClassPageProps = {
  studentEnrolledClasses: StudentSchedule[];
  loading?: boolean;
  singleClassDetails?: boolean;
};

export default function StudentClassPage({
  studentEnrolledClasses,
  loading = false,
  singleClassDetails = false,
}: StudentClassPageProps) {
  const router = useRouter();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { difficultyMap } = useDifficultyLevels();

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
        url: '/dashboard/learning-hub/classes',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const classDefinitionUuids = useMemo(
    () =>
      Array.from(
        new Set(
          studentEnrolledClasses
            .map(enrollment => enrollment.class_definition_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [studentEnrolledClasses]
  );

  const classDefinitionQueries = useQueries({
    queries: classDefinitionUuids.map(uuid => ({
      ...getClassDefinitionOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
    })),
  });

  const classScheduleQueries = useQueries({
    queries: classDefinitionUuids.map(uuid => ({
      ...getClassScheduleOptions({
        path: { uuid },
        query: { pageable: { size: 1000 } },
      }),
      enabled: Boolean(uuid),
    })),
  });

  const classSchedulesMap = useMemo(() => {
    const map = new Map<string, StudentSchedule[]>();

    classScheduleQueries.forEach((query, index) => {
      const uuid = classDefinitionUuids[index];
      const schedules = query.data?.data?.content ?? [];

      if (uuid) {
        map.set(uuid, schedules);
      }
    });

    return map;
  }, [classDefinitionUuids, classScheduleQueries]);

  const classDefinitions = useMemo<StudentClassDefinition[]>(() => {
    return classDefinitionQueries
      .map((query, index) => {
        const classDefinition = query.data?.data?.class_definition;
        const uuid = classDefinitionUuids[index];

        if (!classDefinition || !uuid) return null;

        return {
          ...classDefinition,
          schedule: classSchedulesMap.get(uuid) ?? [],
        };
      })
      .filter((value): value is StudentClassDefinition => Boolean(value));
  }, [classDefinitionQueries, classDefinitionUuids, classSchedulesMap]);

  const courseUuids = useMemo(
    () =>
      Array.from(
        new Set(
          classDefinitions
            .map(classItem => classItem.course_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [classDefinitions]
  );

  const courseQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
    })),
  });

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();

    courseQueries.forEach((query, index) => {
      const course = query.data?.data;
      const uuid = courseUuids[index];

      if (course && uuid) {
        map.set(uuid, course);
      }
    });

    return map;
  }, [courseQueries, courseUuids]);

  const classes = useMemo<InstructorClassWithSchedule[]>(() => {
    return classDefinitions.map(classItem => ({
      ...classItem,
      course: classItem.course_uuid ? courseMap.get(classItem.course_uuid) ?? null : null,
      schedule: classItem.schedule,
    })) as InstructorClassWithSchedule[];
  }, [classDefinitions, courseMap]);

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
      setSelectedLessonUuid(null);
      return;
    }

    const firstModule = lessonModules[0];
    const firstLesson = firstModule?.content?.data?.[0];

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

  const baseClassRoute = (classUuid: string) =>
    `/dashboard/learning-hub/classes/class-training/${classUuid}`;

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

    return `${baseClassRoute(selectedClassUuid)}${queryString ? `?${queryString}` : ''}`;
  }, [
    selectedClassUuid,
    selectedLesson?.uuid,
    selectedLessonCourseUuid,
    selectedModule?.lesson?.uuid,
    selectedScheduleInstance?.uuid,
  ]);

  const getLessonHref = useCallback(
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

      return `${baseClassRoute(selectedClassUuid)}${queryString ? `?${queryString}` : ''}`;
    },
    [lessonModules, selectedClassForDisplay?.course?.uuid, selectedClassUuid, selectedScheduleInstance?.uuid]
  );

  const handleStartLesson = useCallback(
    (lessonUuid?: string | null, contentUuid?: string | null) => {
      if (!selectedClassUuid || !selectedScheduleInstance?.uuid) {
        return;
      }

      router.push(getLessonHref(lessonUuid, contentUuid));
    },
    [getLessonHref, router, selectedClassUuid, selectedScheduleInstance?.uuid]
  );

  const selectedLessonActionLabel =
    selectedScheduleInstance?.started_at && !selectedScheduleInstance?.concluded_at
      ? 'Resume Lesson'
      : 'Start Lesson';

  const isLoadingClasses = loading || classDefinitionQueries.some(query => query.isLoading);
  const hasClassesError =
    classDefinitionQueries.some(query => query.isError) ||
    classScheduleQueries.some(query => query.isError) ||
    courseQueries.some(query => query.isError);

  return (
    <div className='min-h-full rounded-lg px-3 py-8 shadow-sm sm:px-5'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-foreground text-md leading-tight sm:text-lg'>
          {dateFilterDescriptions[dateFilter]} <span className='font-semibold'>Start training</span>
        </p>
        {singleClassDetails && selectedClass ? (
          <p className='text-muted-foreground text-sm font-medium'>{selectedClass.title}</p>
        ) : null}
      </div>

      {hasClassesError ? (
        <Card className='border-destructive/40'>
          <CardContent className='flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center'>
            <div className='bg-destructive/10 text-destructive rounded-full p-4'>
              <Search className='h-8 w-8' />
            </div>
            <div className='space-y-1'>
              <p className='text-foreground font-semibold'>Unable to load class workspace</p>
              <p className='text-muted-foreground text-sm'>
                We hit a problem while loading classes, instances, or your enrollments.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className='grid gap-3 xl:grid-cols-[350px_minmax(0,1fr)]'>
        <aside className='xl:sticky xl:top-4 xl:self-start'>
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
            instructorView={false}
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
                      {studentClassTabs.find(tab => tab.value === activeTab)?.label ?? 'Overview'}
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
                    {studentClassTabs.map(tab => {
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

            {selectedClassForDisplay ? (
              <ClassHero
                selectedClass={selectedClassForDisplay}
                difficultyMap={difficultyMap}
                roleLabel='Student view'
                sessionProgress={sessionProgress}
                remainingSessions={remainingSessions}
                startLessonHref={startLessonHref}
                selectedClassUuid={selectedClassUuid}
                onAddClasses={() => router.push('/dashboard/workspace/student/courses')}
              />
            ) : null}

            <TabsList className='border-border/70 bg-card/70 hidden h-auto w-full flex-wrap justify-start gap-1 rounded-lg border p-1.5 shadow-sm md:flex'>
              {studentClassTabs.map(tab => (
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
                rosterEntries={roster}
                sessionProgress={sessionProgress}
                remainingSessions={remainingSessions}
                setSelectedLessonUuid={setSelectedLessonUuid}
                startLessonHref={startLessonHref}
                getStartLessonHref={getLessonHref}
                onStartLesson={handleStartLesson}
                selectedLessonActionLabel={selectedLessonActionLabel}
                onAddClasses={() => router.push('/dashboard/workspace/student/courses')}
                roleLabel='Student view'
              />
            </TabsContent>

            {/* <TabsContent value='lessons' className='mt-0'>
              <ClassLessonsTab
                isLoading={isLoadingClasses || isLoadingLessons}
                classTitle={selectedClass?.title}
                lessonModules={lessonModules}
              />
            </TabsContent> */}


            <TabsContent value='lessons' className='mt-0'>
              <ClassLessonTab
                isLoadingClasses={isLoadingClasses}
                isLoadingLessons={isLoadingLessons}
                selectedClass={selectedClassForDisplay}
                selectedClassUuid={selectedClassUuid}
                lessonModules={lessonModules}
                selectedLesson={selectedLesson}
                contentTypeMap={contentTypeMap}
                difficultyMap={difficultyMap}
                rosterEntries={roster}
                sessionProgress={sessionProgress}
                remainingSessions={remainingSessions}
                setSelectedLessonUuid={setSelectedLessonUuid}
                startLessonHref={startLessonHref}
                getStartLessonHref={getLessonHref}
                onStartLesson={handleStartLesson}
                selectedLessonActionLabel={selectedLessonActionLabel}
                onAddClasses={() => router.push('/dashboard/workspace/student/courses')}
                roleLabel='Instructor view'
              />
            </TabsContent>

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
                studentCount={roster.length}
                totalInstances={totalInstances}
                completionRate={completionRate}
                selectedInstanceUuid={selectedScheduleInstance?.uuid}
                visibleInstances={visibleInstances}
                onAddClasses={() => router.push('/dashboard/workspace/student/courses')}
                roleLabel='Student view'
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
