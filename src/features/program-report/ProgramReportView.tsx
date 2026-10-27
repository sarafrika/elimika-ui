'use client';

import { CheckCircle2, ChevronDown, ChevronUp, Circle, Printer } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { StatusBadge } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { resultLabel } from '@/lib/grades';
import type { ProgramReport, ProgramReportCourse } from '@/services/client/types.gen';
import { percent, shortDate } from './use-program-report';

const RESULT_TONE = { PASSED: 'success', FAILED: 'destructive' } as const;

function courseResult(row: ProgramReportCourse) {
  if (row.result_status === 'NOT_STARTED') return 'Not started';
  return resultLabel(row.result_status);
}

/** A learner's programme report: mark, pass checklist, courses, skills and latest remarks. */
export function ProgramReportView({
  report,
  audience = 'learner',
  printHref,
  gradesHref,
  compact = false,
}: {
  report: ProgramReport;
  /** The learner is addressed as "your"; a guardian or instructor is not. */
  audience?: 'learner' | 'guardian' | 'instructor';
  printHref?: string;
  /** Where a course row's "lesson marks" link goes. */
  gradesHref?: string;
  /** The parent card: tiles, course list and latest remarks only. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const courses = report.courses ?? [];
  const skills = report.skills ?? [];
  const achieved = skills.filter(skill => skill.counts_as_achieved).length;
  const latest = report.remarks?.[0];
  const provisional = report.final_grade_provisional !== false;
  const markReached = report.pass_mark == null || (report.final_grade ?? 0) >= report.pass_mark;
  const you = audience === 'learner';

  return (
    <section
      data-testid='programme-report'
      className='bg-card border-border overflow-hidden rounded-2xl border'
      aria-label={`${report.program_title ?? 'Programme'} report`}
    >
      <div className='from-primary to-primary/40 h-2 bg-gradient-to-r' />
      <div className='flex flex-col gap-5 p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold'>{report.program_title ?? 'Programme'}</h2>
            <span className='text-muted-foreground text-sm'>
              {report.program_code ? `${report.program_code} · ` : ''}
              {provisional ? 'Mark is provisional' : 'Final mark'}
            </span>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <StatusBadge
              tone={RESULT_TONE[report.result_status as keyof typeof RESULT_TONE] ?? 'neutral'}
              label={resultLabel(report.result_status)}
            />
            {printHref && (
              <Button asChild variant='outline' size='sm'>
                <Link href={printHref}>
                  <Printer className='size-4' /> Print report
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-3'>
          <Tile
            label={you ? 'Programme mark so far' : 'Programme mark'}
            value={percent(report.final_grade)}
            hint={provisional ? 'Provisional' : undefined}
          />
          <Tile
            label='Mandatory courses passed'
            value={`${report.mandatory_passed ?? 0} of ${report.mandatory_total ?? 0}`}
          />
          <Tile label='Skills achieved' value={`${achieved} of ${skills.length}`} />
        </div>

        {!compact && (
          <ul className='space-y-2 text-sm' aria-label='To complete this programme'>
            <Check done={markReached && report.final_grade != null}>
              Programme mark at or above{' '}
              {report.pass_mark == null ? 'the pass mark' : `${report.pass_mark}%`}{' '}
              <span className='text-muted-foreground'>({percent(report.final_grade)} so far)</span>
            </Check>
            <Check
              done={
                (report.mandatory_passed ?? 0) === (report.mandatory_total ?? 0) &&
                (report.mandatory_total ?? 0) > 0
              }
            >
              Pass all {report.mandatory_total ?? 0} mandatory courses{' '}
              <span className='text-muted-foreground'>({report.mandatory_passed ?? 0} passed)</span>
            </Check>
            {provisional && (
              <li className='text-muted-foreground text-xs'>
                The mark only counts courses that have a result, so it changes as the rest are
                graded.
              </li>
            )}
          </ul>
        )}

        <div className='flex flex-col gap-2'>
          {courses.map(row => {
            const id = row.course_uuid ?? row.course_title ?? '';
            const isOpen = open === id;
            return (
              <div key={id} data-testid='programme-course' className='rounded-xl border'>
                <button
                  type='button'
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : id)}
                  className='flex min-h-12 w-full flex-wrap items-center gap-3 px-4 py-3 text-left'
                >
                  <span className='flex min-w-[200px] flex-1 flex-col'>
                    <span className='font-medium'>{row.course_title ?? 'Course'}</span>
                    <span className='text-muted-foreground text-xs'>
                      {row.is_required
                        ? `Mandatory · ${row.weight_percentage ?? '—'}% of programme`
                        : "Optional · doesn't count toward the programme mark"}
                    </span>
                  </span>
                  <span className='font-mono text-sm'>
                    {percent(row.final_grade)}
                    {row.grade_band ? ` · ${row.grade_band}` : ''}
                  </span>
                  <StatusBadge
                    tone={RESULT_TONE[row.result_status as keyof typeof RESULT_TONE] ?? 'neutral'}
                    label={courseResult(row)}
                  />
                  {isOpen ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
                </button>
                {isOpen && (
                  <div className='text-muted-foreground space-y-1 px-4 pb-3 text-sm'>
                    {row.contribution != null && (
                      <p>
                        Adds {Number(row.contribution).toFixed(2)} points to the programme mark.
                      </p>
                    )}
                    <p>
                      Attendance: {row.sessions_attended ?? 0} of {row.sessions_counted ?? 0}
                      {(row.sessions_excused ?? 0) > 0
                        ? ` · ${row.sessions_excused} excused, not counted`
                        : ''}
                    </p>
                    {gradesHref && (
                      <Link href={gradesHref} className='text-primary text-sm'>
                        See lesson marks
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {skills.length > 0 && (
          <div className='flex flex-wrap gap-2' aria-label='Skills'>
            {skills.map(skill => (
              <span
                key={skill.skill_uuid}
                className={`rounded-full px-3 py-1 text-xs ${skill.counts_as_achieved ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted text-muted-foreground'}`}
              >
                {skill.skill_name} · {skill.level_name ?? 'Not assessed yet'}
              </span>
            ))}
          </div>
        )}

        {latest && (
          <div className='border-t pt-4 text-sm'>
            <h3 className='mb-2 text-sm font-semibold'>
              {you ? 'Latest from your instructor' : 'Latest from the instructor'}
            </h3>
            <RemarkBody remark={latest} />
          </div>
        )}
      </div>
    </section>
  );
}

export function RemarkBody({ remark }: { remark: NonNullable<ProgramReport['remarks']>[number] }) {
  return (
    <div className='grid gap-3 sm:grid-cols-3'>
      {remark.strengths && <RemarkPart title='Strengths' html={remark.strengths} />}
      {remark.improvements && <RemarkPart title='Areas to improve' html={remark.improvements} />}
      {remark.recommendations && (
        <RemarkPart title='Recommendations' html={remark.recommendations} />
      )}
      <p className='text-muted-foreground text-xs sm:col-span-3'>
        {shortDate(remark.created_date)}
        {remark.next_review_date ? ` · next review ${shortDate(remark.next_review_date)}` : ''}
      </p>
    </div>
  );
}

function RemarkPart({ title, html }: { title: string; html: string }) {
  return (
    <div>
      <div className='text-muted-foreground text-xs font-semibold'>{title}</div>
      <RichTextRenderer htmlString={html} />
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className='rounded-xl border p-3'>
      <div className='text-muted-foreground text-xs'>{label}</div>
      <div className='text-xl font-bold'>{value}</div>
      {hint && <div className='text-muted-foreground text-xs'>{hint}</div>}
    </div>
  );
}

function Check({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className='flex gap-2'>
      {done ? (
        <CheckCircle2 className='text-success size-4 shrink-0' aria-label='Done' />
      ) : (
        <Circle className='text-muted-foreground size-4 shrink-0' aria-label='Not yet' />
      )}
      <span>{children}</span>
    </li>
  );
}
