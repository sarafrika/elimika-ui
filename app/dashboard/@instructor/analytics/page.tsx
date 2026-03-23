'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import {
  cx,
  elimikaDesignSystem,
  getCardClasses,
  getEmptyStateClasses,
  getHeaderClasses,
  getStatCardClasses,
} from '@/lib/design-system';
import {
  getCourseEnrollmentsOptions,
  getInstructorRatingSummaryOptions,
  getInstructorScheduleOptions,
  getRevenueDashboard1Options,
  getStudentByIdOptions,
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CalendarDays,
  ChartColumnBig,
  Clock3,
  DollarSign,
  GraduationCap,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type TimeRangeValue = '7' | '30' | '90' | '365';

const ALL_COURSES = 'all-courses';

const timeRangeOptions: { value: TimeRangeValue; label: string }[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
];

const formatPercent = (value: number) => `${Math.round(value)}%`;

const getRevenueAmount = (values?: Array<{ amount?: number }>) => values?.[0]?.amount ?? 0;

function buildDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatStatusLabel(value?: string) {
  if (!value) return 'Unknown';
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getShortLabel(date: Date, range: TimeRangeValue) {
  if (range === '365') {
    return date.toLocaleDateString('en-US', { month: 'short' });
  }

  if (range === '7') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function AnalyticsEmptyState() {
  return (
    <div className={getEmptyStateClasses()}>
      <ChartColumnBig className='text-primary/70 h-10 w-10' />
      <div className='space-y-1'>
        <h3 className='text-lg font-semibold'>No analytics yet</h3>
        <p className='text-muted-foreground max-w-lg text-sm'>
          Instructor analytics will appear here once there are active classes, student enrollments,
          or revenue events tied to your instructor account.
        </p>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <Card className={cx(getCardClasses(), 'p-0 hover:translate-y-0')}>
        <CardHeader className='p-5 pb-3 sm:p-6'>
          <CardTitle className='text-lg'>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className='p-5 pt-0 sm:p-6 sm:pt-0'>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: typeof Users;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className={getStatCardClasses()}>
        <CardContent className='p-0'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 text-primary rounded-2xl p-3'>
              <Icon className='h-5 w-5' />
            </div>
            <div className='min-w-0'>
              <p className='text-muted-foreground text-sm'>{title}</p>
              <p className='text-foreground truncate text-2xl font-semibold'>{value}</p>
              <p className='text-muted-foreground text-xs'>{helper}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const instructor = useInstructor();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('30');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(ALL_COURSES);

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'analytics', title: 'Analytics', url: '/dashboard/analytics', isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  const { start, end } = useMemo(() => buildDateRange(Number(timeRange)), [timeRange]);

  const { classes, isLoading: classesLoading } = useInstructorClassesWithSchedules(
    instructor?.uuid
  );

  const uniqueCourses = useMemo(() => {
    const map = new Map<string, { uuid: string; name: string }>();

    classes.forEach(classItem => {
      const course = classItem.course;
      if (!course?.uuid || !course?.name) return;
      if (!map.has(course.uuid)) {
        map.set(course.uuid, { uuid: course.uuid, name: course.name });
      }
    });

    return Array.from(map.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [classes]);

  const filteredClasses = useMemo(
    () =>
      selectedCourseId === ALL_COURSES
        ? classes
        : classes.filter(classItem => classItem.course?.uuid === selectedCourseId),
    [classes, selectedCourseId]
  );

  const enrollmentQueries = useQueries({
    queries: uniqueCourses.map(course => ({
      ...getCourseEnrollmentsOptions({
        path: { courseUuid: course.uuid },
        query: { pageable: {} },
      }),
      enabled: !!course.uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const courseEnrollments = useMemo(
    () =>
      uniqueCourses.map((course, index) => ({
        course,
        enrollments: enrollmentQueries[index]?.data?.data?.content ?? [],
      })),
    [enrollmentQueries, uniqueCourses]
  );

  const filteredCourseEnrollments = useMemo(
    () =>
      selectedCourseId === ALL_COURSES
        ? courseEnrollments
        : courseEnrollments.filter(item => item.course.uuid === selectedCourseId),
    [courseEnrollments, selectedCourseId]
  );

  const uniqueStudentIds = useMemo(() => {
    const ids = new Set<string>();
    filteredCourseEnrollments.forEach(({ enrollments }) => {
      enrollments.forEach((enrollment: any) => {
        if (enrollment.student_uuid) {
          ids.add(enrollment.student_uuid);
        }
      });
    });
    return Array.from(ids);
  }, [filteredCourseEnrollments]);

  const studentQueries = useQueries({
    queries: uniqueStudentIds.map(studentUuid => ({
      ...getStudentByIdOptions({
        path: { uuid: studentUuid },
      }),
      enabled: !!studentUuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const students = useMemo(
    () => uniqueStudentIds.map((studentUuid, index) => studentQueries[index]?.data?.data ?? null),
    [studentQueries, uniqueStudentIds]
  );

  const userQueries = useQueries({
    queries: students.filter(Boolean).map((student: any) => ({
      ...getUserByUuidOptions({
        path: { uuid: student.user_uuid as string },
      }),
      enabled: !!student?.user_uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const userMap = useMemo(() => {
    const map = new Map<string, any>();

    students.filter(Boolean).forEach((student: any, index) => {
      const user = userQueries[index]?.data?.data;
      if (student?.uuid && user) {
        map.set(student.uuid, user);
      }
    });

    return map;
  }, [students, userQueries]);

  const ratingSummaryQuery = useQuery({
    ...getInstructorRatingSummaryOptions({
      path: { instructorUuid: instructor?.uuid as string },
    }),
    enabled: !!instructor?.uuid,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const scheduleQuery = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { start, end },
    }),
    enabled: !!instructor?.uuid,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const revenueQuery = useQuery({
    ...getRevenueDashboard1Options({
      query: {
        domain: 'instructor',
        start_date: start,
        end_date: end,
      },
    }),
    enabled: !!instructor?.uuid,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const relevantEnrollments = useMemo(
    () => filteredCourseEnrollments.flatMap(item => item.enrollments),
    [filteredCourseEnrollments]
  );

  const uniqueStudentsCount = uniqueStudentIds.length;
  const activeCoursesCount = filteredCourseEnrollments.length;
  const completedEnrollments = relevantEnrollments.filter(
    (enrollment: any) =>
      enrollment.completion_date || enrollment.status?.toLowerCase().includes('completed')
  ).length;
  const completionRate =
    relevantEnrollments.length > 0 ? (completedEnrollments / relevantEnrollments.length) * 100 : 0;
  const averageRating = ratingSummaryQuery.data?.data?.average_rating ?? 0;
  const reviewCount = Number(ratingSummaryQuery.data?.data?.review_count ?? 0);

  const scheduleItems = useMemo(
    () =>
      (scheduleQuery.data?.data ?? []).filter(
        (item: any) =>
          selectedCourseId === ALL_COURSES ||
          filteredClasses.some(classItem => classItem.uuid === item.class_definition_uuid)
      ),
    [filteredClasses, scheduleQuery.data, selectedCourseId]
  );

  const enrollmentTrendData = useMemo(() => {
    const groups = new Map<string, number>();

    relevantEnrollments.forEach((enrollment: any) => {
      const dateValue = enrollment.enrollment_date || enrollment.created_date;
      if (!dateValue) return;
      const date = new Date(dateValue);
      const key = date.toISOString().slice(0, 10);
      groups.set(key, (groups.get(key) ?? 0) + 1);
    });

    return Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, students]) => ({
        label: getShortLabel(new Date(key), timeRange),
        students,
      }));
  }, [relevantEnrollments, timeRange]);

  const teachingLoadData = useMemo(() => {
    const groups = new Map<string, number>();

    scheduleItems.forEach((item: any) => {
      if (!item?.start_time) return;
      const date = new Date(item.start_time);
      const key = date.toISOString().slice(0, 10);
      groups.set(key, (groups.get(key) ?? 0) + 1);
    });

    return Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, sessions]) => ({
        label: getShortLabel(new Date(key), timeRange),
        sessions,
      }));
  }, [scheduleItems, timeRange]);

  const completionDistribution = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    relevantEnrollments.forEach((enrollment: any) => {
      const progress = Number(enrollment.progress_percentage ?? 0);
      const status = enrollment.status?.toLowerCase();

      if (status?.includes('completed') || progress >= 100) {
        completed += 1;
      } else if (progress > 0) {
        inProgress += 1;
      } else {
        notStarted += 1;
      }
    });

    return [
      { name: 'Completed', value: completed, color: 'hsl(var(--primary))' },
      { name: 'In Progress', value: inProgress, color: 'hsl(var(--accent))' },
      { name: 'Not Started', value: notStarted, color: 'hsl(var(--muted-foreground))' },
    ].filter(item => item.value > 0);
  }, [relevantEnrollments]);

  const coursePerformanceData = useMemo(
    () =>
      filteredCourseEnrollments.map(({ course, enrollments }) => {
        const enrolled = enrollments.length;
        const completed = enrollments.filter(
          (enrollment: any) =>
            enrollment.completion_date || enrollment.status?.toLowerCase().includes('completed')
        ).length;
        const grades = enrollments
          .map((enrollment: any) => Number(enrollment.final_grade))
          .filter((grade: number) => !Number.isNaN(grade) && grade > 0);

        const averageGrade =
          grades.length > 0
            ? grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length
            : 0;

        return {
          course: course.name,
          enrolled,
          completionRate: enrolled > 0 ? (completed / enrolled) * 100 : 0,
          averageGrade,
        };
      }),
    [filteredCourseEnrollments]
  );

  const topStudents = useMemo(() => {
    const bucket = new Map<
      string,
      {
        studentId: string;
        name: string;
        courseCount: number;
        completionAverage: number;
        gradeAverage: number;
      }
    >();

    filteredCourseEnrollments.forEach(({ enrollments }) => {
      enrollments.forEach((enrollment: any) => {
        const studentId = enrollment.student_uuid;
        if (!studentId) return;

        const user = userMap.get(studentId);
        const current = bucket.get(studentId);
        const progress = Number(enrollment.progress_percentage ?? 0);
        const grade = Number(enrollment.final_grade ?? 0);

        if (current) {
          current.courseCount += 1;
          current.completionAverage += progress;
          current.gradeAverage += grade;
          return;
        }

        bucket.set(studentId, {
          studentId,
          name: user?.full_name || 'Unknown learner',
          courseCount: 1,
          completionAverage: progress,
          gradeAverage: grade,
        });
      });
    });

    return Array.from(bucket.values())
      .map(item => ({
        ...item,
        completionAverage: item.courseCount > 0 ? item.completionAverage / item.courseCount : 0,
        gradeAverage: item.courseCount > 0 ? item.gradeAverage / item.courseCount : 0,
      }))
      .sort((left, right) => {
        const scoreLeft = left.completionAverage + left.gradeAverage / 2;
        const scoreRight = right.completionAverage + right.gradeAverage / 2;
        return scoreRight - scoreLeft;
      })
      .slice(0, 5);
  }, [filteredCourseEnrollments, userMap]);

  const revenueSeries = useMemo(
    () =>
      (revenueQuery.data?.data?.daily_series ?? []).map(point => ({
        label: point.date ? getShortLabel(new Date(point.date), timeRange) : 'N/A',
        gross: getRevenueAmount(point.gross_totals),
        earnings: getRevenueAmount(point.estimated_earnings),
        orders: Number(point.order_count ?? 0),
      })),
    [revenueQuery.data, timeRange]
  );

  const revenueSummary = revenueQuery.data?.data;
  const instructorEarnings = getRevenueAmount(revenueSummary?.estimated_earnings);
  const grossRevenue = getRevenueAmount(revenueSummary?.gross_totals);
  const sessionsTaught = scheduleItems.length;
  const upcomingSessions = scheduleItems.filter(
    (item: any) => new Date(item.start_time) > new Date()
  ).length;

  const chartMotion = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  };

  const isLoading =
    classesLoading ||
    enrollmentQueries.some(query => query.isLoading) ||
    ratingSummaryQuery.isLoading ||
    scheduleQuery.isLoading ||
    revenueQuery.isLoading ||
    studentQueries.some(query => query.isLoading) ||
    userQueries.some(query => query.isLoading);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-56 w-full rounded-[36px]' />
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <Skeleton className='h-28 w-full rounded-[28px]' />
          <Skeleton className='h-28 w-full rounded-[28px]' />
          <Skeleton className='h-28 w-full rounded-[28px]' />
          <Skeleton className='h-28 w-full rounded-[28px]' />
        </div>
        <Skeleton className='h-[560px] w-full rounded-[28px]' />
      </div>
    );
  }

  if (!uniqueCourses.length && !scheduleItems.length) {
    return <AnalyticsEmptyState />;
  }

  return (
    <main className='space-y-8'>
      <section className={cx(getHeaderClasses(), 'relative overflow-hidden')}>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,97,237,0.14),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(0,97,237,0.12),transparent_36%)] dark:hidden' />
        <div className='relative space-y-6'>
          <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
            <div className='space-y-4'>
              <Badge className={elimikaDesignSystem.components.header.badge}>
                Instructor analytics
              </Badge>
              <div className='space-y-3'>
                <h1 className={elimikaDesignSystem.components.header.title}>
                  Real teaching and learner performance analytics
                </h1>
                <p className={elimikaDesignSystem.components.header.subtitle}>
                  Track live course growth, learner progress, session load, ratings, and instructor
                  earnings using actual platform data.
                </p>
              </div>
            </div>

            <div className='flex w-full flex-col gap-3 sm:flex-row xl:w-auto'>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className='w-full sm:w-[240px]'>
                  <SelectValue placeholder='Filter by course' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_COURSES}>All courses</SelectItem>
                  {uniqueCourses.map(course => (
                    <SelectItem key={course.uuid} value={course.uuid}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={timeRange}
                onValueChange={value => setTimeRange(value as TimeRangeValue)}
              >
                <SelectTrigger className='w-full sm:w-[180px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <MetricCard
              title='Students managed'
              value={String(uniqueStudentsCount)}
              helper='Students across selected courses'
              icon={Users}
            />
            <MetricCard
              title='Courses trained'
              value={String(activeCoursesCount)}
              helper='Courses with active instructor-linked classes'
              icon={BookOpen}
            />
            <MetricCard
              title='Completion rate'
              value={formatPercent(completionRate)}
              helper={`${completedEnrollments} of ${relevantEnrollments.length} course enrollments completed`}
              icon={Trophy}
            />
            <MetricCard
              title='Instructor rating'
              value={averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
              helper={`${reviewCount} review${reviewCount === 1 ? '' : 's'} collected`}
              icon={Star}
            />
          </div>
        </div>
      </section>

      <Tabs defaultValue='overview' className='space-y-6'>
        <TabsList className='bg-muted/60 grid w-full grid-cols-3 rounded-[24px] p-1'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='courses'>Courses</TabsTrigger>
          <TabsTrigger value='students'>Students</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <div className='grid gap-6 xl:grid-cols-2'>
            <ChartCard
              title='Enrollment trend'
              description='New course enrollments over the selected time range.'
            >
              {enrollmentTrendData.length === 0 ? (
                <p className='text-muted-foreground text-sm'>
                  No enrollment activity in this range.
                </p>
              ) : (
                <motion.div {...chartMotion} className='h-[300px] w-full'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={enrollmentTrendData}>
                      <defs>
                        <linearGradient id='enrollmentGradient' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='0%' stopColor='hsl(var(--primary))' stopOpacity={0.4} />
                          <stop offset='100%' stopColor='hsl(var(--primary))' stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke='hsl(var(--border))' strokeDasharray='4 4' />
                      <XAxis dataKey='label' stroke='hsl(var(--muted-foreground))' fontSize={12} />
                      <YAxis
                        stroke='hsl(var(--muted-foreground))'
                        fontSize={12}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 16,
                        }}
                      />
                      <Area
                        type='monotone'
                        dataKey='students'
                        stroke='hsl(var(--primary))'
                        fill='url(#enrollmentGradient)'
                        strokeWidth={2.5}
                        isAnimationActive
                        animationDuration={900}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </ChartCard>

            <ChartCard
              title='Teaching cadence'
              description='Scheduled class sessions across the selected time range.'
            >
              {teachingLoadData.length === 0 ? (
                <p className='text-muted-foreground text-sm'>
                  No scheduled sessions in this range.
                </p>
              ) : (
                <motion.div {...chartMotion} className='h-[300px] w-full'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={teachingLoadData}>
                      <CartesianGrid stroke='hsl(var(--border))' strokeDasharray='4 4' />
                      <XAxis dataKey='label' stroke='hsl(var(--muted-foreground))' fontSize={12} />
                      <YAxis
                        stroke='hsl(var(--muted-foreground))'
                        fontSize={12}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 16,
                        }}
                      />
                      <Bar
                        dataKey='sessions'
                        fill='hsl(var(--accent))'
                        radius={[12, 12, 0, 0]}
                        isAnimationActive
                        animationDuration={850}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </ChartCard>
          </div>

          <div className='grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'>
            <ChartCard
              title='Learner progress distribution'
              description='Enrollment state across completed, active, and not-started learning.'
            >
              {completionDistribution.length === 0 ? (
                <p className='text-muted-foreground text-sm'>No progress data available yet.</p>
              ) : (
                <motion.div {...chartMotion} className='h-[280px] w-full'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={completionDistribution}
                        dataKey='value'
                        nameKey='name'
                        innerRadius={64}
                        outerRadius={102}
                        paddingAngle={4}
                        isAnimationActive
                        animationDuration={900}
                      >
                        {completionDistribution.map(entry => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 16,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              <div className='mt-4 grid gap-2 sm:grid-cols-3'>
                {completionDistribution.map(entry => (
                  <div
                    key={entry.name}
                    className='border-border/60 bg-background/70 rounded-2xl border p-3'
                  >
                    <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                      {entry.name}
                    </p>
                    <p className='text-foreground mt-1 text-lg font-semibold'>{entry.value}</p>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title='Revenue and earnings'
              description='Instructor earnings and gross sales from the selected analytics range.'
            >
              <div className='mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                  <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Gross revenue
                  </p>
                  <p className='text-foreground mt-1 text-lg font-semibold'>
                    {grossRevenue.toLocaleString()}
                  </p>
                </div>
                <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                  <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Instructor earnings
                  </p>
                  <p className='text-foreground mt-1 text-lg font-semibold'>
                    {instructorEarnings.toLocaleString()}
                  </p>
                </div>
                <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                  <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Sessions taught
                  </p>
                  <p className='text-foreground mt-1 text-lg font-semibold'>{sessionsTaught}</p>
                </div>
                <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                  <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    Upcoming sessions
                  </p>
                  <p className='text-foreground mt-1 text-lg font-semibold'>{upcomingSessions}</p>
                </div>
              </div>

              {revenueSeries.length === 0 ? (
                <p className='text-muted-foreground text-sm'>No revenue events in this range.</p>
              ) : (
                <motion.div {...chartMotion} className='h-[280px] w-full'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={revenueSeries}>
                      <defs>
                        <linearGradient id='earningsGradient' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='0%' stopColor='hsl(var(--primary))' stopOpacity={0.35} />
                          <stop offset='100%' stopColor='hsl(var(--primary))' stopOpacity={0.06} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke='hsl(var(--border))' strokeDasharray='4 4' />
                      <XAxis dataKey='label' stroke='hsl(var(--muted-foreground))' fontSize={12} />
                      <YAxis stroke='hsl(var(--muted-foreground))' fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 16,
                        }}
                      />
                      <Area
                        type='monotone'
                        dataKey='earnings'
                        stroke='hsl(var(--primary))'
                        fill='url(#earningsGradient)'
                        strokeWidth={2.5}
                        isAnimationActive
                        animationDuration={950}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value='courses' className='space-y-6'>
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <MetricCard
              title='Scheduled classes'
              value={String(filteredClasses.length)}
              helper='Instructor-linked class definitions'
              icon={CalendarDays}
            />
            <MetricCard
              title='Planned sessions'
              value={String(filteredClasses.flatMap(item => item.schedule ?? []).length)}
              helper='All scheduled sessions across current filter'
              icon={Clock3}
            />
            <MetricCard
              title='Average grade'
              value={
                coursePerformanceData.length
                  ? `${Math.round(
                    coursePerformanceData.reduce((sum, item) => sum + item.averageGrade, 0) /
                    coursePerformanceData.length
                  )}%`
                  : 'N/A'
              }
              helper='Average final grade across filtered courses'
              icon={GraduationCap}
            />
            <MetricCard
              title='Revenue'
              value={grossRevenue.toLocaleString()}
              helper='Instructor-domain revenue in selected range'
              icon={DollarSign}
            />
          </div>

          <ChartCard
            title='Course performance'
            description='Enrollment volume, completion rate, and average grade by course.'
          >
            {coursePerformanceData.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No course performance data available.</p>
            ) : (
              <div className='space-y-3'>
                {coursePerformanceData.map(course => (
                  <motion.div
                    key={course.course}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className='border-border/60 bg-background/75 rounded-[24px] border p-4'
                  >
                    <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                      <div>
                        <p className='text-foreground font-medium'>{course.course}</p>
                        <p className='text-muted-foreground text-sm'>
                          {course.enrolled} student{course.enrolled === 1 ? '' : 's'} enrolled
                        </p>
                      </div>
                      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                        <div>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Completion
                          </p>
                          <p className='text-foreground text-sm font-semibold'>
                            {formatPercent(course.completionRate)}
                          </p>
                        </div>
                        <div>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Avg. grade
                          </p>
                          <p className='text-foreground text-sm font-semibold'>
                            {course.averageGrade > 0
                              ? `${Math.round(course.averageGrade)}%`
                              : 'N/A'}
                          </p>
                        </div>
                        <div className='self-end'>
                          <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                            <motion.div
                              className='bg-primary h-full rounded-full'
                              initial={{ width: 0 }}
                              animate={{ width: `${course.completionRate}%` }}
                              transition={{ duration: 0.75, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ChartCard>
        </TabsContent>

        <TabsContent value='students' className='space-y-6'>
          <div className='grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]'>
            <ChartCard
              title='Top learners'
              description='Learners ranked by progress and final-grade performance across the selected course scope.'
            >
              {topStudents.length === 0 ? (
                <p className='text-muted-foreground text-sm'>No student analytics available.</p>
              ) : (
                <div className='space-y-3'>
                  {topStudents.map((student, index) => (
                    <motion.div
                      key={student.studentId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
                      className='border-border/60 bg-background/75 flex flex-col gap-3 rounded-[24px] border p-4 sm:flex-row sm:items-center sm:justify-between'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-full font-semibold'>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className='text-foreground font-medium'>{student.name}</p>
                          <p className='text-muted-foreground text-sm'>
                            {student.courseCount} course{student.courseCount === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                      <div className='grid gap-2 sm:grid-cols-2'>
                        <div className='bg-muted/50 rounded-2xl px-3 py-2'>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Progress
                          </p>
                          <p className='text-foreground text-sm font-semibold'>
                            {formatPercent(student.completionAverage)}
                          </p>
                        </div>
                        <div className='bg-muted/50 rounded-2xl px-3 py-2'>
                          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                            Avg. grade
                          </p>
                          <p className='text-foreground text-sm font-semibold'>
                            {student.gradeAverage > 0
                              ? `${Math.round(student.gradeAverage)}%`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ChartCard>

            <ChartCard
              title='Enrollment status mix'
              description='Distribution of learner enrollment states in the current filter.'
            >
              {relevantEnrollments.length === 0 ? (
                <p className='text-muted-foreground text-sm'>No enrollment records available.</p>
              ) : (
                <motion.div {...chartMotion} className='h-[320px] w-full'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                      data={Object.entries(
                        relevantEnrollments.reduce(
                          (acc: Record<string, number>, enrollment: any) => {
                            const key = formatStatusLabel(enrollment.status);
                            acc[key] = (acc[key] ?? 0) + 1;
                            return acc;
                          },
                          {}
                        )
                      ).map(([status, total]) => ({ status, total }))}
                    >
                      <CartesianGrid stroke='hsl(var(--border))' strokeDasharray='4 4' />
                      <XAxis dataKey='status' stroke='hsl(var(--muted-foreground))' fontSize={12} />
                      <YAxis
                        stroke='hsl(var(--muted-foreground))'
                        fontSize={12}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 16,
                        }}
                      />
                      <Bar
                        dataKey='total'
                        fill='hsl(var(--primary))'
                        radius={[12, 12, 0, 0]}
                        isAnimationActive
                        animationDuration={900}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
