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
import { type InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import {
  getClassDefinitionOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, Course, StudentSchedule } from '@/services/client/types.gen';
import { useQueries } from '@tanstack/react-query';
import { PanelBottom, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useUserProfile } from '../../../../../../context/profile-context';
import { ClassDeliveryStatusTab } from '../../../../@instructor/classes/_components/class-delivery-status-tab';
import { ClassOverviewTab } from '../../../../@instructor/classes/_components/class-overview-tab';
import { ClassSidebar } from '../../../../@instructor/classes/_components/class-sidebar';
import {
  classTabs,
  useFilteredClassInstances,
  type ClassInstanceItem,
  type ClassTab,
  type DateFilter,
  type LessonModule,
} from '../../../../@instructor/classes/_components/new-class-page.utils';
import { PlaceholderTab } from '../../../../@instructor/classes/_components/placeholder-tab';

type StudentClassDefinition = ClassDefinition & {
  course?: Course | null;
  schedule: StudentSchedule[];
};

type StudentClassPageProps = {
  studentEnrolledClasses: StudentSchedule[];
  loading?: boolean;
};

export default function StudentClassPage({
  studentEnrolledClasses,
  loading = false,
}: StudentClassPageProps) {
  const router = useRouter();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { difficultyMap } = useDifficultyLevels();
  const profile = useUserProfile()
  const student = profile?.student

  const [selectedInstanceUuid, setSelectedInstanceUuid] = useState<string | null>(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
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

  // for each of the classes, get the schedule and return in the class definitions
  const classScheduleQueries = useQueries({
    queries: classDefinitionUuids.map(uuid => ({
      ...getClassScheduleOptions({
        path: { uuid },
        query: { pageable: {} },
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
  }, [classScheduleQueries, classDefinitionUuids]);

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

  const selectedModuleResources = selectedModule?.content?.data ?? [];

  const totalInstances = selectedClass?.schedule?.length ?? 0;
  const visibleInstances = selectedClass?.schedule ?? [];
  const completedInstances = visibleInstances.filter(
    instance => instance.start_time && instance.end_time && new Date(instance.end_time) < new Date()
  ).length;
  const completionRate = visibleInstances.length
    ? Math.round((completedInstances / visibleInstances.length) * 100)
    : 0;
  const totalSessions = selectedClass?.schedule?.length ?? 0;
  const completedSessions =
    selectedClass?.schedule?.filter(session =>
      session.start_time ? new Date(session.start_time) < new Date() : false
    ).length ?? 0;
  const remainingSessions = Math.max(totalSessions - completedSessions, 0);
  const sessionProgress = totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0;


  const baseClassRoute = (classUuid: string) =>
    `/dashboard/learning-hub/classes/class-training/${classUuid}`;

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

    return `${baseClassRoute(selectedClassUuid)}${queryString ? `?${queryString}` : ''
      }`;
  }, [
    selectedClassUuid,
    selectedInstanceEntry?.instanceUuid,
    selectedLesson?.uuid,
    selectedModule?.lesson?.uuid,
  ]);

  const getLessonHref = (
    lessonUuid?: string | null,
    contentUuid?: string | null
  ) => {
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

    return `${baseClassRoute(selectedClassUuid)}${queryString ? `?${queryString}` : ''
      }`;
  };

  return (
    <div className='space-y-3 mb-20'>
      <div className='border-border/70 bg-card/90 rounded-lg border p-4 shadow-sm backdrop-blur'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-muted-foreground text-xs uppercase tracking-[0.2em]'>Learning Hub</p>
            <h1 className='text-foreground mt-1 text-2xl font-semibold'>Your Classes</h1>
          </div>
        </div>
      </div>

      <div className='grid gap-3 xl:grid-cols-[350px_minmax(0,1fr)]'>
        <aside className='xl:sticky xl:top-4 xl:self-start'>
          <ClassSidebar
            isLoading={loading || classDefinitionQueries.some(query => query.isLoading)}
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

        {!selectedInstanceEntry && !loading && classDefinitionQueries.every(query => !query.isLoading) ? (
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
                isLoadingClasses={loading || classDefinitionQueries.some(query => query.isLoading)}
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
                rosterEntries={roster}
                sessionProgress={sessionProgress}
                remainingSessions={remainingSessions}
                setExpandedModuleId={setExpandedModuleId}
                setSelectedLessonUuid={setSelectedLessonUuid}
                startLessonHref={startLessonHref}
                getStartLessonHref={getLessonHref}
                getResumeLessonHref={getLessonHref}
                onAddClasses={() => router.push('/dashboard/workspace/student/courses')}
                roleLabel='Student view'
              />
            </TabsContent>

            <TabsContent value='delivery-status' className='mt-0'>
              <ClassDeliveryStatusTab
                isLoadingClasses={loading}
                selectedClass={selectedClass}
                selectedClassEntry={selectedInstanceEntry}
                dateFilter={dateFilter}
                difficultyMap={difficultyMap}
                studentCount={roster.length}
                totalInstances={totalInstances}
                completionRate={completionRate}
                visibleInstances={visibleInstances}
                onAddClasses={() => router.push('/dashboard/workspace/student/courses')}
                roleLabel='Student view'
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
