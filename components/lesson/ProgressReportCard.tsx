'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor-lazy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { STALE_TIMES } from '@/lib/query-client';
import {
  addEnrollmentFeedbackMutation,
  getEnrollmentGradeBookQueryKey,
  getProgressReportOptions,
  getProgressReportQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';
import { hasApiError } from './workbook-data';

const num = (value?: number | null) =>
  value == null ? '—' : String(Number(Number(value).toFixed(2)));

/**
 * One learner's progress report for a course, as the server calculates it: final grade and label,
 * lesson-by-lesson marks, attendance and feedback, with a PDF download.
 */
export function ProgressReportCard({
  courseUuid,
  enrollmentUuid,
  studentName,
  allowFeedback = false,
}: {
  courseUuid: string;
  enrollmentUuid: string;
  studentName: string;
  allowFeedback?: boolean;
}) {
  const query = useQuery({
    ...getProgressReportOptions({ path: { courseUuid, enrollmentUuid } }),
    enabled: Boolean(courseUuid && enrollmentUuid),
    staleTime: STALE_TIMES.live,
  });

  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data)) {
    return <WorkbookError title='Unable to load the progress report' retry={() => void query.refetch()} />;
  }
  const report = query.data?.data;
  if (!report) return <EmptyState title='No progress report yet' />;

  const finalScore =
    report.average_lesson_score != null && report.lesson_max_score != null
      ? `${num(report.average_lesson_score)} / ${num(report.lesson_max_score)}`
      : null;

  return (
    <Card>
      <CardHeader className='flex flex-row flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0 space-y-1'>
          <CardTitle className='text-base'>{report.course_name ?? 'Course'}</CardTitle>
          <p className='text-muted-foreground text-sm'>
            {finalScore ? `Final score ${finalScore} · ` : ''}
            {report.final_grade != null ? `${num(report.final_grade)}%` : 'Not graded yet'}
            {report.progress_percentage != null ? ` · ${num(report.progress_percentage)}% graded` : ''}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {report.final_grade_label && <Badge variant='success'>{report.final_grade_label}</Badge>}
          <Badge variant='outline'>{report.result_status ?? 'IN_PROGRESS'}</Badge>
          <Button
            size='sm'
            variant='outline'
            onClick={async () => {
              const { exportProgressReportPdf } = await import('./progress-report-pdf');
              exportProgressReportPdf(report, studentName);
            }}
          >
            <Download className='mr-2 h-4 w-4' />
            Download report
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='overflow-x-auto'>
          <Table aria-label={`Lesson marks for ${studentName}`}>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'>#</TableHead>
                <TableHead className='min-w-56'>Material covered</TableHead>
                <TableHead className='w-28'>Attendance</TableHead>
                <TableHead className='w-28'>Marks</TableHead>
                <TableHead className='min-w-72'>Criteria</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(report.lessons ?? []).map(lesson => {
                const mark = lesson.marks?.[0];
                return (
                  <TableRow key={lesson.lesson_uuid}>
                    <TableCell>{lesson.lesson_number}</TableCell>
                    <TableCell className='whitespace-normal'>
                      <p className='font-medium'>{lesson.lesson_title}</p>
                      {lesson.topic_covered && (
                        <p className='text-muted-foreground text-xs'>{lesson.topic_covered}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {lesson.attendance ? (lesson.attendance === 'ATTENDED' ? 'Present' : 'Absent') : '—'}
                    </TableCell>
                    <TableCell>
                      {mark?.status === 'graded' ? (
                        `${num(mark.score)} / ${num(mark.max_score)}`
                      ) : (
                        <span className='text-muted-foreground'>{mark?.status ?? '—'}</span>
                      )}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-xs whitespace-normal'>
                      {(mark?.criteria ?? [])
                        .map(criterion => `${criterion.criteria_name}: ${num(criterion.points)}`)
                        .join(' · ') || '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <FeedbackSection
          courseUuid={courseUuid}
          enrollmentUuid={enrollmentUuid}
          current={report.instructor_comments}
          allowFeedback={allowFeedback}
        />
      </CardContent>
    </Card>
  );
}

function FeedbackSection({
  courseUuid,
  enrollmentUuid,
  current,
  allowFeedback,
}: {
  courseUuid: string;
  enrollmentUuid: string;
  current?: string | null;
  allowFeedback: boolean;
}) {
  const client = useQueryClient();
  const [draft, setDraft] = useState('');
  // Bumped after a save so the editor remounts empty.
  const [editorKey, setEditorKey] = useState(0);
  const mutation = useMutation(addEnrollmentFeedbackMutation());
  const fieldId = `feedback-${enrollmentUuid}`;
  const hasText = draft.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;

  return (
    <section className='space-y-2'>
      <h3 className='text-sm font-semibold'>Instructor comments</h3>
      {current ? (
        <RichTextRenderer htmlString={current} />
      ) : (
        <p className='text-muted-foreground text-sm'>No comments yet.</p>
      )}
      {allowFeedback && (
        <div className='space-y-2'>
          <Label id={fieldId}>Add a comment</Label>
          <div role='group' aria-labelledby={fieldId}>
            <SimpleEditor key={editorKey} value={draft} onChange={setDraft} />
          </div>
          <div className='flex justify-end'>
            <Button
              size='sm'
              disabled={!hasText || mutation.isPending}
              onClick={async () => {
                const response = await mutation.mutateAsync({
                  path: { courseUuid, enrollmentUuid },
                  body: { comments: draft },
                });
                if (hasApiError(response)) {
                  toast.error(response.message || 'Only the class instructor can comment on this student.');
                  return;
                }
                setDraft('');
                setEditorKey(key => key + 1);
                toast.success('Comment saved. Earlier comments are kept.');
                await Promise.all([
                  client.invalidateQueries({
                    queryKey: getProgressReportQueryKey({ path: { courseUuid, enrollmentUuid } }),
                  }),
                  client.invalidateQueries({
                    queryKey: getEnrollmentGradeBookQueryKey({ path: { courseUuid, enrollmentUuid } }),
                  }),
                ]);
              }}
            >
              Save comment
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
