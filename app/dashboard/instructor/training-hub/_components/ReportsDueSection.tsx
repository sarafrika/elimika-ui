'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClassesByIds } from '@/hooks/use-batched-lookups';
import { formatDateTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import { getMySessionReportsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { SessionReportSummary } from '@/services/client/types.gen';

type Filter = 'all' | 'overdue' | 'due' | 'submitted';

const FILTERS: Array<[Filter, string]> = [
  ['all', 'All'],
  ['overdue', 'Overdue'],
  ['due', 'Due'],
  ['submitted', 'Submitted'],
];

/** Session reports still owed or editable, so a trainer finishes each one within 24 hours. */
export function ReportsDueSection() {
  const [filter, setFilter] = useState<Filter>('all');
  const query = useQuery({
    ...getMySessionReportsOptions({
      query: { status: ['draft', 'submitted'], pageable: { page: 0, size: 50 } },
    }),
    staleTime: STALE_TIMES.live,
  });
  const reports = query.data?.data?.content ?? [];
  const classIds = useMemo(
    () => [...new Set(reports.flatMap(r => (r.class_definition_uuid ? [r.class_definition_uuid] : [])))],
    [reports]
  );
  const { classMap } = useClassesByIds(classIds);

  const overdue = reports.filter(r => r.status === 'draft' && r.overdue);
  const due = reports.filter(r => r.status === 'draft' && !r.overdue);
  const submitted = reports.filter(r => r.status === 'submitted');
  const shown = filter === 'overdue' ? overdue : filter === 'due' ? due : filter === 'submitted' ? submitted : reports;

  if (query.isLoading) return <Skeleton className='h-40 w-full rounded-xl' />;
  if (!reports.length) return null;

  return (
    <section className='bg-card space-y-4 rounded-xl border p-4' data-testid='reports-due'>
      <div>
        <h2 className='text-lg font-semibold'>Session reports due</h2>
        <p className='text-muted-foreground text-sm'>
          Every session needs a submitted report within 24 hours of ending.
        </p>
      </div>
      <div className='grid grid-cols-3 gap-3'>
        <Count label='Overdue' value={overdue.length} tone='text-destructive' />
        <Count label='Due' value={due.length} tone='text-warning' />
        <Count label='Still editable' value={submitted.length} tone='text-success' />
      </div>
      <div className='flex flex-wrap gap-2' role='group' aria-label='Filter reports'>
        {FILTERS.map(([key, label]) => (
          <Button
            key={key}
            size='sm'
            variant={filter === key ? 'default' : 'outline'}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <ul className='divide-y rounded-lg border'>
        {shown.map(report => (
          <li key={report.report_uuid ?? report.instance_uuid} className='flex flex-wrap items-center gap-3 p-3'>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium'>
                {classMap[report.class_definition_uuid ?? '']?.title ?? 'Class session'}
              </p>
              <p className='text-muted-foreground text-xs'>
                {formatDateTime(report.session_start, { fallback: '' })}
              </p>
            </div>
            <Pill report={report} />
            <Button asChild size='sm' variant={report.status === 'submitted' ? 'outline' : 'default'}>
              <Link
                href={`/dashboard/instructor/classes/training/${report.class_definition_uuid}?schedule=${report.instance_uuid}&tab=report`}
              >
                {report.status === 'submitted' ? 'Review' : report.overdue ? 'Submit now' : 'Open report'}
              </Link>
            </Button>
          </li>
        ))}
        {!shown.length && <li className='text-muted-foreground p-3 text-sm'>Nothing here.</li>}
      </ul>
    </section>
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className='rounded-lg border p-3'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className={`text-2xl font-bold ${value > 0 ? tone : ''}`}>{value}</p>
    </div>
  );
}

function Pill({ report }: { report: SessionReportSummary }) {
  if (report.status === 'submitted') {
    return (
      <Badge variant='success'>
        Submitted · editable until {formatDateTime(report.editable_until, { fallback: '' })}
      </Badge>
    );
  }
  const hours = report.due_at ? Math.round((new Date(report.due_at).getTime() - Date.now()) / 3_600_000) : null;
  if (report.overdue) {
    return <Badge variant='destructive'>Overdue{hours != null ? ` by ${Math.max(1, -hours)}h` : ''}</Badge>;
  }
  return <Badge variant='warning'>{hours != null ? `Due in ${Math.max(1, hours)}h` : 'Due'}</Badge>;
}
