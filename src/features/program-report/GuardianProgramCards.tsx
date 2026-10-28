'use client';

import { useState } from 'react';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { StatusBadge } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { resultLabel } from '@/lib/grades';
import type { ProgramReport } from '@/services/client/types.gen';
import { programmeReportPrintHref } from './print-href';
import { ProgramReportCard } from './ProgramReportCard';
import { resultTone } from './report-model';
import { percent, shortDate } from './use-program-report';

const HAS_RESULT = new Set(['PASSED', 'FAILED']);

/** The parent's program card: mark, mandatory courses and the latest remark, with the full report a click away. */
export function GuardianProgramCard({
  report,
  studentUuid,
  learnerName,
}: {
  report: ProgramReport;
  studentUuid: string;
  learnerName?: string;
}) {
  const [open, setOpen] = useState(false);
  const mandatory = (report.courses ?? []).filter(course => course.is_required);
  const withResult = mandatory.filter(course =>
    HAS_RESULT.has((course.result_status ?? '').toUpperCase())
  ).length;
  const share = mandatory.length ? (withResult / mandatory.length) * 100 : 0;
  const provisional = report.final_grade_provisional !== false;
  const latest = [...(report.remarks ?? [])].sort(
    (a, b) => new Date(b.created_date ?? 0).getTime() - new Date(a.created_date ?? 0).getTime()
  )[0];
  const name = learnerName ?? 'Learner';

  return (
    <article
      data-testid='guardian-program-card'
      aria-label={report.program_title ?? 'Program'}
      className='border-border/70 bg-card flex flex-col overflow-hidden rounded-2xl border shadow-sm'
    >
      <div className='from-primary to-primary/40 h-2 bg-gradient-to-r' />
      <div className='flex flex-1 flex-col gap-4 p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex flex-col'>
            <span className='text-muted-foreground text-xs'>Program</span>
            <h3 className='text-sm font-semibold'>{report.program_title ?? 'Program'}</h3>
          </div>
          <StatusBadge
            tone={resultTone(report.result_status)}
            label={resultLabel(report.result_status)}
          />
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <div className='border-border rounded-xl border p-2'>
            <p className='text-muted-foreground text-xs'>
              Program mark · {provisional ? 'Provisional' : 'Final'}
            </p>
            <p className='text-lg font-bold tabular-nums'>{percent(report.final_grade)}</p>
          </div>
          <div className='border-border rounded-xl border p-2'>
            <p className='text-muted-foreground text-xs'>Mandatory passed</p>
            <p className='text-lg font-bold tabular-nums'>
              {report.mandatory_passed ?? 0} of {report.mandatory_total ?? mandatory.length}
            </p>
          </div>
        </div>
        <div className='flex flex-col gap-1.5'>
          <div
            role='img'
            aria-label={`${withResult} of ${mandatory.length} mandatory courses have a result`}
            className='bg-muted h-2 overflow-hidden rounded-full'
          >
            <div className='bg-primary h-2' style={{ width: `${share}%` }} />
          </div>
          <span className='text-muted-foreground text-xs'>
            {withResult} of {mandatory.length} mandatory courses have a result
          </span>
        </div>
        {latest && (
          <div className='bg-muted/50 flex flex-col gap-1 rounded-xl p-3 text-sm'>
            <div className='line-clamp-3'>
              <RichTextRenderer
                htmlString={latest.strengths ?? latest.improvements ?? latest.recommendations ?? ''}
              />
            </div>
            <span className='text-muted-foreground text-xs'>
              {latest.author_name ?? 'Instructor'} · {shortDate(latest.created_date)}
              {latest.next_review_date
                ? ` · next review ${shortDate(latest.next_review_date)}`
                : ''}
            </span>
          </div>
        )}
        <Button size='sm' className='mt-auto' onClick={() => setOpen(true)}>
          View full report
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className='w-full overflow-y-auto sm:max-w-5xl'>
          <SheetHeader className='border-b pr-12'>
            <SheetTitle>{name} · Program report</SheetTitle>
            <SheetDescription>
              The same report {name.split(/\s+/)[0]} sees. Each course links to its lesson-by-lesson
              marks.
            </SheetDescription>
          </SheetHeader>
          <div className='p-4'>
            <ProgramReportCard
              report={report}
              audience='guardian'
              learnerName={learnerName}
              printHref={programmeReportPrintHref(report.program_uuid ?? '', studentUuid)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </article>
  );
}
