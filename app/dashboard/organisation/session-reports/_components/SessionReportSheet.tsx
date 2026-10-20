'use client';

import { useQuery } from '@tanstack/react-query';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { ReportFigures, ReportLearnerTable } from '@/components/lesson/SessionReportPanel';
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

const STATUS_LABELS: Record<string, string> = { draft: 'Draft', submitted: 'Submitted', locked: 'Locked' };

/** The school's read-only view of one submitted session report, laid out as the trainer's tab. */
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
            {report?.lesson_number ? ` · Lesson ${report.lesson_number}` : ''}
            {report?.lesson_title ? ` — ${report.lesson_title}` : ''}
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
                <Badge variant='outline'>{STATUS_LABELS[report?.status ?? ''] ?? 'Draft'}</Badge>
                {report?.submitted_at && (
                  <span className='text-muted-foreground text-xs'>Submitted {formatDateTime(report.submitted_at)}</span>
                )}
              </div>
              <section className='bg-muted/40 space-y-2 rounded-xl border p-4 text-sm'>
                <div>
                  <span className='font-semibold'>What was taught</span>
                  {report?.topic_covered ? (
                    <RichTextRenderer htmlString={report.topic_covered} />
                  ) : (
                    <p className='text-muted-foreground'>Not recorded</p>
                  )}
                </div>
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
              {report && (
                <>
                  <ReportFigures report={report} />
                  <ReportLearnerTable report={report} nameOf={studentName} submittedOnly />
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

