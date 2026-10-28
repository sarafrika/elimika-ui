'use client';

import { useQueries } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { resultLabel } from '@/lib/grades';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { getProgramReportOptions } from '@/services/client/@tanstack/react-query.gen';
import type { ProgramReport } from '@/services/client/types.gen';
import { percent, useStudentProgrammes } from './use-program-report';

const RESULT_PILL: Record<string, string> = {
  PASSED: 'bg-primary/10 text-primary',
  FAILED: 'bg-destructive/10 text-destructive',
};

const HAS_RESULT = new Set(['PASSED', 'FAILED']);
const MAX_PROGRAMMES = 6;

/**
 * The learner's programmes with their live reports. A learner sits a handful of
 * programmes, so one report read per programme stays inside the request budget.
 */
export function useStudentProgramReports(studentUuid?: string) {
  const list = useStudentProgrammes(studentUuid);
  const rows = useMemo(
    () =>
      list.data?.success === false
        ? []
        : (list.data?.data ?? []).filter(row => Boolean(row.program_uuid)),
    [list.data]
  );
  const reports = useQueries({
    queries: rows.slice(0, MAX_PROGRAMMES).map(row => ({
      ...getProgramReportOptions({
        path: { programUuid: row.program_uuid ?? '', studentUuid: studentUuid ?? '' },
      }),
      enabled: Boolean(studentUuid),
      staleTime: STALE_TIMES.entity,
    })),
  });
  const loaded = reports.flatMap(query =>
    query.data?.data && query.data.success !== false ? [query.data.data] : []
  );
  // Which programmes each course counts towards, for the course cards.
  const partOf: Record<string, string[]> = {};
  for (const report of loaded) {
    for (const course of report.courses ?? []) {
      if (!course.course_uuid) continue;
      const weight =
        course.is_required && course.weight_percentage != null
          ? ` · ${Number(course.weight_percentage)}%`
          : '';
      (partOf[course.course_uuid] ??= []).push(
        `${report.program_title ?? 'Program'} · ${course.is_required ? 'mandatory' : 'optional'}${weight}`
      );
    }
  }
  return {
    count: rows.length,
    reports: loaded,
    partOf,
    loading: list.isLoading || reports.some(query => query.isLoading),
  };
}

/** The "Programs" section of My grades: one card per programme, linking to its report. */
export function StudentProgramCards({
  reports,
  loading,
}: {
  reports: ProgramReport[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className='h-56 w-full max-w-[1100px] rounded-2xl' />;
  if (reports.length === 0) return null;
  return (
    <section aria-labelledby='my-programs' className='flex flex-col gap-2.5'>
      <h2 id='my-programs' className='text-lg font-semibold'>
        Programs
      </h2>
      {reports.map(report => (
        <StudentProgramCard key={report.program_uuid} report={report} />
      ))}
    </section>
  );
}

function StudentProgramCard({ report }: { report: ProgramReport }) {
  const mandatory = (report.courses ?? []).filter(course => course.is_required);
  const withResult = mandatory.filter(course =>
    HAS_RESULT.has((course.result_status ?? '').toUpperCase())
  );
  const running = mandatory.filter(course => !withResult.includes(course));
  const mandatoryTotal = report.mandatory_total ?? mandatory.length;
  const skills = report.skills ?? [];
  const achieved = skills.filter(skill => skill.counts_as_achieved).length;
  const provisional = report.final_grade_provisional !== false;
  const share = mandatory.length ? (withResult.length / mandatory.length) * 100 : 0;
  const status = (report.result_status ?? 'IN_PROGRESS').toUpperCase();
  const caption = `${withResult.length} of ${mandatory.length} mandatory courses have a result${
    running.length
      ? ` · ${running.map(course => course.course_title ?? 'A course').join(', ')} ${running.length === 1 ? 'is' : 'are'} still running`
      : ''
  }`;

  return (
    <article
      data-testid='student-program-card'
      aria-label={report.program_title ?? 'Program'}
      className='bg-card max-w-[1100px] overflow-hidden rounded-2xl border'
    >
      <div className='from-primary to-primary/40 h-2 bg-gradient-to-r' />
      <div className='flex flex-col gap-4 p-5'>
        <div className='flex flex-wrap justify-between gap-3'>
          <div className='flex flex-col gap-1'>
            <h3 className='text-lg font-semibold'>{report.program_title ?? 'Program'}</h3>
            <span className='text-muted-foreground text-sm'>
              {mandatoryTotal} mandatory {mandatoryTotal === 1 ? 'course' : 'courses'}
              {report.pass_mark == null ? '' : ` · pass mark ${Number(report.pass_mark)}%`}
            </span>
          </div>
          <span
            className={cn(
              'self-start rounded-full px-2.5 py-1 text-xs font-semibold',
              RESULT_PILL[status] ?? 'bg-muted text-foreground/80'
            )}
          >
            {resultLabel(status)}
          </span>
        </div>
        <div className='grid gap-3 sm:grid-cols-3'>
          <Tile
            label={`Program mark · ${provisional ? 'Provisional' : 'Final'}`}
            value={percent(report.final_grade)}
          />
          <Tile
            label='Mandatory courses passed'
            value={`${report.mandatory_passed ?? 0} of ${report.mandatory_total ?? mandatory.length}`}
          />
          <Tile label='Skills achieved' value={`${achieved} of ${skills.length}`} />
        </div>
        <div className='flex flex-col gap-1.5'>
          <div
            role='img'
            aria-label={`${withResult.length} of ${mandatory.length} mandatory courses have a result`}
            className='bg-muted h-2 overflow-hidden rounded-full'
          >
            <div className='bg-primary h-2' style={{ width: `${share}%` }} />
          </div>
          <span className='text-muted-foreground text-xs'>{caption}</span>
        </div>
        <div>
          <Button asChild>
            <Link
              href={`/dashboard/student/programs/${encodeURIComponent(report.program_uuid ?? '')}?tab=assessment`}
            >
              Open program report
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border p-3'>
      <div className='text-muted-foreground text-xs'>{label}</div>
      <div className='font-mono text-[22px] font-bold'>{value}</div>
    </div>
  );
}
