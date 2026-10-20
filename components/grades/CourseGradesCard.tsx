'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useState } from 'react';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import { getProgressReportOptions } from '@/services/client/@tanstack/react-query.gen';
import type { CourseProgressReport } from '@/services/client/types.gen';

type LessonRow = NonNullable<CourseProgressReport['lessons']>[number];

const num = (value?: number | null) =>
  value == null ? '—' : String(Number(Number(value).toFixed(2)));

/** A learner's grades for one course, as their instructor submitted them. Drafts never appear. */
export function CourseGradesCard({
  courseUuid,
  enrollmentUuid,
  studentName,
  courseName,
}: {
  courseUuid: string;
  enrollmentUuid: string;
  studentName: string;
  courseName?: string;
}) {
  const query = useQuery({
    ...getProgressReportOptions({ path: { courseUuid, enrollmentUuid } }),
    enabled: Boolean(courseUuid && enrollmentUuid),
    staleTime: STALE_TIMES.live,
    retry: false,
  });

  if (query.isLoading) return <Skeleton className='h-64 w-full rounded-2xl' />;
  const report = query.data?.success === false ? undefined : query.data?.data;
  if (query.isError || !report) {
    return (
      <section className='bg-card border-border rounded-2xl border p-5'>
        <h2 className='text-base font-semibold'>{courseName ?? 'Course'}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>Grades for this course are not available yet.</p>
      </section>
    );
  }
  return <ReportView report={report} studentName={studentName} />;
}

export function ReportView({
  report,
  studentName,
  audience = 'learner',
}: {
  report: CourseProgressReport;
  studentName: string;
  /** Who is reading: the learner is addressed as "your", a guardian is not. */
  audience?: 'learner' | 'guardian';
}) {
  const lessons = report.lessons ?? [];
  const graded = lessons.filter(lesson => lesson.marks?.[0]?.status === 'graded').length;
  const [open, setOpen] = useState<string | null>(null);
  const average =
    report.average_lesson_score != null && report.lesson_max_score != null
      ? `${num(report.average_lesson_score)} / ${num(report.lesson_max_score)}`
      : '—';

  return (
    <section
      data-testid='course-grades'
      className='bg-card border-border overflow-hidden rounded-2xl border'
    >
      <div className='from-primary to-primary/40 h-2 bg-gradient-to-r' />
      <div className='flex flex-col gap-4 p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <h2 className='text-lg font-semibold'>{report.course_name ?? 'Course'}</h2>
          <div className='flex flex-wrap items-center gap-2'>
            {report.final_grade_label && <Badge variant='success'>{report.final_grade_label}</Badge>}
            <Button
              size='sm'
              variant='outline'
              onClick={async () => {
                const { exportProgressReportPdf } = await import('@/components/lesson/progress-report-pdf');
                exportProgressReportPdf(report, studentName);
              }}
            >
              <Download className='mr-2 size-4' />
              Download report (PDF)
            </Button>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-3'>
          <Stat label='Average lesson' value={average} />
          <Stat
            label='Final grade so far'
            value={report.final_grade != null ? `${num(report.final_grade)}%` : 'Not graded yet'}
          />
          <Stat label='Lessons graded' value={`${graded} of ${lessons.length}`} />
        </div>

        <ul className='flex flex-col gap-2'>
          {lessons.map(lesson => (
            <LessonItem
              key={lesson.lesson_uuid ?? String(lesson.lesson_number)}
              lesson={lesson}
              open={open === lesson.lesson_uuid}
              onToggle={() => setOpen(open === lesson.lesson_uuid ? null : (lesson.lesson_uuid ?? null))}
            />
          ))}
        </ul>

        <div className='border-border border-t pt-4'>
          <h3 className='mb-2 text-sm font-semibold'>
            {audience === 'guardian' ? 'From the instructor' : 'From your instructor'}
          </h3>
          {report.instructor_comments ? (
            <div className='text-sm' data-testid='instructor-comments'>
              <RichTextRenderer htmlString={report.instructor_comments} />
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>No comments yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='border-border rounded-xl border p-3'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='text-xl font-bold'>{value}</p>
    </div>
  );
}

function LessonItem({ lesson, open, onToggle }: { lesson: LessonRow; open: boolean; onToggle: () => void }) {
  const mark = lesson.marks?.[0];
  const isGraded = mark?.status === 'graded';
  return (
    <li className='border-border rounded-xl border'>
      <button
        type='button'
        onClick={onToggle}
        aria-expanded={open}
        className='flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left'
      >
        <span className='text-muted-foreground w-7'>{lesson.lesson_number}</span>
        <span className='flex-1 font-medium'>{lesson.lesson_title}</span>
        <span className='font-mono text-sm'>
          {isGraded ? `${num(mark?.score)} / ${num(mark?.max_score)}` : 'Not graded yet'}
        </span>
        {open ? <ChevronUp className='size-4' aria-hidden /> : <ChevronDown className='size-4' aria-hidden />}
      </button>
      {open && (
        <div className='text-muted-foreground flex flex-col gap-1 px-4 pb-3 pl-14 text-sm'>
          {isGraded ? (
            <>
              <span>
                {(mark?.criteria ?? [])
                  .map(criterion => `${criterion.criteria_name} ${num(criterion.points)}`)
                  .join(' · ') || 'No criteria recorded'}
              </span>
              {mark?.comments && (
                <div className='text-foreground'>
                  <RichTextRenderer htmlString={mark.comments} />
                </div>
              )}
            </>
          ) : (
            <>
              <span>The instructor has not submitted this score yet.</span>
              <span>Lessons not graded yet do not count towards the final grade.</span>
            </>
          )}
        </div>
      )}
    </li>
  );
}
