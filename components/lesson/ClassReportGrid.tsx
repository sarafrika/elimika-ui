'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { formatDate } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import { getClassReportOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useMemo } from 'react';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';
import { ScoreFraction } from './ScoreFraction';
import { formatReportNumber } from './session-report-scores';
import { useClassReportScores } from './useClassReportScores';
import { hasApiError } from './workbook-data';

/** Every learner across every session of a class, built from the session reports. */
export function ClassReportGrid({ classId }: { classId: string }) {
  const query = useQuery({
    ...getClassReportOptions({ path: { classDefinitionUuid: classId } }),
    enabled: Boolean(classId),
    staleTime: STALE_TIMES.live,
  });
  const report = hasApiError(query.data) ? undefined : query.data?.data;
  const scores = useClassReportScores(classId, report);
  const studentIds = useMemo(
    () => (report?.students ?? []).flatMap(s => (s.student_uuid ? [s.student_uuid] : [])),
    [report?.students]
  );
  const names = useLearnerNames(studentIds);

  if (query.isLoading || scores.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data) || !report) {
    return (
      <WorkbookError title='Unable to load the class report' retry={() => void query.refetch()} />
    );
  }
  const sessions = report.sessions ?? [];

  const totalText = (value?: number, maximum?: number) =>
    value == null
      ? '—'
      : maximum != null
        ? `${formatReportNumber(value)} / ${formatReportNumber(maximum)}`
        : `${formatReportNumber(value)}%`;
  const exportHead = [
    'Student',
    ...sessions.map(s => `L${s.lesson_number ?? '?'} assessment total`),
    'Average',
    'Band',
  ];
  const exportRows = (report.students ?? []).map(row => {
    const studentId = row.student_uuid ?? '';
    const average = scores.summary.students.get(studentId);
    return [
      names[studentId] ?? 'Student',
      ...sessions.map(session => {
        const total = scores.summary.sessions.get(session.instance_uuid ?? '')?.rows.get(studentId);
        const attendance = row.cells?.find(
          cell => cell.instance_uuid === session.instance_uuid
        )?.attendance;
        return total?.score != null
          ? `${formatReportNumber(total.score)} / ${total.maxScore != null ? formatReportNumber(total.maxScore) : '—'}`
          : attendance === 'ABSENT'
            ? 'Absent'
            : '—';
      }),
      totalText(average?.average, average?.maxScore),
      average?.band ?? '—',
    ];
  });
  exportRows.push([
    'Class average',
    ...sessions.map(session => {
      const total = scores.summary.sessions.get(session.instance_uuid ?? '');
      return totalText(total?.average, total?.maxScore);
    }),
    '',
    '',
  ]);

  const downloadCsv = () => {
    const csv = [exportHead, ...exportRows]
      .map(row =>
        row
          .map(value => {
            const safe = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
            return `"${safe.replaceAll('"', '""')}"`;
          })
          .join(',')
      )
      .join('\r\n');
    saveFile(
      new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }),
      `${report.class_title ?? 'class'}-report.csv`
    );
  };

  const downloadPdf = async () => {
    const [{ default: JsPdf }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new JsPdf({ orientation: 'landscape', unit: 'pt' });
    doc.setFontSize(14);
    doc.text(`${report.class_title ?? 'Class'} — class report`, 40, 40);
    autoTable(doc, {
      startY: 56,
      head: [exportHead],
      body: exportRows,
      styles: { fontSize: 8 },
    });
    doc.save(`${report.class_title ?? 'class'}-report.pdf`);
  };

  return (
    <div className='space-y-4' data-testid='class-report'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold'>Class report</h1>
          <p className='text-muted-foreground text-sm'>
            {report.class_title} · every learner across every session, from the session reports.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => void downloadCsv()}>
            <Download className='h-4 w-4' /> CSV
          </Button>
          <Button variant='outline' onClick={() => void downloadPdf()}>
            <Download className='h-4 w-4' /> PDF
          </Button>
        </div>
      </div>
      <p className='text-muted-foreground text-sm'>
        Each lesson shows the total graded assignment and quiz score. Missing scores are skipped.
        Averages use scored lessons; percentages are used when their possible totals differ.
      </p>
      {scores.isError && (
        <div
          role='status'
          className='bg-muted flex flex-wrap items-center gap-3 rounded-xl p-3 text-sm'
        >
          <p className='flex-1'>
            Some assessment data could not be loaded. Showing available scores.
          </p>
          <Button size='sm' variant='outline' onClick={scores.refetch}>
            Retry
          </Button>
        </div>
      )}
      {report.live === false && (
        <p className='text-muted-foreground text-sm'>
          Assessment totals are available in the live instructor report.
        </p>
      )}
      {!sessions.length ? (
        <p className='text-muted-foreground rounded-xl border p-6 text-sm'>
          No sessions have been held yet.
        </p>
      ) : (
        <div className='bg-card overflow-x-auto rounded-2xl border'>
          <table
            className='w-full min-w-[720px] border-collapse text-sm'
            aria-label='Assessment totals by lesson'
          >
            <thead>
              <tr className='bg-muted'>
                <th className='p-3 text-left'>Student</th>
                {sessions.map(s => (
                  <th key={s.instance_uuid} className='p-2 text-center'>
                    L{s.lesson_number ?? '?'}
                    <div className='text-muted-foreground text-[11px] font-normal'>
                      {formatDate(s.start_time, { fallback: '' })}
                    </div>
                    {s.report_status !== 'submitted' && s.report_status !== 'locked' && (
                      <Badge variant={s.overdue ? 'destructive' : 'outline'} className='mt-1'>
                        {s.overdue ? 'Overdue' : 'Draft'}
                      </Badge>
                    )}
                  </th>
                ))}
                <th className='p-3 text-center'>Average</th>
                <th className='p-3 text-center'>Band</th>
              </tr>
            </thead>
            <tbody>
              {(report.students ?? []).map(row => {
                const average = scores.summary.students.get(row.student_uuid ?? '');
                return (
                  <tr key={row.student_uuid} className='border-t'>
                    <td className='p-3 font-medium'>
                      {names[row.student_uuid ?? ''] ?? 'Student'}
                    </td>
                    {sessions.map(s => {
                      const total = scores.summary.sessions
                        .get(s.instance_uuid ?? '')
                        ?.rows.get(row.student_uuid ?? '');
                      const absent =
                        row.cells?.find(c => c.instance_uuid === s.instance_uuid)?.attendance ===
                        'ABSENT';
                      return (
                        <td key={s.instance_uuid} className='p-2 text-center'>
                          {total?.score != null ? (
                            <ScoreFraction score={total.score} maximum={total.maxScore} />
                          ) : absent ? (
                            'Absent'
                          ) : (
                            '—'
                          )}
                          {total?.score != null && absent && (
                            <p className='text-muted-foreground mt-1 text-xs'>Absent</p>
                          )}
                        </td>
                      );
                    })}
                    <td className='p-3 text-center font-semibold'>
                      {average?.maxScore != null ? (
                        <>
                          <ScoreFraction score={average.average} maximum={average.maxScore} />
                          <p className='text-muted-foreground mt-1 text-xs font-normal'>
                            {average.percentage != null
                              ? `${formatReportNumber(average.percentage)}%`
                              : ''}
                          </p>
                        </>
                      ) : (
                        totalText(average?.average)
                      )}
                    </td>
                    <td className='p-3 text-center'>{average?.band ?? '—'}</td>
                  </tr>
                );
              })}
              <tr className='bg-muted/50 border-t font-semibold'>
                <td className='p-3'>Class average</td>
                {sessions.map(s => {
                  const total = scores.summary.sessions.get(s.instance_uuid ?? '');
                  return (
                    <td key={s.instance_uuid} className='p-2 text-center'>
                      {total?.average != null && total.maxScore != null ? (
                        <ScoreFraction score={total.average} maximum={total.maxScore} />
                      ) : (
                        totalText(total?.average)
                      )}
                    </td>
                  );
                })}
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** Display names for the report's learners via the shared batched lookups. */
function useLearnerNames(studentIds: string[]) {
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
