'use client';

import { motion } from 'framer-motion';
import {
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import { cx, getCardClasses, getEmptyStateClasses, getStatCardClasses } from '@/lib/design-system';
import {
  getCourseEnrollmentsOptions,
  getEnrollmentGradeBookOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import {
  BookOpenCheck,
  ChartColumnBig,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';

type DetailTab = 'overview' | 'assignments' | 'quizzes' | 'exams';

type CourseGradeRow = {
  classTitles: string[];
  course: {
    title: string;
    uuid: string;
  };
  enrollment: any;
  gradebook: any | null;
};

const PAGEABLE = { pageable: {} };
const GRID_COLOR = 'hsl(var(--border))';
const AXIS_COLOR = 'hsl(var(--muted-foreground))';

const tooltipStyles = {
  backgroundColor: 'hsl(var(--background))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '16px',
  color: 'hsl(var(--foreground))',
};

const chartMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut' },
};

function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return 'Pending';
  return `${Math.round(value)}%`;
}

function formatCourseStatus(status?: string) {
  if (!status) return 'Unknown';
  return status
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getGradeLabel(value?: number | null) {
  if (value == null || Number.isNaN(value)) return 'N/A';
  if (value >= 80) return 'A';
  if (value >= 70) return 'B';
  if (value >= 60) return 'C';
  if (value >= 50) return 'D';
  return 'F';
}

function getGradeTone(value?: number | null) {
  if (value == null || Number.isNaN(value)) return 'text-muted-foreground';
  if (value >= 80) return 'text-success';
  if (value >= 60) return 'text-primary';
  if (value >= 40) return 'text-warning';
  return 'text-destructive';
}

function getCourseStatusVariant(status?: string) {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'ACTIVE') return 'secondary' as const;
  if (status === 'SUSPENDED') return 'warning' as const;
  return 'outline' as const;
}

function getItemTone(itemType?: string) {
  const normalized = String(itemType || '').toLowerCase();
  if (normalized === 'quiz') return 'secondary' as const;
  if (normalized === 'exam') return 'warning' as const;
  return 'outline' as const;
}

function normalizeType(value?: string | null) {
  return String(value || '').toLowerCase();
}

function ChartCard({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <motion.div {...chartMotion}>
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

export function StudentAssessmentWorkspace() {
  const student = useStudent();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'assessment', title: 'Assessment', url: '/dashboard/assessment', isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  const { classDefinitions, loading: classDefinitionsLoading } =
    useStudentClassDefinitions(student);

  const courseList = useMemo(() => {
    const courseMap = new Map<
      string,
      {
        classTitles: string[];
        title: string;
        uuid: string;
      }
    >();

    (classDefinitions ?? []).forEach((classDefinition: any) => {
      const courseUuid = classDefinition.course?.uuid as string | undefined;
      if (!courseUuid) return;

      const classTitle =
        classDefinition.classDetails?.title ||
        classDefinition.classDetails?.name ||
        'Untitled class';
      const courseTitle =
        classDefinition.course?.name || classDefinition.course?.title || 'Untitled course';

      const existing = courseMap.get(courseUuid);
      if (existing) {
        if (!existing.classTitles.includes(classTitle)) {
          existing.classTitles.push(classTitle);
        }
        return;
      }

      courseMap.set(courseUuid, {
        classTitles: [classTitle],
        title: courseTitle,
        uuid: courseUuid,
      });
    });

    return Array.from(courseMap.values()).sort((left, right) =>
      left.title.localeCompare(right.title)
    );
  }, [classDefinitions]);

  const courseEnrollmentQueries = useQueries({
    queries: courseList.map(course => ({
      ...getCourseEnrollmentsOptions({
        path: { courseUuid: course.uuid },
        query: PAGEABLE,
      }),
      enabled: !!course.uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const courseEnrollmentRows = useMemo(
    () =>
      courseList
        .map((course, index) => {
          const courseEnrollments = courseEnrollmentQueries[index]?.data?.data?.content ?? [];
          const matchingEnrollment =
            courseEnrollments.find(
              (enrollment: any) => enrollment.student_uuid === student?.uuid
            ) ?? null;

          if (!matchingEnrollment?.uuid) return null;

          return {
            classTitles: course.classTitles,
            course,
            enrollment: matchingEnrollment,
          };
        })
        .filter(
          (
            row
          ): row is {
            classTitles: string[];
            course: { classTitles: string[]; title: string; uuid: string };
            enrollment: any;
          } => Boolean(row)
        ),
    [courseEnrollmentQueries, courseList, student?.uuid]
  );

  const gradebookQueries = useQueries({
    queries: courseEnrollmentRows.map(row => ({
      ...getEnrollmentGradeBookOptions({
        path: {
          courseUuid: row.course.uuid,
          enrollmentUuid: row.enrollment.uuid,
        },
      }),
      enabled: !!row.course.uuid && !!row.enrollment.uuid,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const courseGrades = useMemo<CourseGradeRow[]>(
    () =>
      courseEnrollmentRows.map((row, index) => ({
        classTitles: row.classTitles,
        course: row.course,
        enrollment: row.enrollment,
        gradebook: gradebookQueries[index]?.data?.data ?? null,
      })),
    [courseEnrollmentRows, gradebookQueries]
  );

  useEffect(() => {
    if (!selectedCourseId && courseGrades[0]?.course.uuid) {
      setSelectedCourseId(courseGrades[0].course.uuid);
    }
  }, [courseGrades, selectedCourseId]);

  const selectedCourse =
    courseGrades.find(courseGrade => courseGrade.course.uuid === selectedCourseId) ??
    courseGrades[0];

  const gradeSummary = useMemo(() => {
    const finalGrades = courseGrades
      .map(courseGrade => courseGrade.gradebook?.final_grade ?? courseGrade.enrollment?.final_grade)
      .filter((grade): grade is number => typeof grade === 'number');

    const averageFinalGrade =
      finalGrades.length > 0
        ? Math.round(finalGrades.reduce((total, grade) => total + grade, 0) / finalGrades.length)
        : 0;

    const gradedWeights = courseGrades
      .map(courseGrade => courseGrade.gradebook?.graded_weight_percentage)
      .filter((value): value is number => typeof value === 'number');

    const averageCoverage =
      gradedWeights.length > 0
        ? Math.round(
            gradedWeights.reduce((total, value) => total + value, 0) / gradedWeights.length
          )
        : 0;

    const completedCourses = courseGrades.filter(
      courseGrade => String(courseGrade.enrollment?.status).toUpperCase() === 'COMPLETED'
    ).length;

    const bestCourse =
      [...courseGrades]
        .filter(courseGrade => typeof courseGrade.gradebook?.final_grade === 'number')
        .sort(
          (left, right) => (right.gradebook?.final_grade ?? 0) - (left.gradebook?.final_grade ?? 0)
        )[0] ?? null;

    return {
      averageCoverage,
      averageFinalGrade,
      bestCourse,
      completedCourses,
      totalCourses: courseGrades.length,
    };
  }, [courseGrades]);

  const courseGradeChartData = useMemo(
    () =>
      courseGrades.map(courseGrade => ({
        course: courseGrade.course.title,
        finalGrade: courseGrade.gradebook?.final_grade ?? courseGrade.enrollment?.final_grade ?? 0,
        gradedWeight: courseGrade.gradebook?.graded_weight_percentage ?? 0,
      })),
    [courseGrades]
  );

  const selectedCourseComponentData = useMemo(
    () =>
      (selectedCourse?.gradebook?.components ?? []).map((component: any) => ({
        achieved: component.aggregate_score?.percentage ?? 0,
        component:
          component.assessment?.title || component.assessment?.assessment_type || 'Component',
        weight: component.assessment?.weight_percentage ?? 0,
      })),
    [selectedCourse]
  );

  const selectedCourseCoverageData = useMemo(() => {
    const graded = selectedCourse?.gradebook?.graded_weight_percentage ?? 0;
    const pending = Math.max(0, 100 - graded);

    return [
      { color: 'hsl(var(--chart-1))', label: 'Graded weight', value: graded },
      { color: 'hsl(var(--chart-3))', label: 'Pending weight', value: pending },
    ];
  }, [selectedCourse]);

  const selectedCourseLineItems = useMemo(() => {
    const components = selectedCourse?.gradebook?.components ?? [];

    return components.flatMap((component: any) =>
      (component.line_items ?? []).map((lineItemEntry: any) => ({
        assessmentType: normalizeType(component.assessment?.assessment_type),
        comments: lineItemEntry.score?.comments,
        componentTitle: component.assessment?.title || 'Assessment component',
        dueAt: lineItemEntry.line_item?.due_at,
        itemType: normalizeType(lineItemEntry.line_item?.item_type),
        percentage: lineItemEntry.score?.percentage,
        scoreDisplay: lineItemEntry.score?.grade_display,
        title: lineItemEntry.line_item?.title || 'Untitled item',
        weight: lineItemEntry.line_item?.weight_percentage,
      }))
    );
  }, [selectedCourse]);

  const detailLineItems = useMemo(() => {
    if (detailTab === 'overview') return selectedCourseLineItems;

    if (detailTab === 'quizzes') {
      return selectedCourseLineItems.filter(item => item.itemType === 'quiz');
    }

    if (detailTab === 'exams') {
      return selectedCourseLineItems.filter(
        item => item.itemType === 'exam' || item.assessmentType === 'exam'
      );
    }

    return selectedCourseLineItems.filter(
      item =>
        !['quiz', 'exam'].includes(item.itemType) && !['quiz', 'exam'].includes(item.assessmentType)
    );
  }, [detailTab, selectedCourseLineItems]);

  const isLoading =
    classDefinitionsLoading ||
    courseEnrollmentQueries.some(query => query.isLoading) ||
    gradebookQueries.some(query => query.isLoading);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-32 rounded-[24px]' />
          ))}
        </div>
        <div className='grid gap-4 xl:grid-cols-[1.1fr_0.9fr]'>
          <Skeleton className='h-[360px] rounded-[28px]' />
          <Skeleton className='h-[360px] rounded-[28px]' />
        </div>
        <Skeleton className='h-[420px] rounded-[28px]' />
      </div>
    );
  }

  if (courseGrades.length === 0) {
    return (
      <div className={getEmptyStateClasses()}>
        <ChartColumnBig className='text-primary/70 h-10 w-10' />
        <div className='space-y-1'>
          <h3 className='text-lg font-semibold'>No course grades available yet</h3>
          <p className='text-muted-foreground max-w-lg text-sm'>
            Final grades and weighted assessment breakdowns appear here once you have active course
            enrollments with gradebook data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {[
          {
            helper: 'With gradebook access',
            icon: BookOpenCheck,
            label: 'Enrolled courses',
            value: gradeSummary.totalCourses,
          },
          {
            helper: 'Across all enrolled courses',
            icon: Trophy,
            label: 'Average final grade',
            value: `${gradeSummary.averageFinalGrade}%`,
          },
          {
            helper: 'Average weighted work graded',
            icon: ClipboardCheck,
            label: 'Grading coverage',
            value: `${gradeSummary.averageCoverage}%`,
          },
          {
            helper: gradeSummary.bestCourse
              ? `Best result: ${gradeSummary.bestCourse.course.title}`
              : 'No graded course yet',
            icon: GraduationCap,
            label: 'Completed courses',
            value: gradeSummary.completedCourses,
          },
        ].map(metric => (
          <Card key={metric.label} className={getStatCardClasses()}>
            <CardContent className='p-0'>
              <div className='flex items-center gap-4'>
                <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                  <metric.icon className='h-5 w-5' />
                </div>
                <div className='min-w-0'>
                  <p className='text-muted-foreground text-sm'>{metric.label}</p>
                  <p className='text-foreground text-2xl font-semibold'>{metric.value}</p>
                  <p className='text-muted-foreground text-xs'>{metric.helper}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className='grid gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
        <ChartCard
          description='Animated view of your final grades and current gradebook coverage for each course.'
          title='Course grade trend'
        >
          <motion.div {...chartMotion} className='h-[300px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart barGap={18} data={courseGradeChartData}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray='3 3' />
                <XAxis
                  axisLine={false}
                  dataKey='course'
                  tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyles}
                  cursor={{ fill: 'hsl(var(--muted) / 0.15)' }}
                />
                <Bar
                  animationDuration={900}
                  animationEasing='ease-out'
                  dataKey='finalGrade'
                  fill='hsl(var(--chart-1))'
                  name='Final grade'
                  radius={[12, 12, 0, 0]}
                />
                <Bar
                  animationBegin={150}
                  animationDuration={900}
                  animationEasing='ease-out'
                  dataKey='gradedWeight'
                  fill='hsl(var(--chart-2))'
                  name='Graded weight'
                  radius={[12, 12, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </ChartCard>

        <ChartCard
          description='Weighted assessment coverage for the course selected below.'
          title={selectedCourse ? `${selectedCourse.course.title} coverage` : 'Coverage'}
        >
          <motion.div {...chartMotion} className='h-[300px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  animationDuration={900}
                  animationEasing='ease-out'
                  cx='50%'
                  cy='50%'
                  data={selectedCourseCoverageData}
                  dataKey='value'
                  innerRadius={72}
                  outerRadius={104}
                  paddingAngle={4}
                >
                  {selectedCourseCoverageData.map(segment => (
                    <Cell key={segment.label} fill={segment.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyles} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <div className='mt-4 grid gap-2'>
            {selectedCourseCoverageData.map(segment => (
              <div
                key={segment.label}
                className='border-border/60 bg-background/70 flex items-center justify-between rounded-2xl border px-4 py-3'
              >
                <div className='flex items-center gap-3'>
                  <span
                    className='h-2.5 w-2.5 rounded-full'
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className='text-foreground text-sm'>{segment.label}</span>
                </div>
                <span className='text-foreground text-sm font-semibold'>
                  {formatPercent(segment.value)}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard
        description='Review final grades, status, and weighted grading progress for each enrolled course.'
        title='Course gradebook'
      >
        <div className='grid gap-4 lg:grid-cols-[0.95fr_1.05fr]'>
          <div className='space-y-3'>
            {courseGrades.map((courseGrade, index) => {
              const finalGrade =
                courseGrade.gradebook?.final_grade ?? courseGrade.enrollment?.final_grade ?? null;
              const isSelected = selectedCourse?.course.uuid === courseGrade.course.uuid;

              return (
                <button
                  key={courseGrade.course.uuid}
                  className={cx(
                    'w-full rounded-[24px] border p-4 text-left transition',
                    isSelected
                      ? 'border-primary/30 bg-primary/10 shadow-sm'
                      : 'border-border/60 bg-background/70 hover:border-primary/20 hover:bg-muted/30'
                  )}
                  onClick={() => setSelectedCourseId(courseGrade.course.uuid)}
                  type='button'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='space-y-2'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge
                          variant={getCourseStatusVariant(String(courseGrade.enrollment?.status))}
                        >
                          {formatCourseStatus(String(courseGrade.enrollment?.status))}
                        </Badge>
                        {index === 0 ? (
                          <Badge
                            variant='outline'
                            className='border-primary/20 bg-primary/10 text-primary'
                          >
                            <Sparkles className='mr-1 h-3.5 w-3.5' />
                            Latest focus
                          </Badge>
                        ) : null}
                      </div>
                      <div>
                        <p className='text-foreground text-lg font-semibold'>
                          {courseGrade.course.title}
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          {courseGrade.classTitles.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className='text-right'>
                      <p className={cx('text-2xl font-semibold', getGradeTone(finalGrade))}>
                        {formatPercent(finalGrade)}
                      </p>
                      <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                        Grade {getGradeLabel(finalGrade)}
                      </p>
                    </div>
                  </div>

                  <div className='mt-4 space-y-2'>
                    <div className='text-muted-foreground flex items-center justify-between text-xs'>
                      <span>Weighted grading progress</span>
                      <span>{formatPercent(courseGrade.gradebook?.graded_weight_percentage)}</span>
                    </div>
                    <Progress value={courseGrade.gradebook?.graded_weight_percentage ?? 0} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className='space-y-4'>
            <Card className='border-border/60'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>
                  {selectedCourse?.course.title || 'Selected course'}
                </CardTitle>
                <CardDescription>
                  Final course outcome and component-level gradebook summary.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-3 sm:grid-cols-3'>
                  <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                    <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                      Final grade
                    </p>
                    <p
                      className={cx(
                        'mt-1 text-xl font-semibold',
                        getGradeTone(
                          selectedCourse?.gradebook?.final_grade ??
                            selectedCourse?.enrollment?.final_grade
                        )
                      )}
                    >
                      {formatPercent(
                        selectedCourse?.gradebook?.final_grade ??
                          selectedCourse?.enrollment?.final_grade
                      )}
                    </p>
                  </div>
                  <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                    <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                      Weighted coverage
                    </p>
                    <p className='text-foreground mt-1 text-xl font-semibold'>
                      {formatPercent(selectedCourse?.gradebook?.graded_weight_percentage)}
                    </p>
                  </div>
                  <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                    <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                      Configured weight
                    </p>
                    <p className='text-foreground mt-1 text-xl font-semibold'>
                      {formatPercent(selectedCourse?.gradebook?.configured_weight_percentage)}
                    </p>
                  </div>
                </div>

                <motion.div {...chartMotion} className='h-[280px] w-full'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={selectedCourseComponentData} layout='vertical'>
                      <CartesianGrid stroke={GRID_COLOR} strokeDasharray='3 3' horizontal={false} />
                      <XAxis
                        allowDecimals={false}
                        axisLine={false}
                        domain={[0, 100]}
                        tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                        tickLine={false}
                        type='number'
                      />
                      <YAxis
                        axisLine={false}
                        dataKey='component'
                        tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                        tickLine={false}
                        type='category'
                        width={120}
                      />
                      <Tooltip contentStyle={tooltipStyles} />
                      <Bar
                        animationDuration={1000}
                        animationEasing='ease-out'
                        dataKey='achieved'
                        fill='hsl(var(--chart-1))'
                        name='Achieved'
                        radius={[0, 12, 12, 0]}
                      />
                      <Bar
                        animationBegin={120}
                        animationDuration={1000}
                        animationEasing='ease-out'
                        dataKey='weight'
                        fill='hsl(var(--chart-3))'
                        name='Weight'
                        radius={[0, 12, 12, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </CardContent>
            </Card>

            <Card className='border-border/60'>
              <CardHeader className='pb-3'>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                  <div>
                    <CardTitle className='text-base'>Assessment detail</CardTitle>
                    <CardDescription>
                      Drill into the scored items contributing to this course grade.
                    </CardDescription>
                  </div>
                  <Tabs onValueChange={value => setDetailTab(value as DetailTab)} value={detailTab}>
                    <TabsList className='grid w-full grid-cols-4 lg:w-[420px]'>
                      <TabsTrigger value='overview'>All</TabsTrigger>
                      <TabsTrigger value='assignments'>Assignments</TabsTrigger>
                      <TabsTrigger value='quizzes'>Quizzes</TabsTrigger>
                      <TabsTrigger value='exams'>Exams</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {detailLineItems.length === 0 ? (
                  <div className={cx(getEmptyStateClasses(), 'min-h-[220px]')}>
                    <FileText className='text-primary/70 h-10 w-10' />
                    <div className='space-y-1'>
                      <h3 className='text-lg font-semibold'>No scored items in this view yet</h3>
                      <p className='text-muted-foreground max-w-lg text-sm'>
                        Switch tabs or wait for more assessment items to be graded in this course.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {detailLineItems.map(item => (
                      <motion.div
                        key={`${item.componentTitle}-${item.title}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className='border-border/60 bg-background/70 rounded-[24px] border p-4'
                      >
                        <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                          <div className='space-y-2'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <Badge variant={getItemTone(item.itemType)}>
                                {item.itemType || item.assessmentType || 'assessment'}
                              </Badge>
                              <Badge variant='outline'>{item.componentTitle}</Badge>
                            </div>
                            <div>
                              <p className='text-foreground text-base font-semibold'>
                                {item.title}
                              </p>
                              <p className='text-muted-foreground text-sm'>
                                {item.dueAt
                                  ? `Due ${new Intl.DateTimeFormat('en-US', {
                                      dateStyle: 'medium',
                                    }).format(new Date(item.dueAt))}`
                                  : 'No due date supplied'}
                              </p>
                            </div>
                          </div>

                          <div className='grid gap-3 sm:grid-cols-2 lg:w-[280px]'>
                            <div className='border-border/60 bg-card rounded-2xl border p-3'>
                              <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                                Score
                              </p>
                              <p
                                className={cx(
                                  'mt-1 text-lg font-semibold',
                                  getGradeTone(item.percentage)
                                )}
                              >
                                {item.scoreDisplay || formatPercent(item.percentage)}
                              </p>
                            </div>
                            <div className='border-border/60 bg-card rounded-2xl border p-3'>
                              <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                                Weight
                              </p>
                              <p className='text-foreground mt-1 text-lg font-semibold'>
                                {item.weight == null ? 'N/A' : `${Math.round(item.weight)}%`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {item.comments ? (
                          <div className='border-border/60 bg-card text-muted-foreground mt-3 rounded-2xl border p-3 text-sm'>
                            {item.comments}
                          </div>
                        ) : null}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
