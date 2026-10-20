'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { formatDateTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getSessionReportOptions,
  getSessionReportQueryKey,
  submitSessionReportMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { RowDto, ScheduledInstance, SessionReport } from '@/services/client/types.gen';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';
import { hasApiError } from './workbook-data';

type FixTarget = 'grading' | 'register';

/**
 * The session's mandatory report: what still blocks submission, class aggregates, every learner's
 * row, and a preview of exactly what is frozen on submit. Editable in the school's grace window.
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const query = useQuery({
    ...getSessionReportOptions({ path: { instanceUuid } }),
    enabled: Boolean(instanceUuid),
    staleTime: STALE_TIMES.live,
  });
  const submit = useMutation(submitSessionReportMutation());
  const report = query.data?.data;
  const names = useStudentNames(report?.rows ?? []);

  if (!instanceUuid) return <EmptyState title='Select a class session to see its report' />;
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data) || !report) {
    return <WorkbookError title='Unable to load the session report' retry={() => void query.refetch()} />;
  }

  const onSubmit = async () => {
    const response = await submit.mutateAsync({ path: { instanceUuid } });
    if (hasApiError(response)) {
      toast.error(response.message || 'The session report could not be submitted.');
      return;
    }
    setPreviewOpen(false);
    toast.success(report.status === 'submitted' ? 'Report resubmitted.' : 'Session report submitted.');
    await client.invalidateQueries({ queryKey: getSessionReportQueryKey({ path: { instanceUuid } }) });
  };

  const blockers = (report.checklist ?? []).filter(item => item.severity === 'blocker');
  const locked = report.status === 'locked';
  const submitted = report.status === 'submitted';

  return (
    <div className='space-y-5' data-testid='session-report'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold'>Session report</h2>
          <p className='text-muted-foreground text-sm'>
            {report.class_title} · Lesson {report.lesson_number ?? '—'}
            {report.lesson_title ? ` — ${report.lesson_title}` : ''}
            {report.duration_minutes != null ? ` · ${Number(report.duration_minutes)} minutes` : ''}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <StatusPill report={report} />
          <Button disabled={locked || blockers.length > 0} onClick={() => setPreviewOpen(true)}>
            {locked ? 'Report locked' : submitted ? 'Preview & resubmit' : 'Preview & submit'}
          </Button>
        </div>
      </div>

      <Banner report={report} />

      <div className='flex flex-wrap items-start gap-4'>
        <section className='bg-card min-w-0 flex-[1_1_320px] space-y-3 rounded-2xl border p-4'>
          <div className='flex items-center justify-between gap-2'>
            <h3 className='font-semibold'>Before you submit</h3>
            <span className='text-muted-foreground text-xs'>
              {blockers.length === 0 ? 'Ready to submit' : `${blockers.length} to do`}
            </span>
          </div>
          {(report.checklist ?? []).length === 0 && (
            <p className='text-muted-foreground text-sm'>Everything is captured.</p>
          )}
          <ul className='space-y-2'>
            {(report.checklist ?? []).map((item, index) => {
              const target = fixTarget(item.code);
              return (
                <li
                  key={`${item.code}-${item.student_uuid ?? index}`}
                  className='flex items-center gap-3 rounded-lg border p-3 text-sm'
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
          <p className='text-muted-foreground text-xs'>
            Complete draft scores are submitted with the report. Absent learners need no score.
          </p>
        </section>

        <section className='min-w-0 flex-[2_1_520px] space-y-4'>
          <Aggregates report={report} />
          <ReportTable report={report} names={names} />
        </section>
      </div>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent className='w-full sm:max-w-3xl'>
          <SheetHeader className='shrink-0 border-b pr-12'>
            <SheetTitle>Preview session report</SheetTitle>
            <SheetDescription>
              This is exactly what will be frozen and shared with the school. Learners see their own rows.
            </SheetDescription>
          </SheetHeader>
          <div className='min-h-0 flex-1 space-y-4 overflow-y-auto p-4'>
            <div className='space-y-1 rounded-xl border p-4 text-sm'>
              <p className='font-semibold'>
                {report.class_title} · Lesson {report.lesson_number ?? '—'} ·{' '}
                {formatDateTime(report.start_time, { fallback: '' })}
              </p>
              {report.topic_covered && (
                <div>
                  <span className='text-muted-foreground'>What was taught: </span>
                  <RichTextRenderer htmlString={report.topic_covered} as='span' />
                </div>
              )}
              {(report.assignment_titles ?? []).length > 0 && (
                <p>Assignment: {(report.assignment_titles ?? []).join(', ')}</p>
              )}
              <p>
                Attendance {report.aggregates?.present ?? 0} of {report.aggregates?.enrolled ?? 0}
                {report.aggregates?.class_average != null
                  ? ` · Class average ${report.aggregates.class_average} / ${report.max_score ?? '—'}`
                  : ''}
              </p>
            </div>
            <ReportTable report={report} names={names} compact />
            <p className='text-muted-foreground text-sm'>
              After you submit you can still make changes until the school&apos;s grace period ends. Then the report
              locks.
            </p>
          </div>
          <div className='flex flex-wrap justify-end gap-2 border-t p-4'>
            <Button variant='outline' onClick={() => setPreviewOpen(false)}>
              Keep editing
            </Button>
            <Button disabled={submit.isPending || !report.can_submit} onClick={() => void onSubmit()}>
              {submitted ? 'Resubmit report' : 'Submit report'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
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
  return <Badge variant='warning'>Due {formatDateTime(report.due_at, { fallback: 'after the session' })}</Badge>;
}

function Banner({ report }: { report: SessionReport }) {
  if (report.status === 'locked') {
    return (
      <p role='status' className='bg-muted rounded-xl p-3 text-sm'>
        This report locked on {formatDateTime(report.editable_until, { fallback: '' })}. Records for this session can
        no longer be changed. Ask a platform admin if a correction is needed.
      </p>
    );
  }
  if (report.status === 'submitted') {
    return (
      <p role='status' className='bg-success/10 rounded-xl p-3 text-sm'>
        Submitted {formatDateTime(report.submitted_at, { fallback: '' })}. You can still change anything until{' '}
        {formatDateTime(report.editable_until, { fallback: '' })}.
        {report.changed_since_submission ? ' You have changes since then — resubmit so the school sees them.' : ''}
      </p>
    );
  }
  return (
    <p role='status' className='bg-primary/5 rounded-xl p-3 text-sm'>
      Capture the session as it runs. The report is due 24 hours after the session ends; you will be reminded.
    </p>
  );
}

function Aggregates({ report }: { report: SessionReport }) {
  const a = report.aggregates;
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <Tile
          label='Attendance'
          value={`${a?.present ?? 0} of ${a?.enrolled ?? 0}${a?.attendance_rate != null ? ` · ${Math.round(a.attendance_rate)}%` : ''}`}
        />
        <Tile
          label='Class average'
          value={a?.class_average != null ? `${a.class_average} / ${report.max_score ?? '—'}` : 'Not scored yet'}
        />
        <Tile
          label='Highest · lowest'
          value={a?.highest != null ? `${a.highest} · ${a.lowest ?? '—'}` : '—'}
        />
        <Tile
          label='Bands'
          value={
            (a?.band_counts ?? [])
              .filter(b => (b.count ?? 0) > 0)
              .map(b => `${b.count} ${b.name}`)
              .join(' · ') || '—'
          }
        />
      </div>
      {(a?.criterion_averages ?? []).length > 0 && (
        <div className='bg-card space-y-2 rounded-2xl border p-4'>
          <h3 className='font-semibold'>Average per criterion</h3>
          {(a?.criterion_averages ?? []).map(c => {
            const top = report.max_score && report.criteria?.length ? report.max_score / report.criteria.length : 5;
            return (
              <div key={c.criteria_uuid} className='grid grid-cols-[minmax(0,180px)_minmax(0,1fr)_48px] items-center gap-3 text-sm'>
                <span>{c.name}</span>
                <div className='bg-muted h-2 overflow-hidden rounded-full'>
                  <div className='bg-primary h-2' style={{ width: `${((c.average ?? 0) / top) * 100}%` }} />
                </div>
                <span className='text-right font-mono'>{c.average ?? '—'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className='bg-card rounded-xl border p-3'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='text-lg font-semibold'>{value}</p>
    </div>
  );
}

function ReportTable({
  report,
  names,
  compact = false,
}: {
  report: SessionReport;
  names: Record<string, string>;
  compact?: boolean;
}) {
  return (
    <div className='bg-card overflow-x-auto rounded-2xl border'>
      <table className='w-full min-w-[720px] border-collapse text-sm'>
        <thead>
          <tr className='bg-muted text-left'>
            <th className='p-3'>Student</th>
            <th className='p-3'>Attendance</th>
            <th className='p-3'>Instrument</th>
            <th className='p-3'>Score</th>
            <th className='p-3'>Criteria</th>
            {!compact && <th className='p-3'>Comment</th>}
          </tr>
        </thead>
        <tbody>
          {(report.rows ?? []).map(row => (
            <tr key={row.class_enrollment_uuid ?? row.student_uuid} className='border-t'>
              <td className='p-3 font-medium'>{names[row.student_uuid ?? ''] ?? 'Student'}</td>
              <td className='p-3'>{attendanceLabel(row.attendance)}</td>
              <td className='p-3'>{instrumentLabel(row.instrument_condition)}</td>
              <td className='p-3 font-mono'>{scoreLabel(row)}</td>
              <td className='text-muted-foreground p-3 text-xs'>
                {(row.picks ?? []).map(p => p.points ?? '—').join(' · ') || '—'}
              </td>
              {!compact && (
                <td className='p-3'>
                  {row.lesson_comment ? <RichTextRenderer htmlString={row.lesson_comment} /> : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
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

function scoreLabel(row: RowDto) {
  if (row.attendance === 'ABSENT') return '—';
  if (row.score_status === 'none' || row.score == null) return 'Not scored';
  const value = `${row.score} / ${row.max_score ?? '—'}`;
  return row.score_status === 'draft' ? `${value} (draft)` : value;
}

/** Student display names for the report rows, via the shared batched lookups. */
function useStudentNames(rows: RowDto[]) {
  const studentIds = useMemo(() => rows.flatMap(row => (row.student_uuid ? [row.student_uuid] : [])), [rows]);
  const students = useStudentsByIds(studentIds);
  const userIds = useMemo(
    () => studentIds.flatMap(id => (students.studentMap[id]?.user_uuid ? [students.studentMap[id].user_uuid] : [])),
    [studentIds, students.studentMap]
  );
  const users = useUsersByIds(userIds);
  return useMemo(() => {
    const map: Record<string, string> = {};
    for (const id of studentIds) {
      const student = students.studentMap[id];
      map[id] = users.userMap[student?.user_uuid ?? '']?.full_name || student?.full_name || 'Student';
    }
    return map;
  }, [studentIds, students.studentMap, users.userMap]);
}
