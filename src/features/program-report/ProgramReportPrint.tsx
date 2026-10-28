'use client';

import { Printer } from 'lucide-react';
import { useEffect } from 'react';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Button } from '@/components/ui/button';
import { resultLabel } from '@/lib/grades';
import { cn } from '@/lib/utils';
import type { ProgramReport } from '@/services/client/types.gen';
import { courseResultLabel, passRuleText, reportFacts } from './report-model';
import { attendancePercent, percent, points, shortDate } from './use-program-report';

/** "3 of 4 · 75%", or "3 of 3 · 1 excused" when sessions were excused. */
function paperAttendance(row: {
  sessions_attended?: number;
  sessions_counted?: number;
  sessions_excused?: number;
  attendance_percentage?: number;
}) {
  const base = `${row.sessions_attended ?? 0} of ${row.sessions_counted ?? 0}`;
  if ((row.sessions_excused ?? 0) > 0) return `${base} · ${row.sessions_excused} excused`;
  return row.attendance_percentage == null
    ? base
    : `${base} · ${attendancePercent(row.attendance_percentage)}`;
}

/** The report as it prints: the preview Sheet and the print route render this same paper. */
export function ProgramReportPaper({
  report,
  learnerName,
  className,
}: {
  report: ProgramReport;
  learnerName: string;
  className?: string;
}) {
  const facts = reportFacts(report);
  const latest = [...(report.remarks ?? [])].sort(
    (a, b) => new Date(b.created_date ?? 0).getTime() - new Date(a.created_date ?? 0).getTime()
  )[0];
  const attendance = report.attendance;
  const cell = 'border-b py-1.5 pr-2 align-top';

  return (
    <article
      data-testid='programme-report-paper'
      className={cn(
        'bg-background text-foreground space-y-5 text-[13px] leading-relaxed',
        className
      )}
    >
      <header className='flex flex-wrap justify-between gap-4 border-b-2 border-current pb-3'>
        <div>
          <div className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
            Learner academic report
          </div>
          <h1 className='text-xl font-bold'>{report.program_title}</h1>
          {report.program_code && (
            <div className='text-muted-foreground'>{report.program_code}</div>
          )}
        </div>
        <div className='text-muted-foreground text-right'>
          <div className='text-foreground font-bold'>Elimika</div>
          <div>
            {report.from || report.to
              ? `Period ${shortDate(report.from)} – ${shortDate(report.to)}`
              : 'Whole program'}
          </div>
          <div>Printed {shortDate(new Date())}</div>
        </div>
      </header>

      <section className='bg-muted/40 rounded-md p-3' aria-label='Summary'>
        <div>
          <strong>{learnerName}</strong>
        </div>
        <div>
          Program mark <strong>{percent(report.final_grade)}</strong>
          {facts.provisional ? ' (provisional)' : ''} · Mandatory courses passed{' '}
          {report.mandatory_passed ?? 0} of {facts.total} · Result:{' '}
          {resultLabel(report.result_status)}
        </div>
        {attendance && (
          <div>
            Attendance {attendance.sessions_attended ?? 0} of {attendance.sessions_counted ?? 0}{' '}
            sessions ({attendancePercent(attendance.attendance_percentage)})
            {(attendance.sessions_excused ?? 0) > 0
              ? ` · ${attendance.sessions_excused} excused, not counted`
              : ''}
          </div>
        )}
      </section>

      <section>
        <h2 className='mb-2 text-sm font-semibold'>Courses</h2>
        <table className='w-full border-collapse'>
          <thead>
            <tr className='border-b border-current text-left'>
              <th className='py-1.5 pr-2'>Course</th>
              <th className='py-1.5 pr-2'>Counts</th>
              <th className='py-1.5 pr-2'>Weight</th>
              <th className='py-1.5 pr-2'>Final</th>
              <th className='py-1.5 pr-2'>Result</th>
              <th className='py-1.5 pr-2'>Points</th>
              <th className='py-1.5'>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {facts.courses.map(row => (
              <tr key={row.course_uuid ?? row.course_title}>
                <td className={cell}>{row.course_title}</td>
                <td className={cell}>{row.is_required ? 'Mandatory' : 'Optional'}</td>
                <td className={cell}>
                  {row.is_required && row.weight_percentage != null
                    ? `${Number(row.weight_percentage)}%`
                    : '—'}
                </td>
                <td className={cn(cell, 'tabular-nums')}>{percent(row.final_grade)}</td>
                <td className={cell}>{courseResultLabel(row.result_status)}</td>
                <td className={cn(cell, 'tabular-nums')}>
                  {row.is_required ? points(row.contribution) : "Doesn't count"}
                </td>
                <td className={cn(cell, 'pr-0')}>{paperAttendance(row)}</td>
              </tr>
            ))}
            <tr className='font-semibold'>
              <td className='py-1.5 pr-2' colSpan={5}>
                Program mark{facts.provisional ? ' (provisional)' : ''} · {facts.sumNote}
              </td>
              <td className='py-1.5 pr-2 tabular-nums'>{percent(report.final_grade)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </section>

      {(report.skills ?? []).length > 0 && (
        <section>
          <h2 className='mb-2 text-sm font-semibold'>Skills</h2>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-current text-left'>
                <th className='py-1.5 pr-2'>Skill</th>
                <th className='py-1.5 pr-2'>Level</th>
                <th className='py-1.5 pr-2'>Latest</th>
                <th className='py-1.5'>Graded</th>
              </tr>
            </thead>
            <tbody>
              {(report.skills ?? []).map(skill => (
                <tr key={skill.skill_uuid}>
                  <td className={cell}>{skill.skill_name}</td>
                  {skill.level_name ? (
                    <>
                      <td className={cn(cell, 'font-semibold')}>{skill.level_name}</td>
                      <td className={cn(cell, 'tabular-nums')}>{percent(skill.score)}</td>
                      <td className={cn(cell, 'pr-0')}>{shortDate(skill.graded_at)}</td>
                    </>
                  ) : (
                    <td className={cn(cell, 'pr-0')} colSpan={3}>
                      Not assessed yet
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {latest && (
        <section className='space-y-2'>
          <h2 className='text-sm font-semibold'>
            Progress remarks · {latest.author_name ?? 'Instructor'} ·{' '}
            {shortDate(latest.created_date)}
          </h2>
          {latest.strengths && <PaperRemark title='Strengths' html={latest.strengths} />}
          {latest.improvements && (
            <PaperRemark title='Areas to improve' html={latest.improvements} />
          )}
          {latest.recommendations && (
            <PaperRemark title='Recommendations' html={latest.recommendations} />
          )}
          {latest.next_review_date && (
            <p className='text-muted-foreground'>
              Next review {shortDate(latest.next_review_date)}.
            </p>
          )}
        </section>
      )}

      <footer
        data-testid='pass-rule-footer'
        className='text-muted-foreground border-t pt-3 text-xs'
      >
        {passRuleText(report.pass_mark)}
      </footer>
    </article>
  );
}

function PaperRemark({ title, html }: { title: string; html: string }) {
  return (
    <div>
      <h3 className='text-[13px] font-semibold'>{title}</h3>
      <RichTextRenderer htmlString={html} />
    </div>
  );
}

/** The print route's page: the paper with a print button; `autoPrint` opens the dialog once. */
export function ProgramReportPrint({
  report,
  learnerName,
  autoPrint = false,
}: {
  report: ProgramReport;
  learnerName: string;
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  return (
    <div className='bg-muted/30 min-h-screen px-4 py-8 print:bg-transparent print:p-0'>
      <div className='mx-auto mb-4 flex max-w-[820px] justify-end print:hidden'>
        <Button type='button' onClick={() => window.print()}>
          <Printer className='size-4' /> Print or save as PDF
        </Button>
      </div>
      <div
        data-testid='programme-report-print'
        className='bg-background mx-auto max-w-[820px] rounded-md border p-12 print:max-w-none print:border-0 print:p-0'
      >
        <ProgramReportPaper report={report} learnerName={learnerName} />
      </div>
    </div>
  );
}
