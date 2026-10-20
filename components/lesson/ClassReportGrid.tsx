'use client';

import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { formatDate } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import { getClassReportOptions } from '@/services/client/@tanstack/react-query.gen';
import { getClassReportCsv } from '@/services/client/sdk.gen';
import type { CellDto } from '@/services/client/types.gen';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';
import { hasApiError } from './workbook-data';

/** Every learner across every session of a class, built from the session reports. */
export function ClassReportGrid({ classId }: { classId: string }) {
  const query = useQuery({
    ...getClassReportOptions({ path: { classDefinitionUuid: classId } }),
    enabled: Boolean(classId),
    staleTime: STALE_TIMES.live,
  });
  const report = query.data?.data;
  const names = useLearnerNames((report?.students ?? []).flatMap(s => (s.student_uuid ? [s.student_uuid] : [])));

  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data) || !report) {
    return <WorkbookError title='Unable to load the class report' retry={() => void query.refetch()} />;
  }
  const sessions = report.sessions ?? [];

  const downloadCsv = async () => {
    const { data, error } = await getClassReportCsv({ path: { classDefinitionUuid: classId }, parseAs: 'text' });
    if (error || typeof data !== 'string') {
      toast.error('The CSV could not be downloaded.');
      return;
    }
    saveFile(new Blob([data], { type: 'text/csv' }), `${report.class_title ?? 'class'}-report.csv`);
  };

  const downloadPdf = async () => {
    const [{ default: JsPdf }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new JsPdf({ orientation: 'landscape', unit: 'pt' });
    doc.setFontSize(14);
    doc.text(`${report.class_title ?? 'Class'} — class report`, 40, 40);
    autoTable(doc, {
      startY: 56,
      head: [['Student', ...sessions.map(s => `L${s.lesson_number ?? '?'}`), 'Average', 'Band']],
      body: (report.students ?? []).map(row => [
        names[row.student_uuid ?? ''] ?? 'Student',
        ...sessions.map(s => cellText(row.cells?.find(c => c.instance_uuid === s.instance_uuid))),
        row.average != null ? `${row.average} (${row.average_percentage ?? '—'}%)` : '—',
        row.band ?? '—',
      ]),
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
        You see live marks, drafts included. Averages count submitted scores only.
      </p>
      {!sessions.length ? (
        <p className='text-muted-foreground rounded-xl border p-6 text-sm'>No sessions have been held yet.</p>
      ) : (
        <div className='bg-card overflow-x-auto rounded-2xl border'>
          <table className='w-full min-w-[720px] border-collapse text-sm'>
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
              {(report.students ?? []).map(row => (
                <tr key={row.student_uuid} className='border-t'>
                  <td className='p-3 font-medium'>{names[row.student_uuid ?? ''] ?? 'Student'}</td>
                  {sessions.map(s => (
                    <td key={s.instance_uuid} className='p-2 text-center font-mono'>
                      {cellText(row.cells?.find(c => c.instance_uuid === s.instance_uuid))}
                    </td>
                  ))}
                  <td className='p-3 text-center font-semibold'>
                    {row.average != null ? `${row.average} · ${row.average_percentage ?? '—'}%` : '—'}
                  </td>
                  <td className='p-3 text-center'>{row.band ?? '—'}</td>
                </tr>
              ))}
              <tr className='bg-muted/50 border-t font-semibold'>
                <td className='p-3'>Class average</td>
                {sessions.map(s => (
                  <td key={s.instance_uuid} className='p-2 text-center'>
                    {s.class_average != null ? s.class_average : '—'}
                  </td>
                ))}
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function cellText(cell?: CellDto) {
  if (!cell) return '·';
  if (cell.attendance === 'ABSENT') return 'Absent';
  if (cell.score == null || cell.score_status === 'none') return '—';
  return cell.score_status === 'draft' ? `${cell.score}*` : String(cell.score);
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

