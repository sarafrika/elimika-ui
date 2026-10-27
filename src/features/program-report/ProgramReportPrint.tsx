'use client';

import { Printer } from 'lucide-react';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Button } from '@/components/ui/button';
import { resultLabel } from '@/lib/grades';
import type { ProgramReport } from '@/services/client/types.gen';
import { percent, shortDate } from './use-program-report';

/** The learner academic report laid out for paper; the browser prints it or saves it as PDF. */
export function ProgramReportPrint({
  report,
  learnerName,
}: {
  report: ProgramReport;
  learnerName: string;
}) {
  const latest = report.remarks?.[0];
  return (
    <div className='bg-muted/30 min-h-screen px-4 py-8 print:bg-transparent print:p-0'>
      <div className='mx-auto mb-4 flex max-w-[820px] justify-end print:hidden'>
        <Button type='button' onClick={() => window.print()}>
          <Printer className='size-4' /> Print or save as PDF
        </Button>
      </div>
      <article
        data-testid='programme-report-print'
        className='bg-background mx-auto max-w-[820px] space-y-6 p-12 text-[13px] leading-relaxed print:max-w-none print:p-0'
      >
        <header className='flex flex-wrap justify-between gap-4 border-b-2 border-current pb-3'>
          <div>
            <div className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
              Learner academic report
            </div>
            <h1 className='text-xl font-bold'>{report.program_title}</h1>
            <div className='text-muted-foreground'>{report.program_code}</div>
          </div>
          <div className='text-muted-foreground text-right'>
            <div className='text-foreground font-bold'>Elimika</div>
            <div>
              {report.from || report.to
                ? `Period ${shortDate(report.from)} – ${shortDate(report.to)}`
                : 'Whole programme'}
            </div>
            <div>Printed {shortDate(new Date())}</div>
          </div>
        </header>
        <section className='grid grid-cols-4 gap-3'>
          <Fact label='Learner' value={learnerName} />
          <Fact
            label='Programme mark'
            value={`${percent(report.final_grade)}${report.final_grade_provisional ? ' (provisional)' : ''}`}
          />
          <Fact label='Pass mark' value={report.pass_mark == null ? '—' : `${report.pass_mark}%`} />
          <Fact label='Result' value={resultLabel(report.result_status)} />
        </section>
        <section>
          <h2 className='mb-2 text-sm font-semibold'>Courses</h2>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-current text-left'>
                <th className='py-1.5 pr-2'>Course</th>
                <th className='py-1.5 pr-2'>Weight</th>
                <th className='py-1.5 pr-2'>Attendance</th>
                <th className='py-1.5 pr-2'>Final</th>
                <th className='py-1.5 pr-2'>Band</th>
                <th className='py-1.5 pr-2'>Result</th>
                <th className='py-1.5'>Points</th>
              </tr>
            </thead>
            <tbody>
              {(report.courses ?? []).map(row => (
                <tr key={row.course_uuid} className='border-b'>
                  <td className='py-1.5 pr-2'>
                    {row.course_title}
                    {row.is_required ? '' : ' (optional)'}
                  </td>
                  <td className='py-1.5 pr-2'>
                    {row.weight_percentage == null ? '—' : `${row.weight_percentage}%`}
                  </td>
                  <td className='py-1.5 pr-2'>
                    {row.sessions_attended ?? 0} / {row.sessions_counted ?? 0}
                    {(row.sessions_excused ?? 0) > 0 ? ` (${row.sessions_excused} excused)` : ''}
                  </td>
                  <td className='py-1.5 pr-2 font-mono'>{percent(row.final_grade)}</td>
                  <td className='py-1.5 pr-2'>{row.grade_band ?? '—'}</td>
                  <td className='py-1.5 pr-2'>
                    {row.result_status === 'NOT_STARTED'
                      ? 'Not started'
                      : resultLabel(row.result_status)}
                  </td>
                  <td className='py-1.5 font-mono'>
                    {row.contribution == null ? '—' : Number(row.contribution).toFixed(2)}
                  </td>
                </tr>
              ))}
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
                  <th className='py-1.5 pr-2'>Latest evidence</th>
                  <th className='py-1.5'>Level</th>
                </tr>
              </thead>
              <tbody>
                {(report.skills ?? []).map(skill => (
                  <tr key={skill.skill_uuid} className='border-b'>
                    <td className='py-1.5 pr-2'>{skill.skill_name}</td>
                    <td className='py-1.5 pr-2'>
                      {skill.score == null
                        ? 'Not assessed yet'
                        : `${percent(skill.score)} · ${shortDate(skill.graded_at)}`}
                    </td>
                    <td className='py-1.5 font-semibold'>{skill.level_name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {latest && (
          <section className='grid grid-cols-3 gap-4'>
            {latest.strengths && <Remark title='Strengths' html={latest.strengths} />}
            {latest.improvements && <Remark title='Areas to improve' html={latest.improvements} />}
            {latest.recommendations && (
              <Remark title='Recommendations' html={latest.recommendations} />
            )}
          </section>
        )}
        <footer className='text-muted-foreground flex flex-wrap justify-between gap-4 border-t pt-3 text-xs'>
          <span>
            {latest?.next_review_date ? `Next review ${shortDate(latest.next_review_date)}` : ''}
          </span>
          <span>Pass rule: programme mark ≥ pass mark and all mandatory courses passed</span>
        </footer>
      </article>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className='text-muted-foreground text-[11px] tracking-wide uppercase'>{label}</div>
      <div className='font-semibold'>{value}</div>
    </div>
  );
}

function Remark({ title, html }: { title: string; html: string }) {
  return (
    <div>
      <h3 className='mb-1 text-[13px] font-semibold'>{title}</h3>
      <RichTextRenderer htmlString={html} />
    </div>
  );
}
