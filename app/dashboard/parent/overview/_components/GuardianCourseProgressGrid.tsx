'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { BookOpenCheck } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { ReportView } from '@/components/grades/CourseGradesCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { STALE_TIMES } from '@/lib/query-client';
import { getProgressReportOptions } from '@/services/client/@tanstack/react-query.gen';
import type { CourseProgressReport } from '@/services/client/types.gen';
import type { GuardianCourseProgress } from '@/services/guardian';

export type CourseProgressFilter = 'all' | 'ACTIVE' | 'COMPLETED';

interface GuardianCourseProgressGridProps {
  courses: GuardianCourseProgress[];
  filter: CourseProgressFilter;
  onFilterChange: (filter: CourseProgressFilter) => void;
  studentName?: string;
  /** Program cards that lead the grid, so programs and courses read as one set. */
  leading?: ReactNode;
  /** The programs each course counts towards, by course uuid. */
  partOf?: Readonly<Record<string, readonly string[]>>;
}

const filterOptions: { label: string; value: CourseProgressFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
];

export function GuardianCourseProgressGrid({
  courses,
  filter,
  onFilterChange,
  studentName = 'Learner',
  leading,
  partOf,
}: GuardianCourseProgressGridProps) {
  const [openReport, setOpenReport] = useState<CourseProgressReport | null>(null);
  const filteredCourses = useMemo(() => {
    if (filter === 'all') {
      return courses;
    }
    return courses.filter(course => course.status === filter);
  }, [courses, filter]);

  if (!courses.length && !leading) {
    return (
      <Card className='border-border/70'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base font-semibold'>
            <BookOpenCheck className='size-4' />
            Programs and courses
          </CardTitle>
        </CardHeader>
        <CardContent className='border-border/70 rounded-2xl border border-dashed p-6 text-sm'>
          <p className='font-medium'>No active coursework yet.</p>
          <p className='text-muted-foreground'>
            Once the learner enrolls, lessons and progress updates will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/70'>
      <CardHeader className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          <BookOpenCheck className='size-4' />
          Programs and courses
        </CardTitle>
        <div className='flex gap-2'>
          {filterOptions.map(option => (
            <Button
              key={option.value}
              variant={filter === option.value ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => onFilterChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className='grid gap-4 md:grid-cols-2' data-testid='guardian-card-grid'>
        {leading}
        {filteredCourses.map(course => {
          const updatedLabel =
            course.updated_date && !Number.isNaN(Date.parse(course.updated_date))
              ? formatDistanceToNow(new Date(course.updated_date), { addSuffix: true })
              : 'Recently updated';

          const progressValue =
            typeof course.progress_percentage === 'number'
              ? Math.min(Math.max(course.progress_percentage, 0), 100)
              : 0;

          return (
            <div
              key={course.enrollment_uuid ?? course.course_uuid ?? course.course_name}
              className='border-border/70 bg-card/60 rounded-2xl border p-4 shadow-sm'
            >
              <div className='flex items-start justify-between gap-4'>
                <div>
                  {course.course_uuid && partOf?.[course.course_uuid]?.length ? (
                    <p className='text-muted-foreground text-xs'>
                      Course · counts towards {partOf[course.course_uuid]?.join('; ')}
                    </p>
                  ) : null}
                  <p className='text-sm font-semibold'>{course.course_name ?? 'Untitled course'}</p>
                  <p className='text-muted-foreground text-xs'>Updated {updatedLabel}</p>
                </div>
                <Badge
                  variant={
                    course.status === 'COMPLETED'
                      ? 'success'
                      : course.status === 'ACTIVE'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {course.status?.toLowerCase() ?? 'active'}
                </Badge>
              </div>
              <div className='mt-4 space-y-2'>
                <div className='flex items-center justify-between text-xs font-medium'>
                  <span>Progress</span>
                  <span>{progressValue.toFixed(0)}%</span>
                </div>
                <Progress value={progressValue} className='h-2 rounded-full' />
              </div>
              {course.enrollment_uuid && course.course_uuid && (
                <CourseGradeSummary
                  courseUuid={course.course_uuid}
                  enrollmentUuid={course.enrollment_uuid}
                  onOpen={setOpenReport}
                />
              )}
            </div>
          );
        })}
      </CardContent>
      <Sheet open={Boolean(openReport)} onOpenChange={open => !open && setOpenReport(null)}>
        <SheetContent className='w-full overflow-y-auto sm:max-w-3xl'>
          <SheetHeader className='border-b pr-12'>
            <SheetTitle>{openReport?.course_name ?? 'Course'} report</SheetTitle>
            <SheetDescription>
              The lesson-by-lesson report {studentName} sees. Drafts are never shown.
            </SheetDescription>
          </SheetHeader>
          <div className='p-4'>
            {openReport && (
              <ReportView report={openReport} studentName={studentName} audience='guardian' />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}

/** Grade, attendance and the latest instructor comment for one course; nothing when grades are unavailable. */
function CourseGradeSummary({
  courseUuid,
  enrollmentUuid,
  onOpen,
}: {
  courseUuid: string;
  enrollmentUuid: string;
  onOpen: (report: CourseProgressReport) => void;
}) {
  const query = useQuery({
    ...getProgressReportOptions({ path: { courseUuid, enrollmentUuid } }),
    enabled: Boolean(courseUuid && enrollmentUuid),
    staleTime: STALE_TIMES.live,
    retry: false,
  });
  const report = query.data?.success === false ? undefined : query.data?.data;
  if (!report) return null;
  const lessons = report.lessons ?? [];
  const marked = lessons.filter(lesson => lesson.attendance);
  const attended = marked.filter(lesson => lesson.attendance === 'ATTENDED').length;
  const average =
    report.average_lesson_score != null && report.lesson_max_score != null
      ? `${report.average_lesson_score} / ${report.lesson_max_score}`
      : '—';

  return (
    <div
      className='border-border mt-4 flex flex-col gap-3 border-t pt-4'
      data-testid='guardian-grade-summary'
    >
      <div className='flex items-center justify-between gap-2'>
        <span className='text-sm font-semibold'>Grades</span>
        {report.final_grade_label && <Badge variant='success'>{report.final_grade_label}</Badge>}
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <div className='border-border rounded-xl border p-2'>
          <p className='text-muted-foreground text-xs'>Average lesson</p>
          <p className='text-lg font-bold'>{average}</p>
        </div>
        <div className='border-border rounded-xl border p-2'>
          <p className='text-muted-foreground text-xs'>Attendance</p>
          <p className='text-lg font-bold'>
            {marked.length ? `${attended} of ${marked.length}` : '—'}
          </p>
        </div>
      </div>
      {report.instructor_comments && (
        <div className='bg-muted/50 rounded-xl p-3 text-sm'>
          <RichTextRenderer htmlString={report.instructor_comments} />
        </div>
      )}
      <Button size='sm' onClick={() => onOpen(report)}>
        View full report
      </Button>
    </div>
  );
}
