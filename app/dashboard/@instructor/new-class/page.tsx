'use client';

import { BrandPill } from '@/components/ui/brand-pill';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import type { Enrollment, Student } from '@/services/client';
import {
  getEnrollmentsForClassOptions,
  getStudentByIdOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock3,
  FileText,
  GraduationCap,
  NotebookPen,
  Play,
  Search,
  UserRound,
  Video,
  Users,
  PanelBottom,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import HTMLTextPreview from '../../../../components/editors/html-text-preview';

type ClassTab = 'overview' | 'delivery-status' | 'students' | 'announcements' | 'tasks';
type DateFilter = 'current-week' | 'all';

type StudentTableRow = {
  studentUuid: string;
  fullName: string;
  status: string;
  enrolledOn: string;
};

type LessonContentItem = {
  uuid: string;
  title: string;
  type: string;
  content_type_uuid: string;
  duration?: string;
  description?: string;
};

type LessonModule = {
  lesson: {
    uuid?: string;
    title?: string;
    description?: string;
  };
  content?: {
    data?: LessonContentItem[];
  };
};

const tabs: { value: ClassTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'delivery-status', label: 'Delivery Status' },
  { value: 'students', label: 'Students' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'tasks', label: 'Tasks' },
];

const getStartOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getEndOfWeek = (date: Date) => {
  const result = getStartOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

const formatLabel = (value?: string | null) => {
  if (!value) return 'Not available';
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return 'TBD';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';

  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatDateOnly = (value?: string | Date | null) => {
  if (!value) return 'TBD';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDuration = (startValue?: string | Date | null, endValue?: string | Date | null) => {
  if (!startValue || !endValue) return 'TBD';

  const start = new Date(startValue);
  const end = new Date(endValue);
  const diffInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

  if (Number.isNaN(diffInMinutes) || diffInMinutes <= 0) return 'TBD';

  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;

  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${minutes}m`;
};

const getContentTypeLabel = (contentTypeMap: Record<string, string>, uuid?: string) => {
  const typeName = uuid ? contentTypeMap[uuid] : '';
  return typeName ? formatLabel(typeName) : 'Content';
};

const getContentTypeIcon = (contentTypeMap: Record<string, string>, uuid?: string) => {
  const typeName = uuid ? contentTypeMap[uuid] : '';

  switch (typeName) {
    case 'video':
      return <Video className='text-primary h-4 w-4' />;
    case 'pdf':
    case 'text':
      return <BookOpen className='text-primary h-4 w-4' />;
    case 'quiz':
    case 'assignment':
      return <FileText className='text-primary h-4 w-4' />;
    default:
      return <BookOpen className='text-primary h-4 w-4' />;
  }
};

const isWithinCurrentWeek = (value?: string | Date | null) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return date >= getStartOfWeek(now) && date <= getEndOfWeek(now);
};

const getInstanceStatus = (startValue?: string | Date | null, endValue?: string | Date | null) => {
  if (!startValue || !endValue) return 'Scheduled';

  const start = new Date(startValue);
  const end = new Date(endValue);
  const now = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Scheduled';
  if (end < now) return 'Completed';
  if (start <= now && end >= now) return 'In progress';
  return 'Upcoming';
};

function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardContent className='flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center'>
        <div className='bg-primary/10 text-primary rounded-full p-4'>
          <NotebookPen className='h-6 w-6' />
        </div>
        <div className='space-y-2'>
          <h3 className='text-foreground text-lg font-semibold'>{title}</h3>
          <p className='text-muted-foreground max-w-xl text-sm'>{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassSidebar({
  isLoading,
  classes,
  selectedClassUuid,
  searchTerm,
  draftSearchTerm,
  dateFilter,
  onSelectClass,
  onSearchChange,
  onDateFilterChange,
}: {
  isLoading: boolean;
  classes: ReturnType<typeof useMemoFilteredClasses>;
  selectedClassUuid: string | null;
  searchTerm: string;
  draftSearchTerm: string;
  dateFilter: DateFilter;
  onSelectClass: (uuid: string) => void;
  onSearchChange: (value: string) => void;
  onDateFilterChange: (value: DateFilter) => void;
}) {
  const hasSearchTerm = searchTerm.trim().length > 0;

  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardHeader className='space-y-4 pb-4'>
        <div className='space-y-2'>
          <BrandPill icon={<NotebookPen className='h-3.5 w-3.5' />} className='px-3 py-1 text-[10px]'>
            Classes
          </BrandPill>
          <div>
            <CardTitle className='text-lg'>Created classes</CardTitle>
            <p className='text-muted-foreground mt-1 text-sm'>
              Browse classes and review the individual class instances under each one.
            </p>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='relative'>
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              value={draftSearchTerm}
              onChange={event => onSearchChange(event.target.value)}
              placeholder='Search classes'
              className='bg-background h-10 rounded-full border-border/70 pr-4 pl-9 text-sm'
              aria-label='Search instructor classes'
            />
          </div>

          <Select value={dateFilter} onValueChange={value => onDateFilterChange(value as DateFilter)}>
            <SelectTrigger className='bg-background h-10 rounded-full border-border/70'>
              <SelectValue placeholder='Filter by date' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='current-week'>Current week</SelectItem>
              <SelectItem value='all'>All scheduled dates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className='h-[128px] rounded-[20px]' />
          ))
        ) : classes.length === 0 ? (
          <div className='border-border/70 rounded-[24px] border border-dashed p-6 text-center'>
            <p className='text-foreground font-medium'>
              {hasSearchTerm ? 'No classes match this search' : 'No classes for this filter'}
            </p>
            <p className='text-muted-foreground mt-1 text-sm'>
              {hasSearchTerm
                ? 'Try another class name or course title.'
                : 'Switch the date filter to load more class instances.'}
            </p>
          </div>
        ) : (
          classes.map(classItem => {
            const isSelected = classItem.uuid === selectedClassUuid;

            return (
              <button
                key={classItem.uuid}
                type='button'
                onClick={() => onSelectClass(classItem.uuid)}
                className={`w-full rounded-[20px] border px-3 py-3 text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border/70 bg-background/80 hover:bg-primary/10'
                }`}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 space-y-1.5'>
                    <p className='text-foreground truncate text-sm font-semibold'>{classItem.title}</p>
                    <p className='text-muted-foreground truncate text-[11px]'>{classItem.courseName}</p>
                  </div>
                  <BrandPill className='shrink-0 px-2.5 py-1 text-[10px] normal-case tracking-normal'>
                    {classItem.visibleInstances.length} instances
                  </BrandPill>
                </div>

                <div className='mt-3 space-y-2'>
                  {classItem.visibleInstances.length > 0 ? (
                    classItem.visibleInstances.map(instance => (
                      <div
                        key={instance.uuid}
                        className='bg-card/90 rounded-[16px] border border-border/60 px-3 py-2'
                      >
                        <div className='flex items-center justify-between gap-3'>
                          <p className='text-foreground truncate text-[11px] font-medium'>
                            {formatDateTime(instance.start_time)}
                          </p>
                          <span className='text-muted-foreground shrink-0 text-[10px]'>
                            {getInstanceStatus(instance.start_time, instance.end_time)}
                          </span>
                        </div>
                        <p className='text-muted-foreground mt-1 text-[10px]'>
                          {formatDuration(instance.start_time, instance.end_time)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className='text-muted-foreground text-[11px]'>No instances for this filter</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

type FilteredClassItem = {
  uuid: string;
  title: string;
  courseName: string;
  difficulty: string;
  sessionFormat: string;
  visibleInstances: Array<{
    uuid: string;
    start_time?: string | Date;
    end_time?: string | Date;
    location_name?: string | null;
  }>;
  allInstances: Array<{
    uuid: string;
    start_time?: string | Date;
    end_time?: string | Date;
    location_name?: string | null;
  }>;
  classItem: ReturnType<typeof useInstructorClassesWithSchedules>['classes'][number];
};

function useMemoFilteredClasses(args: {
  classes: ReturnType<typeof useInstructorClassesWithSchedules>['classes'];
  difficultyMap: Record<string, string>;
  searchTerm: string;
  dateFilter: DateFilter;
}) {
  const { classes, difficultyMap, searchTerm, dateFilter } = args;

  return useMemo<FilteredClassItem[]>(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return classes
      .map(classItem => {
        const sortedInstances = [...(classItem.schedule ?? [])].sort(
          (left, right) =>
            new Date(left.start_time ?? 0).getTime() - new Date(right.start_time ?? 0).getTime()
        );

        const visibleInstances =
          dateFilter === 'current-week'
            ? sortedInstances.filter(instance => isWithinCurrentWeek(instance.start_time))
            : sortedInstances;

        return {
          uuid: classItem.uuid,
          title: classItem.title,
          courseName: classItem.course?.name || 'No linked course',
          difficulty: classItem.course?.difficulty_uuid
            ? difficultyMap[classItem.course.difficulty_uuid]
            : 'General',
          sessionFormat: formatLabel(classItem.session_format),
          visibleInstances,
          allInstances: sortedInstances,
          classItem,
        };
      })
      .filter(classItem => {
        const matchesSearch =
          !normalizedSearch ||
          [
            classItem.title,
            classItem.courseName,
            classItem.sessionFormat,
            classItem.difficulty,
            ...classItem.visibleInstances.map(instance => formatDateTime(instance.start_time)),
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesDateFilter = dateFilter === 'all' || classItem.visibleInstances.length > 0;

        return matchesSearch && matchesDateFilter;
      })
      .sort((left, right) => {
        const leftTime = new Date(
          (left.visibleInstances[0] ?? left.allInstances[0])?.start_time ?? 0
        ).getTime();
        const rightTime = new Date(
          (right.visibleInstances[0] ?? right.allInstances[0])?.start_time ?? 0
        ).getTime();

        return leftTime - rightTime;
      });
  }, [classes, dateFilter, difficultyMap, searchTerm]);
}

export default function NewClassPage() {
  const instructor = useInstructor();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const router = useRouter();
  const { difficultyMap } = useDifficultyLevels();

  const [selectedClassUuid, setSelectedClassUuid] = useState<string | null>(null);
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

  const enrollmentQueries = useQueries({
    queries: classes.map(classItem => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classItem.uuid as string },
      }),
      enabled: !!classItem.uuid,
    })),
  });

  const filteredClasses = useMemoFilteredClasses({
    classes,
    difficultyMap,
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
        : filteredClasses[0]?.uuid ?? null
    );
  }, [filteredClasses]);

  const selectedClassEntry = useMemo(
    () => filteredClasses.find(classItem => classItem.uuid === selectedClassUuid) ?? null,
    [filteredClasses, selectedClassUuid]
  );

  const selectedClass = selectedClassEntry?.classItem ?? null;
  const {
    isLoading: isLoadingLessons,
    lessons,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: selectedClass?.course_uuid });
  const lessonModules = useMemo<LessonModule[]>(() => lessons ?? [], [lessons]);
  const selectedClassIndex = useMemo(
    () => classes.findIndex(classItem => classItem.uuid === selectedClassUuid),
    [classes, selectedClassUuid]
  );

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

  const selectedClassEnrollments =
    selectedClassIndex >= 0 ? enrollmentQueries[selectedClassIndex]?.data?.data ?? [] : [];

  const uniqueStudentUuids = useMemo(() => {
    const ids = new Set<string>();

    selectedClassEnrollments.forEach(enrollment => {
      if (enrollment.student_uuid && enrollment.status !== 'CANCELLED') {
        ids.add(enrollment.student_uuid);
      }
    });

    return Array.from(ids);
  }, [selectedClassEnrollments]);

  const studentQueries = useQueries({
    queries: uniqueStudentUuids.map(studentUuid => ({
      ...getStudentByIdOptions({
        path: { uuid: studentUuid },
      }),
      enabled: !!studentUuid,
    })),
  });

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();

    uniqueStudentUuids.forEach((studentUuid, index) => {
      const student = studentQueries[index]?.data;
      if (student) {
        map.set(studentUuid, student);
      }
    });

    return map;
  }, [studentQueries, uniqueStudentUuids]);

  const studentRows = useMemo<StudentTableRow[]>(() => {
    const rows = new Map<string, StudentTableRow>();

    selectedClassEnrollments.forEach(enrollment => {
      if (!enrollment.student_uuid || enrollment.status === 'CANCELLED') return;

      if (rows.has(enrollment.student_uuid)) return;

      const student = studentMap.get(enrollment.student_uuid);

      rows.set(enrollment.student_uuid, {
        studentUuid: enrollment.student_uuid,
        fullName: student?.full_name || 'Unknown student',
        status: formatLabel(enrollment.status),
        enrolledOn: formatDateOnly(enrollment.created_date),
      });
    });

    return Array.from(rows.values()).sort((left, right) => left.fullName.localeCompare(right.fullName));
  }, [selectedClassEnrollments, studentMap]);

  const isLoadingStudents = studentQueries.some(query => query.isLoading || query.isFetching);

  const totalInstances = selectedClassEntry?.allInstances.length ?? 0;
  const visibleInstances = selectedClassEntry?.visibleInstances ?? [];
  const completedInstances = visibleInstances.filter(
    instance => getInstanceStatus(instance.start_time, instance.end_time) === 'Completed'
  ).length;
  const remainingInstances = Math.max(visibleInstances.length - completedInstances, 0);
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

  const hasError = hasClassesError;

  return (
    <div className='flex min-h-full flex-col gap-6 py-10 pb-8'>
      {hasError ? (
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

        {!selectedClassEntry && !isLoadingClasses ? (
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
          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as ClassTab)} className='space-y-4'>
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
                      {tabs.find(tab => tab.value === activeTab)?.label ?? 'Overview'}
                    </span>
                    <span className='text-muted-foreground text-xs uppercase tracking-[0.18em]'>
                      Open tabs
                    </span>
                  </Button>
                </SheetTrigger>
                <SheetContent side='bottom' className='rounded-t-[28px] border-border/70 px-0 pb-6'>
                  <SheetHeader className='px-5 pb-3'>
                    <SheetTitle>Class tabs</SheetTitle>
                    <SheetDescription>Choose the section you want to view for this class.</SheetDescription>
                  </SheetHeader>
                  <div className='space-y-2 px-5'>
                    {tabs.map(tab => {
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
                          className={`h-12 w-full justify-between rounded-[18px] border px-4 ${
                            isActive
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
              {tabs.map(tab => (
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
              <Card className='border-border/70 bg-card shadow-sm'>
                <CardContent className='space-y-6 p-4 sm:p-6'>
                  {isLoadingClasses || !selectedClass || isLoadingLessons ? (
                    <div className='space-y-4'>
                      <Skeleton className='h-44 rounded-[28px]' />
                      <Skeleton className='h-72 rounded-[28px]' />
                    </div>
                  ) : (
                    <>
                      <div className='rounded-[28px] border border-border/70 bg-background/80'>
                        <div className='border-border/70 flex flex-col gap-5 border-b p-5 lg:flex-row lg:items-start lg:justify-between'>
                          <div className='flex min-w-0 gap-4'>
                            <div className='bg-muted hidden h-24 w-24 shrink-0 rounded-[24px] border border-border/60 sm:flex sm:items-center sm:justify-center'>
                              <BookOpen className='text-muted-foreground h-8 w-8' />
                            </div>
                            <div className='min-w-0 space-y-4'>
                              <div className='space-y-2'>
                                <h2 className='text-foreground text-2xl font-semibold'>
                                  {selectedClass.course?.name || selectedClass.title || 'Select a class'}
                                </h2>
                                <HTMLTextPreview
                                  className='text-muted-foreground text-sm leading-6'
                                  htmlContent={
                                    selectedClass.course?.description ||
                                    selectedClass.description ||
                                    'Open the class to review the course details and lesson flow.'
                                  }
                                />
                              </div>

                              <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm'>
                                <span className='inline-flex items-center gap-1.5'>
                                  <CircleDot className='h-4 w-4' />
                                  {totalSessions} sessions
                                </span>
                                <span className='inline-flex items-center gap-1.5'>
                                  <GraduationCap className='h-4 w-4' />
                                  {selectedClass.course?.difficulty_uuid
                                    ? difficultyMap[selectedClass.course.difficulty_uuid]
                                    : 'General'}
                                </span>
                                <span className='inline-flex items-center gap-1.5'>
                                  <Users className='h-4 w-4' />
                                  {instructor?.full_name || 'Instructor view'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            type='button'
                            onClick={() => router.push('/dashboard/trainings/create-new')}
                            className='rounded-md border border-border/70 bg-primary hover:bg-accent'
                          >
                            Add classes
                          </Button>
                        </div>

                        <div className='space-y-3 p-5'>
                          <Progress value={sessionProgress} className='h-2.5 bg-primary/15' />
                          <div className='flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between'>
                            <p className='text-foreground font-semibold'>{sessionProgress}% completed</p>
                            <p className='text-muted-foreground'>
                              {remainingSessions} session{remainingSessions === 1 ? '' : 's'} remaining
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px]'>
                        <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                          <div className='mb-4'>
                            <h3 className='text-foreground text-lg font-semibold'>Course program</h3>
                            <p className='text-muted-foreground mt-1 text-sm'>
                              Lessons and content currently mapped to this class course.
                            </p>
                          </div>

                          <div className='space-y-3'>
                            {lessonModules.length === 0 ? (
                              <div className='border-border/70 rounded-[24px] border border-dashed p-6 text-center'>
                                <p className='text-foreground font-medium'>No lesson content yet</p>
                                <p className='text-muted-foreground mt-1 text-sm'>
                                  Course lessons will appear here once the program is configured.
                                </p>
                              </div>
                            ) : (
                              lessonModules.map((module, moduleIndex) => {
                                const isOpen = expandedModuleId === module.lesson.uuid;

                                return (
                                  <Collapsible
                                    key={module.lesson.uuid ?? `module-${moduleIndex}`}
                                    open={isOpen}
                                    onOpenChange={() =>
                                      setExpandedModuleId(isOpen ? null : (module.lesson.uuid ?? null))
                                    }
                                  >
                                    <div className='rounded-[24px] border border-border/70 bg-card'>
                                      <CollapsibleTrigger asChild>
                                        <button
                                          type='button'
                                          className='flex w-full items-center justify-between gap-3 p-4 text-left'
                                        >
                                          <div className='min-w-0'>
                                            <p className='text-foreground font-semibold'>
                                              Module {moduleIndex + 1}:{' '}
                                              {module.lesson.title || 'Untitled lesson'}
                                            </p>
                                            <p className='text-muted-foreground mt-1 text-sm'>
                                              {module.content?.data?.length ?? 0} content item
                                              {(module.content?.data?.length ?? 0) === 1 ? '' : 's'}
                                            </p>
                                          </div>
                                          {isOpen ? (
                                            <ChevronUp className='text-muted-foreground h-4 w-4 shrink-0' />
                                          ) : (
                                            <ChevronDown className='text-muted-foreground h-4 w-4 shrink-0' />
                                          )}
                                        </button>
                                      </CollapsibleTrigger>

                                      <CollapsibleContent>
                                        <div className='space-y-2 border-t border-border/70 p-4 pt-3'>
                                          {module.content?.data?.map((content, contentIndex) => {
                                            const isSelected = selectedLesson?.uuid === content.uuid;

                                            return (
                                              <button
                                                key={content.uuid}
                                                type='button'
                                                onClick={() => setSelectedLessonUuid(content.uuid)}
                                                className={`flex w-full items-center justify-between rounded-[18px] border p-3 text-left transition-colors ${
                                                  isSelected
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border/60 bg-background/70 hover:bg-accent'
                                                }`}
                                              >
                                                <div className='flex min-w-0 items-center gap-3'>
                                                  {getContentTypeIcon(contentTypeMap, content.content_type_uuid)}
                                                  <div className='min-w-0'>
                                                    <p className='text-foreground truncate text-sm font-medium'>
                                                      Lesson {moduleIndex + 1}.{contentIndex + 1} {content.title}
                                                    </p>
                                                    <p className='text-muted-foreground mt-1 text-xs'>
                                                      {getContentTypeLabel(
                                                        contentTypeMap,
                                                        content.content_type_uuid
                                                      )}
                                                      {content.duration ? ` • ${content.duration}` : ''}
                                                    </p>
                                                  </div>
                                                </div>
                                                {isSelected ? (
                                                  <CircleDot className='text-primary h-4 w-4 shrink-0' />
                                                ) : null}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </CollapsibleContent>
                                    </div>
                                  </Collapsible>
                                );
                              })
                            )}
                          </div>
                        </div>

                        <div className='space-y-6'>
                          <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                            <div className='mb-4'>
                              <h3 className='text-foreground text-lg font-semibold'>
                                {selectedLesson
                                  ? `${
                                      selectedModule && lessonModules.length
                                        ? `Lesson ${
                                            lessonModules.findIndex(
                                              module => module.lesson.uuid === selectedModule.lesson.uuid
                                            ) + 1
                                          }.${
                                            (selectedModule.content?.data?.findIndex(
                                              item => item.uuid === selectedLesson.uuid
                                            ) ?? 0) + 1
                                          }`
                                        : 'Lesson'
                                    }`
                                  : 'Lesson details'}
                              </h3>
                            </div>

                            {selectedLesson ? (
                              <div className='space-y-4'>
                                <div className='flex items-center gap-3'>
                                  <div className='bg-primary/10 rounded-full p-2.5'>
                                    {getContentTypeIcon(contentTypeMap, selectedLesson.content_type_uuid)}
                                  </div>
                                  <div>
                                    <p className='text-foreground font-medium'>
                                      {getContentTypeLabel(
                                        contentTypeMap,
                                        selectedLesson.content_type_uuid
                                      )}
                                    </p>
                                    <p className='text-muted-foreground text-sm'>
                                      {selectedLesson.duration || 'Duration not set'}
                                    </p>
                                  </div>
                                </div>

                                <Button className='w-full rounded-full'>
                                  {contentTypeMap[selectedLesson.content_type_uuid] === 'video' ? (
                                    <Play className='mr-2 h-4 w-4' />
                                  ) : null}
                                  Start lesson
                                </Button>
                              </div>
                            ) : (
                              <p className='text-muted-foreground text-sm'>
                                Select a lesson from the course program to view details.
                              </p>
                            )}
                          </div>

                          <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                            <div className='mb-4'>
                              <h3 className='text-foreground text-lg font-semibold'>Resources</h3>
                            </div>

                            {selectedModuleResources.length ? (
                              <div className='space-y-3'>
                                {selectedModuleResources.map(resource => (
                                  <div
                                    key={resource.uuid}
                                    className='flex items-start gap-3 rounded-[20px] border border-border/70 bg-card p-3'
                                  >
                                    {getContentTypeIcon(contentTypeMap, resource.content_type_uuid)}
                                    <div className='min-w-0'>
                                      <p className='text-foreground text-sm font-medium'>
                                        {resource.title}
                                      </p>
                                      <p className='text-muted-foreground mt-1 text-xs'>
                                        {getContentTypeLabel(contentTypeMap, resource.content_type_uuid)}
                                        {resource.duration ? ` • ${resource.duration}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className='text-muted-foreground text-sm'>
                                Resources for the selected lesson will appear here.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='delivery-status' className='mt-0'>
              <Card className='border-border/70 bg-card shadow-sm'>
                <CardContent className='space-y-6 p-4 sm:p-6'>
                  {isLoadingClasses || !selectedClass ? (
                    <div className='space-y-4'>
                      <Skeleton className='h-44 rounded-[28px]' />
                      <Skeleton className='h-72 rounded-[28px]' />
                    </div>
                  ) : (
                    <>
                      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]'>
                        <div className='rounded-[28px] border border-border/70 bg-background/80'>
                          <div className='border-border/70 flex flex-col gap-5 border-b p-5 lg:flex-row lg:items-start lg:justify-between'>
                            <div className='flex min-w-0 gap-4'>
                              <div className='bg-muted hidden h-24 w-24 shrink-0 rounded-[24px] border border-border/60 sm:flex sm:items-center sm:justify-center'>
                                <NotebookPen className='text-muted-foreground h-8 w-8' />
                              </div>
                              <div className='min-w-0 space-y-4'>
                                <div className='space-y-2'>
                                  <h2 className='text-foreground text-2xl font-semibold'>
                                    {selectedClass.title}
                                  </h2>
                                  <p className='text-muted-foreground text-sm leading-6'>
                                    {selectedClass.course?.description ||
                                      selectedClass.description ||
                                      'Review the selected class, its scheduled instances, and the enrolled students.'}
                                  </p>
                                </div>

                                <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm'>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <CircleDot className='h-4 w-4' />
                                    {totalInstances} total instances
                                  </span>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <GraduationCap className='h-4 w-4' />
                                    {selectedClass.course?.difficulty_uuid
                                      ? difficultyMap[selectedClass.course.difficulty_uuid]
                                      : 'General'}
                                  </span>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <Users className='h-4 w-4' />
                                    {studentRows.length} unique students
                                  </span>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <UserRound className='h-4 w-4' />
                                    {instructor?.full_name || 'Instructor view'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Button
                              type='button'
                              onClick={() => router.push('/dashboard/trainings/create-new')}
                              className='rounded-md border border-border/70 bg-primary hover:bg-accent'
                            >
                              Add classes
                            </Button>
                          </div>

                          <div className='grid gap-4 p-5 md:grid-cols-3'>
                            <div className='rounded-[20px] border border-border/70 bg-card p-4'>
                              <p className='text-muted-foreground text-xs uppercase tracking-[0.18em]'>
                                Filter
                              </p>
                              <p className='text-foreground mt-2 text-lg font-semibold'>
                                {dateFilter === 'current-week' ? 'Current week' : 'All scheduled dates'}
                              </p>
                            </div>
                            <div className='rounded-[20px] border border-border/70 bg-card p-4'>
                              <p className='text-muted-foreground text-xs uppercase tracking-[0.18em]'>
                                Visible Instances
                              </p>
                              <p className='text-foreground mt-2 text-lg font-semibold'>
                                {visibleInstances.length}
                              </p>
                            </div>
                            <div className='rounded-[20px] border border-border/70 bg-card p-4'>
                              <p className='text-muted-foreground text-xs uppercase tracking-[0.18em]'>
                                Remaining
                              </p>
                              <p className='text-foreground mt-2 text-lg font-semibold'>
                                {remainingInstances}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className='rounded-[28px] border border-border/70 bg-background/80 p-5'>
                          <h3 className='text-foreground text-lg font-semibold'>Class overview</h3>
                          <div className='mt-4 space-y-4'>
                            <div className='flex items-start justify-between gap-3 border-b border-border/70 pb-3'>
                              <span className='text-muted-foreground text-sm'>Course</span>
                              <span className='text-foreground max-w-[140px] text-right text-sm font-medium'>
                                {selectedClass.course?.name || 'No linked course'}
                              </span>
                            </div>
                            <div className='flex items-start justify-between gap-3 border-b border-border/70 pb-3'>
                              <span className='text-muted-foreground text-sm'>Session format</span>
                              <span className='text-foreground text-right text-sm font-medium'>
                                {formatLabel(selectedClass.session_format)}
                              </span>
                            </div>
                            <div className='flex items-start justify-between gap-3 border-b border-border/70 pb-3'>
                              <span className='text-muted-foreground text-sm'>Completion</span>
                              <span className='text-foreground text-right text-sm font-medium'>
                                {completionRate}%
                              </span>
                            </div>
                            <div className='flex items-start justify-between gap-3'>
                              <span className='text-muted-foreground text-sm'>Students</span>
                              <span className='text-foreground text-right text-sm font-medium'>
                                {studentRows.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Card className='border-border/70 bg-background/80 shadow-none'>
                        <CardHeader className='pb-3'>
                          <CardTitle className='text-lg'>Class instances</CardTitle>
                          <p className='text-muted-foreground text-sm'>
                            {dateFilter === 'current-week'
                              ? 'Showing class instances happening in the current week, arranged by date.'
                              : 'Showing every scheduled instance for the selected class, arranged by date.'}
                          </p>
                        </CardHeader>
                        <CardContent className='pt-0'>
                          <Table>
                            <TableHeader>
                              <TableRow className='hover:bg-transparent'>
                                <TableHead>Session</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Class Duration</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {visibleInstances.length > 0 ? (
                                visibleInstances.map((instance, index) => (
                                  <TableRow key={instance.uuid || `${selectedClass.uuid}-${index}`}>
                                    <TableCell className='font-medium'>{index + 1}</TableCell>
                                    <TableCell>{formatDateTime(instance.start_time)}</TableCell>
                                    <TableCell>
                                      {formatDuration(instance.start_time, instance.end_time)}
                                    </TableCell>
                                    <TableCell>
                                      {instance.location_name ||
                                        selectedClass.location_name ||
                                        formatLabel(selectedClass.location_type)}
                                    </TableCell>
                                    <TableCell>{getInstanceStatus(instance.start_time, instance.end_time)}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow className='hover:bg-transparent'>
                                  <TableCell colSpan={5} className='text-muted-foreground py-10 text-center'>
                                    No class instances match the current date filter.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='students' className='mt-0'>
              <Card className='border-border/70 bg-card shadow-sm'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg'>Enrolled students</CardTitle>
                  <p className='text-muted-foreground text-sm'>
                    Unique students enrolled in the selected class. Duplicate enrollment records are collapsed into one row per student.
                  </p>
                </CardHeader>
                <CardContent>
                  {isLoadingStudents ? (
                    <div className='space-y-3'>
                      <Skeleton className='h-12 rounded-[16px]' />
                      <Skeleton className='h-12 rounded-[16px]' />
                      <Skeleton className='h-12 rounded-[16px]' />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className='hover:bg-transparent'>
                          <TableHead>Student</TableHead>
                          <TableHead>Student UUID</TableHead>
                          <TableHead>Enrollment Status</TableHead>
                          <TableHead>Enrolled On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentRows.length > 0 ? (
                          studentRows.map(student => (
                            <TableRow key={student.studentUuid}>
                              <TableCell className='font-medium'>{student.fullName}</TableCell>
                              <TableCell className='text-muted-foreground'>
                                {student.studentUuid.slice(0, 8)}
                              </TableCell>
                              <TableCell>{student.status}</TableCell>
                              <TableCell>{student.enrolledOn}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className='hover:bg-transparent'>
                            <TableCell colSpan={4} className='text-muted-foreground py-10 text-center'>
                              No enrolled students found for this class.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
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
                description='This tab stays open for upcoming instructor actions, assignments, and class tasks in a later update.'
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
