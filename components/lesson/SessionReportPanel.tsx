'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import Spinner from '@/components/ui/spinner';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { formatDateTime } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getSessionReportOptions,
  getSessionReportQueryKey,
  submitSessionReportMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { RowDto, ScheduledInstance, SessionReport } from '@/services/client/types.gen';
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';
import { invalidateSessionReportData } from './session-report-cache';
import {
  formatReportNumber,
  isBelowClassAverage,
  reportRowKey,
  type ReportScoreSummary,
  type ReportStudentScore,
} from './session-report-scores';
import { useSessionReportScores } from './useSessionReportScores';
import { ScoreFraction } from './ScoreFraction';
import { hasApiError } from './workbook-data';

type FixTarget = 'grading' | 'register';

/**
 * The session's mandatory report and saved assessment marks, with the checklist,
 * class figures and every learner's row. Submitting asks once, inline.
 */
export function SessionReportPanel({
  session,
  onFix,
}: {
  session?: ScheduledInstance;
  onFix: (target: FixTarget) => void;
}) {
  const instanceUuid = session?.uuid ?? '';
  const client = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const query = useQuery({
    ...(instanceUuid
      ? getSessionReportOptions({ path: { instanceUuid } })
      : { queryKey: getSessionReportQueryKey({ path: { instanceUuid: '' } }), queryFn: skipToken }),
    enabled: Boolean(instanceUuid),
    staleTime: STALE_TIMES.live,
  });
  const submit = useMutation({
    ...submitSessionReportMutation(),
    onError: error =>
      toast.error(getErrorMessage(error, 'The session report could not be submitted.')),
  });
  const report = query.data?.data;
  const names = useStudentNames(report?.rows ?? []);

  if (!instanceUuid) return <EmptyState title='Select a class session to see its report' />;
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data) || !report) {
    return (
      <WorkbookError title='Unable to load the session report' retry={() => void query.refetch()} />
    );
  }

  const onSubmit = async () => {
    const response = await submit.mutateAsync({ path: { instanceUuid } }).catch(() => null);
    if (!response) return;
    if (hasApiError(response)) {
      toast.error(response.message || 'The session report could not be submitted.');
      return;
    }
    setConfirming(false);
    toast.success(
      report.status === 'submitted' ? 'Report resubmitted.' : 'Session report submitted.'
    );
    await invalidateSessionReportData(client, instanceUuid, report.class_definition_uuid);
  };

  const checklist = report.checklist ?? [];
  const blockers = checklist.filter(item => item.severity === 'blocker');
  const locked = report.status === 'locked';
  const submitted = report.status === 'submitted';

  return (
    <div className='space-y-4' data-testid='session-report'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className='text-xl font-semibold'>Session report</h2>
          <p className='text-muted-foreground text-sm'>
            {report.class_title} · Lesson {report.lesson_number ?? '—'}
            {report.lesson_title ? ` — ${report.lesson_title}` : ''} ·{' '}
            {formatDateTime(report.start_time, { fallback: '' })}
            {report.duration_minutes != null ? ` · ${Number(report.duration_minutes)} min` : ''}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <StatusPill report={report} />
          {!locked && (
            <Button
              disabled={blockers.length > 0 || confirming}
              onClick={() => setConfirming(true)}
            >
              {submitted ? 'Resubmit report' : 'Submit report'}
            </Button>
          )}
        </div>
      </div>

      <Banner report={report} />

      {confirming && (
        <div
          role='alert'
          className='border-primary/40 bg-primary/5 flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm'
        >
          <p className='flex-1'>
            Submit this report as shown below? The school sees it, and you can still change it until
            the grace period ends.
          </p>
          <Button variant='outline' size='sm' onClick={() => setConfirming(false)}>
            Keep editing
          </Button>
          <Button
            size='sm'
            disabled={submit.isPending || !report.can_submit}
            onClick={() => void onSubmit()}
          >
            {submit.isPending && <Spinner />}
            {submitted ? 'Yes, resubmit' : 'Yes, submit'}
          </Button>
        </div>
      )}

      {checklist.length > 0 && (
        <section className='space-y-2' aria-label='Before you submit'>
          <h3 className='text-sm font-semibold'>
            {blockers.length > 0
              ? `Before you submit · ${blockers.length} to do`
              : 'Before you submit'}
          </h3>
          <ul className='space-y-2'>
            {checklist.map((item, index) => {
              const target = fixTarget(item.code);
              return (
                <li
                  key={`${item.code}-${item.student_uuid ?? index}`}
                  className='flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm'
                >
                  <Badge variant={item.severity === 'blocker' ? 'warning' : 'outline'}>
                    {item.severity === 'blocker' ? 'To do' : 'Note'}
                  </Badge>
                  <span className='flex-1'>
                    {item.student_uuid ? `${names[item.student_uuid] ?? 'A learner'}: ` : ''}
                    {item.message}
                  </span>
                  {target && !locked && (
                    <Button size='sm' variant='outline' onClick={() => onFix(target)}>
                      {target === 'grading' ? 'Score' : 'Open register'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {report.topic_covered && (
        <div className='rounded-xl border p-3 text-sm'>
          <p className='text-muted-foreground text-xs'>What was taught</p>
          <RichTextRenderer htmlString={report.topic_covered} />
        </div>
      )}

      <SessionReportResults report={report} nameOf={id => names[id ?? ''] ?? 'Student'} />
    </div>
  );
}

function fixTarget(code?: string): FixTarget | null {
  if (code === 'SCORE_MISSING' || code === 'SCORE_INCOMPLETE_DRAFT') return 'grading';
  if (code === 'ATTENDANCE_NOT_MARKED' || code === 'TOPIC_NOT_RECORDED') return 'register';
  return null;
}

function StatusPill({ report }: { report: SessionReport }) {
  if (report.status === 'locked') return <Badge variant='outline'>Locked</Badge>;
  if (report.status === 'submitted') return <Badge variant='success'>Submitted</Badge>;
  if (report.overdue) return <Badge variant='destructive'>Overdue</Badge>;
  return (
    <Badge variant='warning'>
      Due {formatDateTime(report.due_at, { fallback: 'after the session' })}
    </Badge>
  );
}

function Banner({ report }: { report: SessionReport }) {
  if (report.status === 'locked') {
    return (
      <p role='status' className='bg-muted rounded-xl p-3 text-sm'>
        This report locked on {formatDateTime(report.editable_until, { fallback: '' })}. Records for
        this session can no longer be changed. Ask a platform admin if a correction is needed.
      </p>
    );
  }
  if (report.status === 'submitted') {
    return (
      <p role='status' className='bg-success/10 rounded-xl p-3 text-sm'>
        Submitted {formatDateTime(report.submitted_at, { fallback: '' })}. You can still change
        anything until {formatDateTime(report.editable_until, { fallback: '' })}.
        {report.changed_since_submission
          ? ' You have changes since then — resubmit so the school sees them.'
          : ''}
      </p>
    );
  }
  if (report.overdue) {
    return (
      <p role='status' className='bg-destructive/10 rounded-xl p-3 text-sm'>
        This report was due {formatDateTime(report.due_at, { fallback: 'after the session' })} and
        the school has been told it is overdue. Submit it as soon as it is complete.
      </p>
    );
  }
  return (
    <p role='status' className='bg-primary/5 rounded-xl p-3 text-sm'>
      Capture the session as it runs. The report is due 24 hours after the session ends; you will be
      reminded.
    </p>
  );
}

/** The session's four headline figures, shared by the trainer's tab and the school's view. */
export function ReportFigures({
  report,
  scores,
}: {
  report: SessionReport;
  scores?: ReportScoreSummary;
}) {
  const a = report.aggregates;
  const tasks = scores?.hasTasks ? scores : undefined;
  const bands = (tasks?.bands ?? a?.band_counts ?? []).filter(b => (b.count ?? 0) > 0);
  const totalLabel = (value?: number) =>
    value == null ? (
      '—'
    ) : tasks?.maxScore != null ? (
      <ScoreFraction score={value} maximum={tasks.maxScore} />
    ) : (
      `${formatReportNumber(value)}%`
    );
  const taskKinds = new Set(
    [...(scores?.rows.values() ?? [])].flatMap(row => row.marks.map(mark => mark.kind))
  );
  const totalDescription =
    taskKinds.size > 1
      ? 'Assignment and quiz totals'
      : taskKinds.has('quiz')
        ? 'Quiz totals'
        : 'Assignment totals';
  return (
    <section className='space-y-2' aria-label='Session report statistics'>
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <Tile
          label='Attendance'
          value={`${a?.present ?? 0} of ${a?.enrolled ?? 0}${a?.attendance_rate != null ? ` · ${Math.round(a.attendance_rate)}%` : ''}`}
        />
        <Tile
          label={tasks ? 'Class average' : 'Lesson average'}
          value={
            tasks ? (
              totalLabel(tasks.average)
            ) : a?.class_average != null ? (
              <ScoreFraction score={a.class_average} maximum={report.max_score} />
            ) : (
              '—'
            )
          }
        />
        <Tile
          label='Highest · lowest'
          value={
            tasks ? (
              <span className='inline-flex items-center gap-2'>
                {totalLabel(tasks.highest)}
                <span aria-hidden='true'>·</span>
                {totalLabel(tasks.lowest)}
              </span>
            ) : a?.highest != null ? (
              <span className='inline-flex items-center gap-2'>
                <ScoreFraction score={a.highest} maximum={report.max_score} />
                <span aria-hidden='true'>·</span>
                <ScoreFraction score={a.lowest} maximum={report.max_score} />
              </span>
            ) : (
              '—'
            )
          }
        />
        <Tile
          label='Score bands'
          value={
            bands.length ? (
              <span className='block space-y-1 text-sm'>
                {bands.map(band => (
                  <span key={band.name} className='block'>
                    {(band.name ?? 'Unspecified').replace(/[–—]/g, '-')} - {band.count}{' '}
                    {band.count === 1 ? 'student' : 'students'}
                  </span>
                ))}
              </span>
            ) : (
              '—'
            )
          }
        />
      </div>
      {tasks && (
        <p className='text-muted-foreground text-xs'>
          {totalDescription} · {tasks.scored} of {tasks.enrolled} students with assessment totals.
          Missing scores are skipped in totals, averages and bands. Red marks are below the class
          average.
        </p>
      )}
    </section>
  );
}

/** Reuse the same totals and learner details when reopening a report. */
export function SessionReportResults({
  report,
  nameOf,
  submittedOnly = false,
}: {
  report: SessionReport;
  nameOf: (studentUuid?: string) => string;
  submittedOnly?: boolean;
}) {
  const scores = useSessionReportScores(report, !submittedOnly);
  if (scores.isLoading) return <WorkbookLoading />;
  return (
    <div className='space-y-4'>
      {scores.isError && (
        <div
          role='status'
          className='bg-muted flex flex-wrap items-center gap-3 rounded-xl p-3 text-sm'
        >
          <p className='flex-1'>
            Some assessment data could not be loaded. Showing available scores.
          </p>
          <Button variant='outline' size='sm' onClick={scores.refetch}>
            Retry
          </Button>
        </div>
      )}
      <ReportFigures report={report} scores={scores.summary} />
      <ReportLearnerTable
        report={report}
        nameOf={nameOf}
        submittedOnly={submittedOnly}
        scores={scores.summary}
      />
    </div>
  );
}

function Tile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className='bg-card rounded-xl border p-3'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='text-lg font-semibold'>{value}</p>
    </div>
  );
}

/**
 * Every learner's row with a column per criterion and the class averages beneath.
 * submittedOnly hides any mark not yet submitted, as the school must never see drafts.
 */
export function ReportLearnerTable({
  report,
  nameOf,
  submittedOnly = false,
  scores,
}: {
  report: SessionReport;
  nameOf: (studentUuid?: string) => string;
  submittedOnly?: boolean;
  scores?: ReportScoreSummary;
}) {
  const criteria = report.criteria ?? [];
  const averages = new Map(
    (report.aggregates?.criterion_averages ?? []).map(c => [c.criteria_uuid, c.average])
  );
  return (
    <div className='bg-card overflow-x-auto rounded-xl border'>
      <table className='w-full min-w-[720px] border-collapse text-sm'>
        <thead>
          <tr className='bg-muted text-left'>
            <th className='p-3'>Student</th>
            <th className='p-3'>Attendance</th>
            <th className='p-3'>Instrument</th>
            {criteria.map(c => (
              <th key={c.criteria_uuid} className='p-3 text-center'>
                {c.name}
              </th>
            ))}
            <th className='p-3 text-center'>Lesson score</th>
            {scores?.hasTasks && <th className='p-3 text-center'>Session score</th>}
            <th className='p-3'>Comment</th>
          </tr>
        </thead>
        <tbody>
          {(report.rows ?? []).map((row, index) => {
            const hidden = submittedOnly && row.score_status !== 'submitted';
            const picks = new Map(
              hidden ? [] : (row.picks ?? []).map(p => [p.criteria_uuid, p.points])
            );
            const total = scores?.rows.get(reportRowKey(row, index));
            const lessonBelowAverage =
              !hidden &&
              row.score_status === 'submitted' &&
              row.score != null &&
              report.aggregates?.class_average != null &&
              row.score < report.aggregates.class_average;
            return (
              <tr
                key={row.class_enrollment_uuid ?? row.student_uuid}
                className='border-t align-top'
              >
                <td className='p-3 font-medium'>{nameOf(row.student_uuid)}</td>
                <td className='p-3'>{attendanceLabel(row.attendance)}</td>
                <td className='p-3'>{instrumentLabel(row.instrument_condition)}</td>
                {criteria.map(c => (
                  <td key={c.criteria_uuid} className='p-3 text-center'>
                    {picks.get(c.criteria_uuid) ?? '—'}
                  </td>
                ))}
                <td
                  className={`p-3 text-center font-semibold whitespace-nowrap ${lessonBelowAverage ? 'text-destructive' : ''}`}
                >
                  {hidden ? '—' : scoreLabel(row, report.max_score)}
                  {lessonBelowAverage && <span className='sr-only'>, below class average</span>}
                </td>
                {scores?.hasTasks && (
                  <td className='min-w-60 p-3'>
                    {total && <StudentSessionScore score={total} summary={scores} />}
                  </td>
                )}
                <td className='p-3'>
                  {row.attendance_comment && (
                    <div>
                      <p className='text-muted-foreground text-xs'>Attendance comment</p>
                      <RichTextRenderer htmlString={row.attendance_comment} />
                    </div>
                  )}
                  {row.lesson_comment && !hidden && (
                    <div className={row.attendance_comment ? 'mt-2' : undefined}>
                      <p className='text-muted-foreground text-xs'>Evaluation comment</p>
                      <RichTextRenderer htmlString={row.lesson_comment} />
                    </div>
                  )}
                  {!row.attendance_comment && (!row.lesson_comment || hidden) && '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
        {criteria.length > 0 && (
          <tfoot>
            <tr className='bg-muted/50 border-t font-semibold'>
              <td className='p-3' colSpan={3}>
                Class average
              </td>
              {criteria.map(c => (
                <td key={c.criteria_uuid} className='p-3 text-center'>
                  {averages.get(c.criteria_uuid) ?? '—'}
                </td>
              ))}
              <td className='p-3 text-center whitespace-nowrap'>
                {report.aggregates?.class_average != null ? (
                  <ScoreFraction
                    score={report.aggregates.class_average}
                    maximum={report.max_score}
                  />
                ) : (
                  '—'
                )}
              </td>
              {scores?.hasTasks && (
                <td className='p-3 text-center whitespace-nowrap'>
                  {scores.average != null ? (
                    scores.maxScore != null ? (
                      <ScoreFraction score={scores.average} maximum={scores.maxScore} />
                    ) : (
                      `${formatReportNumber(scores.average)}%`
                    )
                  ) : (
                    '—'
                  )}
                </td>
              )}
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function StudentSessionScore({
  score,
  summary,
}: {
  score: ReportStudentScore;
  summary: ReportScoreSummary;
}) {
  const belowAverage = isBelowClassAverage(score, summary);
  return (
    <div className='space-y-2'>
      <p className={`font-semibold ${belowAverage ? 'text-destructive' : ''}`}>
        <ScoreFraction score={score.score} maximum={score.maxScore} />
        {belowAverage && <span className='ml-1 text-xs font-normal'>(below class average)</span>}
      </p>
      <p className='text-muted-foreground text-xs'>
        {score.graded} of {score.marks.length} graded
        {score.graded < score.marks.length ? ' · missing scores skipped' : ''}
        {score.maxScore == null && score.marks.length > 0
          ? ' · total obtainable not available'
          : ''}
      </p>
      <ul className='space-y-1 text-xs'>
        {/* {score.marks.map(mark => (
          <li key={mark.id} className='flex justify-between gap-2'>
            <span className='min-w-0'>
              {mark.kind === 'quiz' ? 'Quiz' : 'Assignment'}: {mark.title}
            </span>
            <span className='shrink-0'>{reportTaskMarkLabel(mark)}</span>
          </li>
        ))} */}
      </ul>
    </div>
  );
}

function attendanceLabel(value?: string) {
  if (value === 'ATTENDED') return 'Present';
  if (value === 'ABSENT') return 'Absent';
  return 'Not marked';
}

function instrumentLabel(value?: string) {
  if (value === 'GOOD') return 'Good';
  if (value === 'NEEDS_REPAIR') return 'Needs repair';
  if (value === 'NO_EQUIPMENT') return 'No equipment';
  return '—';
}

function scoreLabel(row: RowDto, reportMax?: number) {
  if (row.attendance === 'ABSENT') return '—';
  if (row.score_status === 'none' || row.score == null) return 'Not scored';
  // A draft carries no maximum of its own; the lesson's rubric maximum is the same for every learner.
  return (
    <span className='inline-flex items-center gap-1'>
      <ScoreFraction score={row.score} maximum={row.max_score ?? reportMax} />
      {row.score_status === 'draft' && <span>(draft)</span>}
    </span>
  );
}

/** Student display names for the report rows, via the shared batched lookups. */
function useStudentNames(rows: RowDto[]) {
  const studentIds = useMemo(
    () => rows.flatMap(row => (row.student_uuid ? [row.student_uuid] : [])),
    [rows]
  );
  const students = useStudentsByIds(studentIds);
  const userIds = useMemo(
    () =>
      studentIds.flatMap(id =>
        students.studentMap[id]?.user_uuid ? [students.studentMap[id].user_uuid] : []
      ),
    [studentIds, students.studentMap]
  );
  const users = useUsersByIds(userIds);
  return useMemo(() => {
    const map: Record<string, string> = {};
    for (const id of studentIds) {
      const student = students.studentMap[id];
      map[id] =
        users.userMap[student?.user_uuid ?? '']?.full_name || student?.full_name || 'Student';
    }
    return map;
  }, [studentIds, students.studentMap, users.userMap]);
}
