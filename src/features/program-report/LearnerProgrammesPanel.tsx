'use client';

import { GraduationCap, PenLine } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { surfaceTheme } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ProgramRemarksSheet } from './ProgramRemarksSheet';
import { ProgramReportCard } from './ProgramReportCard';
import type { ReportAudience } from './report-model';
import { useProgramReport, useStudentProgrammes } from './use-program-report';

/** Every program the caller may open for this learner, one at a time behind a switcher. */
export function LearnerProgrammesPanel({
  studentUuid,
  audience,
  learnerName,
  printHref,
  walletHref,
}: {
  studentUuid: string;
  audience: ReportAudience;
  learnerName?: string;
  printHref?: (programUuid: string) => string;
  walletHref?: string;
}) {
  const programmes = useStudentProgrammes(studentUuid);
  const [picked, setPicked] = useState<string>();
  if (programmes.isLoading) return <Skeleton className='h-48 w-full' />;
  const rows = (programmes.data?.success === false ? [] : (programmes.data?.data ?? [])).filter(
    row => Boolean(row.program_uuid)
  );
  if (rows.length === 0)
    return (
      <EmptyState
        variant='compact'
        title='No programs'
        description='This learner is not enrolled in a program you can see.'
      />
    );
  const selected = rows.find(row => row.program_uuid === picked) ?? rows[0];
  const programUuid = selected?.program_uuid ?? '';
  return (
    <div className='flex flex-col gap-4'>
      {rows.length > 1 && (
        <ProgramPills
          label='Program'
          options={rows.map(row => ({
            id: row.program_uuid ?? '',
            label: row.program_title ?? 'Program',
          }))}
          value={programUuid}
          onChange={setPicked}
        />
      )}
      <LearnerProgrammeReport
        key={programUuid}
        programUuid={programUuid}
        studentUuid={studentUuid}
        audience={audience}
        learnerName={learnerName}
        printHref={printHref?.(programUuid)}
        walletHref={walletHref}
      />
    </div>
  );
}

/** Pill buttons that pick one program, as the class and learner screens share. */
export function ProgramPills({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value?: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role='group' aria-label={label} className='flex flex-wrap gap-2'>
      {options.map(option => {
        const on = option.id === value;
        return (
          <Button
            key={option.id}
            type='button'
            variant={on ? 'default' : 'outline'}
            aria-pressed={on}
            className='rounded-full'
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

/** One program's report for the learner; instructors who teach the learner can add remarks. */
export function LearnerProgrammeReport({
  programUuid,
  studentUuid,
  audience,
  learnerName,
  printHref,
  walletHref,
  enrolHref,
}: {
  programUuid: string;
  studentUuid: string;
  audience: ReportAudience;
  learnerName?: string;
  printHref?: string;
  walletHref?: string;
  /** Where a learner who hasn't enrolled finds a class. */
  enrolHref?: string;
}) {
  const query = useProgramReport(programUuid, studentUuid);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const report = query.data?.success === false ? undefined : query.data?.data;
  if (query.isLoading) return <Skeleton className='h-48 w-full' />;
  if (!report) {
    if (audience === 'learner')
      return (
        <section
          data-testid='programme-report-no-access'
          className={cn(
            surfaceTheme.cardPadded,
            'flex flex-col items-center gap-3 py-10 text-center'
          )}
        >
          <span className='bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full'>
            <GraduationCap className='size-6' />
          </span>
          <h2 className='text-lg font-semibold'>Your report starts when you enrol</h2>
          <p className='text-muted-foreground max-w-md text-sm'>
            Marks, skills and remarks for this program appear here once you join one of its classes.
          </p>
          {enrolHref && (
            <Button asChild>
              <Link href={enrolHref}>Find classes</Link>
            </Button>
          )}
        </section>
      );
    return <EmptyState variant='compact' title='Unable to load this program report' />;
  }
  const first = learnerName?.split(/\s+/)[0] ?? 'this learner';
  return (
    <div className='flex flex-col gap-4'>
      {audience === 'instructor' && report.can_add_remarks === true && (
        <div
          className={cn(
            surfaceTheme.cardPadded,
            'flex flex-wrap items-center justify-between gap-3 py-3'
          )}
        >
          <p className='text-muted-foreground text-sm'>
            You are {first}&apos;s class instructor, so you can add progress remarks. Marks come
            from each course&apos;s grading.
          </p>
          <Button type='button' onClick={() => setSheetOpen(true)}>
            <PenLine className='size-4' /> Write remarks
          </Button>
        </div>
      )}
      {saved && (
        <p role='status' className='bg-success/10 text-success rounded-md px-3 py-2 text-sm'>
          Remarks saved. {first === 'this learner' ? 'The learner' : first} and their guardians can
          see them now. Earlier remarks are kept.
        </p>
      )}
      <ProgramReportCard
        report={report}
        audience={audience}
        learnerName={learnerName}
        printHref={printHref}
        walletHref={walletHref}
      />
      {audience === 'instructor' && report.can_add_remarks === true && (
        <ProgramRemarksSheet
          report={report}
          learnerName={learnerName}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSaved={() => setSaved(true)}
        />
      )}
    </div>
  );
}
