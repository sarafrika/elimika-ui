'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { useClassesByIds, useInstructorsByIds, useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { extractPage } from '@/lib/api-helpers';
import { formatDateTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getOrganisationSessionReportsOptions,
  getSessionReportOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { SessionReportSummary } from '@/services/client/types.gen';
import { SessionReportSheet } from './_components/SessionReportSheet';

type Filter = 'overdue' | 'submitted' | 'locked' | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'locked', label: 'Locked' },
  { value: 'all', label: 'All' },
];

const isOverdue = (report: SessionReportSummary) => report.status === 'draft' && Boolean(report.overdue);
const STATUS_LABELS: Record<string, string> = { draft: 'Draft', submitted: 'Submitted', locked: 'Locked' };
const statusLabel = (status?: string) => STATUS_LABELS[status ?? ''] ?? 'Draft';

export default function OrganisationSessionReportsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [filter, setFilter] = useState<Filter>('overdue');
  const [openInstance, setOpenInstance] = useState<string | null>(null);

  const query = useQuery({
    ...getOrganisationSessionReportsOptions({
      path: { organisationUuid },
      query: { pageable: { page: 0, size: 200 } },
    }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.live,
  });
  const reports = extractPage<SessionReportSummary>(query.data).items;

  const instructors = useInstructorsByIds(useMemo(() => reports.flatMap(r => (r.instructor_uuid ? [r.instructor_uuid] : [])), [reports]));
  const classes = useClassesByIds(useMemo(() => reports.flatMap(r => (r.class_definition_uuid ? [r.class_definition_uuid] : [])), [reports]));
  const trainerName = (uuid?: string) => (uuid ? instructors.instructorMap[uuid]?.full_name : undefined) ?? 'Trainer';
  const classTitle = (uuid?: string) => (uuid ? classes.classMap[uuid]?.title : undefined) ?? 'Class';

  const overdue = reports.filter(isOverdue);
  const visible = reports.filter(r => (filter === 'all' ? true : filter === 'overdue' ? isOverdue(r) : r.status === filter));

  // Per trainer: on time, late (submitted after the due time) and overdue.
  const compliance = useMemo(() => {
    const byTrainer = new Map<string, { sessions: number; onTime: number; late: number; overdue: number }>();
    for (const report of reports) {
      const key = report.instructor_uuid ?? 'unknown';
      const row = byTrainer.get(key) ?? { sessions: 0, onTime: 0, late: 0, overdue: 0 };
      row.sessions += 1;
      if (isOverdue(report)) row.overdue += 1;
      else if (report.submitted_at && report.late) row.late += 1;
      else if (report.submitted_at) row.onTime += 1;
      byTrainer.set(key, row);
    }
    return [...byTrainer.entries()];
  }, [reports]);

  return (
    <div className={`${surfaceTheme.pageWide} space-y-6 py-4`}>
      <PageHeader
        eyebrow='Assessment'
        title='Session reports'
        description='Each class session needs a report within 24 hours. You see reports once trainers submit them.'
      />

      {overdue.length > 0 && (
        <div role='alert' className='border-destructive/40 bg-destructive/10 rounded-xl border px-4 py-3 text-sm'>
          {overdue.length} session {overdue.length === 1 ? 'report is' : 'reports are'} overdue. Trainers have been reminded.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Compliance by trainer</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          {query.isLoading ? (
            <Skeleton className='h-24 w-full' />
          ) : (
            <table className='w-full min-w-[640px] text-sm' aria-label='Compliance by trainer'>
              <thead className='bg-muted/60 text-left'>
                <tr>
                  <th className='px-3 py-2'>Trainer</th>
                  <th className='px-3 py-2'>Sessions</th>
                  <th className='px-3 py-2'>On time</th>
                  <th className='px-3 py-2'>Late</th>
                  <th className='px-3 py-2'>Overdue</th>
                  <th className='px-3 py-2'>On-time rate</th>
                </tr>
              </thead>
              <tbody>
                {compliance.map(([uuid, row]) => {
                  const rate = row.sessions ? Math.round((row.onTime / row.sessions) * 100) : 0;
                  return (
                    <tr key={uuid} className='border-t'>
                      <td className='px-3 py-2 font-medium'>{trainerName(uuid)}</td>
                      <td className='px-3 py-2'>{row.sessions}</td>
                      <td className='px-3 py-2'>{row.onTime}</td>
                      <td className='px-3 py-2'>{row.late}</td>
                      <td className='px-3 py-2'>{row.overdue}</td>
                      <td className='px-3 py-2'>
                        <div className='flex items-center gap-2'>
                          <div className='bg-muted h-2 w-28 overflow-hidden rounded-full'>
                            <div className='bg-primary h-2' style={{ width: `${rate}%` }} />
                          </div>
                          {rate}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className='space-y-3 pt-6'>
          <fieldset className='flex flex-wrap gap-2' aria-label='Report status'>
            {FILTERS.map(option => (
              <Button
                key={option.value}
                size='sm'
                variant={filter === option.value ? 'default' : 'outline'}
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </fieldset>
          {!visible.length ? (
            <p className='text-muted-foreground py-6 text-sm'>No session reports here.</p>
          ) : (
            <ul className='divide-y'>
              {visible.map(report => (
                <li key={report.report_uuid} className='flex flex-wrap items-center gap-3 py-3' data-testid='session-report-row'>
                  <div className='min-w-0 flex-1'>
                    <p className='font-medium'>
                      {classTitle(report.class_definition_uuid)} · {trainerName(report.instructor_uuid)}
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      {isOverdue(report)
                        ? `Was due ${formatDateTime(report.due_at)}`
                        : report.status === 'locked'
                          ? `Locked · submitted ${formatDateTime(report.submitted_at)}`
                          : report.submitted_at
                            ? `Submitted ${formatDateTime(report.submitted_at)}`
                            : `Due ${formatDateTime(report.due_at)}`}
                    </p>
                  </div>
                  <Badge variant={isOverdue(report) ? 'destructive' : report.status === 'locked' ? 'secondary' : 'outline'}>
                    {isOverdue(report) ? 'Overdue' : statusLabel(report.status)}
                  </Badge>
                  {report.status !== 'draft' && report.instance_uuid && (
                    <Button size='sm' variant='outline' onClick={() => setOpenInstance(report.instance_uuid ?? null)}>
                      View report
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {openInstance && <ReportSheetWithNames instanceUuid={openInstance} onClose={() => setOpenInstance(null)} />}
    </div>
  );
}

function ReportSheetWithNames({ instanceUuid, onClose }: { instanceUuid: string; onClose: () => void }) {
  // The report carries learner ids only; names come from the learner records (same cached query).
  const report = useQuery({
    ...getSessionReportOptions({ path: { instanceUuid } }),
    enabled: Boolean(instanceUuid),
    staleTime: STALE_TIMES.live,
  });
  const studentIds = useMemo(
    () => (report.data?.data?.rows ?? []).flatMap(row => (row.student_uuid ? [row.student_uuid] : [])),
    [report.data]
  );
  const students = useStudentsByIds(studentIds);
  const userIds = useMemo(
    () => studentIds.flatMap(id => (students.studentMap[id]?.user_uuid ? [students.studentMap[id].user_uuid] : [])),
    [studentIds, students.studentMap]
  );
  const users = useUsersByIds(userIds);
  return (
    <SessionReportSheet
      instanceUuid={instanceUuid}
      onClose={onClose}
      studentName={uuid => {
        const student = uuid ? students.studentMap[uuid] : undefined;
        return (student?.user_uuid ? users.userMap[student.user_uuid]?.full_name : undefined) ?? student?.full_name ?? 'Student';
      }}
    />
  );
}
