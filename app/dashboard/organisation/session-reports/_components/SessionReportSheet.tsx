'use client';

import { useQuery } from '@tanstack/react-query';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import { getSessionReportOptions } from '@/services/client/@tanstack/react-query.gen';
import type { RowDto } from '@/services/client/types.gen';

const attendanceLabel = (value?: string) =>
  value === 'ATTENDED' ? 'Present' : value === 'ABSENT' ? 'Absent' : 'Not marked';

const num = (value?: number | null) =>
  value == null ? '—' : Number.isInteger(value) ? String(value) : value.toFixed(1);

/** The school's read-only view of one submitted session report. */
export function SessionReportSheet({
  instanceUuid,
  studentName,
  onClose,
}: {
  instanceUuid: string;
  studentName: (studentUuid?: string) => string;
  onClose: () => void;
}) {
  const query = useQuery({
    ...getSessionReportOptions({ path: { instanceUuid } }),
    enabled: Boolean(instanceUuid),
    staleTime: STALE_TIMES.live,
  });
  const report = query.data?.data;
  const rows: RowDto[] = report?.rows ?? [];

  return (
    <Sheet open onOpenChange={open => (open ? undefined : onClose())}>
      <SheetContent className='w-full sm:max-w-3xl'>
        <SheetHeader className='shrink-0 border-b pr-12'>
          <SheetTitle>
            {report?.class_title ?? 'Session report'}
            {report?.lesson_number ? ` · Class ${report.lesson_number}` : ''}
          </SheetTitle>
          <SheetDescription>
            {report?.start_time ? formatDateTime(report.start_time) : ''}
            {report?.duration_minutes != null ? ` · ${String(report.duration_minutes)} minutes` : ''}
          </SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 space-y-5 overflow-y-auto p-4' data-testid='session-report-readonly'>
          {query.isLoading ? (
            <Skeleton className='h-40 w-full' />
          ) : !rows.length ? (
            <p className='text-muted-foreground text-sm'>
              This report has not been submitted yet. You will see it here once the trainer submits it.
            </p>
          ) : (
            <>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline'>{report?.status}</Badge>
                {report?.submitted_at && (
                  <span className='text-muted-foreground text-xs'>Submitted {formatDateTime(report.submitted_at)}</span>
                )}
              </div>
              <section className='bg-muted/40 space-y-2 rounded-xl border p-4 text-sm'>
                <div>
                  <span className='font-semibold'>What was taught: </span>
                  {report?.lesson_title}
                </div>
                {report?.topic_covered && <RichTextRenderer htmlString={report.topic_covered} />}
                {report?.instructor_remarks && (
                  <div className='text-muted-foreground'>
                    <RichTextRenderer htmlString={report.instructor_remarks} />
                  </div>
                )}
                {report?.assignment_titles?.length ? (
                  <div>
                    <span className='font-semibold'>Assignment: </span>
                    {report.assignment_titles.join(', ')}
                  </div>
                ) : null}
              </section>
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                <Stat label='Attendance' value={`${report?.aggregates?.present ?? 0} of ${report?.aggregates?.enrolled ?? 0}`} />
                <Stat
                  label='Class average'
                  value={report?.aggregates?.class_average != null ? `${num(report.aggregates.class_average)} / ${num(report.max_score)}` : '—'}
                />
                <Stat
                  label='Highest · lowest'
                  value={`${num(report?.aggregates?.highest)} · ${num(report?.aggregates?.lowest)}`}
                />
                <Stat
                  label='Bands'
                  value={
                    (report?.aggregates?.band_counts ?? [])
                      .filter(band => (band.count ?? 0) > 0)
                      .map(band => `${band.count} ${band.name}`)
                      .join(' · ') || '—'
                  }
                />
              </div>
              <div className='overflow-x-auto rounded-xl border'>
                <table className='w-full min-w-[640px] text-sm'>
                  <thead className='bg-muted/60 text-left'>
                    <tr>
                      <th className='px-3 py-2'>Student</th>
                      <th className='px-3 py-2'>Attendance</th>
                      <th className='px-3 py-2'>Instrument</th>
                      <th className='px-3 py-2'>Score</th>
                      <th className='px-3 py-2'>Criteria</th>
                      <th className='px-3 py-2'>Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr key={row.class_enrollment_uuid ?? row.student_uuid} className='border-t'>
                        <td className='px-3 py-2 font-medium'>{studentName(row.student_uuid)}</td>
                        <td className='px-3 py-2'>{attendanceLabel(row.attendance)}</td>
                        <td className='px-3 py-2'>{row.instrument_condition?.replace('_', ' ').toLowerCase() ?? '—'}</td>
                        <td className='px-3 py-2 font-mono'>
                          {row.score_status === 'submitted' && row.score != null ? `${num(row.score)} / ${num(row.max_score)}` : '—'}
                        </td>
                        <td className='text-muted-foreground px-3 py-2 text-xs'>
                          {row.score_status === 'submitted'
                            ? (row.picks ?? []).map(pick => `${pick.criteria_name} ${num(pick.points)}`).join(' · ')
                            : '—'}
                        </td>
                        <td className='px-3 py-2'>
                          {row.lesson_comment ? <RichTextRenderer htmlString={row.lesson_comment} /> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border p-3'>
      <div className='text-muted-foreground text-xs'>{label}</div>
      <div className='font-semibold'>{value}</div>
    </div>
  );
}
