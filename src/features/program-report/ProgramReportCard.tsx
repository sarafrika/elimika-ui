'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  GraduationCap,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { StatCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { resultLabel } from '@/lib/grades';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { listSkillLevelsOptions } from '@/services/client/@tanstack/react-query.gen';
import type {
  ProgramRemark,
  ProgramReport,
  ProgramReportCourse,
  ProgramReportEvidence,
  ProgramReportSkill,
} from '@/services/client/types.gen';
import { LessonMarksSheet } from './LessonMarksSheet';
import {
  courseResultLabel,
  evidenceNote,
  evidenceSource,
  levelTone,
  passRuleText,
  possessive,
  type ReportAudience,
  reportFacts,
  resultTone,
  sortedHistory,
} from './report-model';
import { ProgramReportPreviewSheet } from './ProgramReportPreviewSheet';
import {
  attendanceLine,
  attendancePercent,
  percent,
  points,
  shortDate,
} from './use-program-report';

/**
 * The program report every reader sees: mark, pass rule, courses with their lesson marks,
 * attendance, skills with evidence and the instructor's remarks.
 */
export function ProgramReportCard({
  report,
  audience,
  learnerName,
  printHref,
  walletHref,
  className,
}: {
  report: ProgramReport;
  audience: ReportAudience;
  learnerName?: string;
  /** The print route; the card previews it in a Sheet first. */
  printHref?: string;
  /** The learner's Skills Wallet, linked from achieved skills. */
  walletHref?: string;
  className?: string;
}) {
  const facts = reportFacts(report);
  const { courses, failedMandatory, pendingMandatory, provisional, total } = facts;
  const skills = report.skills ?? [];
  const achieved = skills.filter(skill => skill.counts_as_achieved).length;
  const status = (report.result_status ?? 'IN_PROGRESS').toUpperCase();
  const whose = possessive(audience, learnerName);
  const attendance = report.attendance;
  const [marksFor, setMarksFor] = useState<ProgramReportCourse | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const passMark = report.pass_mark == null ? null : Number(report.pass_mark);
  const passText = passMark == null ? 'the pass mark' : `${passMark}%`;
  const mark = report.final_grade == null ? null : Number(report.final_grade);

  const markRule: Rule =
    mark == null
      ? {
          state: 'wait',
          title: `Program mark at least ${passText}`,
          detail: 'No course result yet',
        }
      : passMark == null || mark >= passMark
        ? {
            state: 'ok',
            title: `Program mark at least ${passText}`,
            detail: `${percent(mark)}${provisional ? ' so far' : ''}`,
          }
        : {
            state: provisional ? 'wait' : 'bad',
            title: `Program mark at least ${passText}`,
            detail: `${percent(mark)}${provisional ? ' so far' : ''}`,
          };
  const mandatoryRule: Rule =
    failedMandatory.length > 0
      ? {
          state: 'bad',
          title: `Pass all ${total} mandatory courses`,
          detail: `${failedMandatory
            .map(course => `${course.course_title ?? 'A course'} (${percent(course.final_grade)})`)
            .join(', ')} ${failedMandatory.length === 1 ? 'was' : 'were'} not passed`,
        }
      : pendingMandatory.length === 0 && total > 0
        ? {
            state: 'ok',
            title: `Pass all ${total} mandatory courses`,
            detail: `All ${total} passed`,
          }
        : {
            state: 'wait',
            title: `Pass all ${total} mandatory courses`,
            detail: `${report.mandatory_passed ?? 0} passed · ${pendingMandatory
              .map(course => course.course_title ?? 'A course')
              .join(', ')} ${pendingMandatory.length === 1 ? 'has' : 'have'} no result yet`,
          };

  return (
    <div
      data-testid='programme-report'
      className={cn('flex flex-col gap-4', className)}
      aria-label={`${report.program_title ?? 'Program'} report`}
      role='region'
    >
      <div className={surfaceTheme.statGrid}>
        <StatCard
          label='Program mark'
          value={percent(report.final_grade)}
          hint={provisional ? 'Provisional' : 'Final'}
          icon={GraduationCap}
        />
        <StatCard
          label='Mandatory courses passed'
          value={`${report.mandatory_passed ?? 0} of ${total}`}
          icon={CircleCheck}
          tone='success'
        />
        <StatCard
          label='Attendance'
          value={attendancePercent(attendance?.attendance_percentage)}
          hint={
            attendance
              ? `${attendance.sessions_attended ?? 0} of ${attendance.sessions_counted ?? 0} sessions${
                  (attendance.sessions_excused ?? 0) > 0
                    ? `, ${attendance.sessions_excused} excused`
                    : ''
                }`
              : undefined
          }
          icon={CalendarCheck}
        />
        <StatCard
          label='Skills achieved'
          value={`${achieved} of ${skills.length}`}
          icon={ShieldCheck}
        />
      </div>

      {status === 'FAILED' && (
        <Alert variant='destructive' data-testid='programme-failed-alert'>
          <AlertTriangle className='size-4' />
          {failedMandatory.length > 0 ? (
            <>
              <AlertTitle>Not passed because a mandatory course was failed.</AlertTitle>
              <AlertDescription>
                {whose} program mark is {percent(mark)}
                {passMark == null
                  ? ''
                  : `, ${mark != null && mark >= passMark ? 'above' : 'below'} the ${passMark}% pass mark`}
                , but {failedMandatory.map(course => course.course_title ?? 'a course').join(', ')}{' '}
                {failedMandatory.length === 1 ? 'is' : 'are'} mandatory and finished at{' '}
                {failedMandatory.map(course => percent(course.final_grade)).join(', ')}. Every
                mandatory course must be passed.
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTitle>Not passed because the program mark is below the pass mark.</AlertTitle>
              <AlertDescription>
                {whose} program mark is {percent(mark)} and the pass mark is {passText}.
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      <section className={cn(surfaceTheme.card, 'overflow-hidden')}>
        <div className='from-primary to-primary/40 h-2 bg-gradient-to-r' />
        <div className='flex flex-col gap-6 p-5'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-lg font-semibold'>{report.program_title ?? 'Program'}</h2>
              <span className='text-muted-foreground text-sm'>
                {provisional
                  ? 'Program mark is provisional until every mandatory course has a result.'
                  : `All ${total} mandatory courses have a result, so this mark is final.`}
              </span>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <StatusBadge tone={resultTone(status)} label={resultLabel(status)} />
              {printHref && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setPreviewOpen(true)}
                >
                  <Printer className='size-4' /> Print report
                </Button>
              )}
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold'>To pass this program</h3>
            <ul className='flex flex-col gap-2' aria-label='To pass this program'>
              <RuleRow rule={markRule} />
              <RuleRow rule={mandatoryRule} />
            </ul>
            <p className='text-muted-foreground text-xs'>
              {provisional
                ? 'The mark is provisional. It only counts mandatory courses that have a result.'
                : passRuleText(passMark).replace(' Points = course final × weight.', '')}
            </p>
          </div>

          <div className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold'>Courses</h3>
            <div className='overflow-x-auto rounded-md border'>
              <table className='w-full min-w-[860px] text-sm'>
                <thead className='bg-muted/50 text-muted-foreground text-left text-xs'>
                  <tr>
                    <th className='px-3 py-2 font-medium'>Course</th>
                    <th className='px-3 py-2 font-medium'>Counts</th>
                    <th className='px-3 py-2 font-medium'>Weight</th>
                    <th className='px-3 py-2 font-medium'>Course final</th>
                    <th className='px-3 py-2 font-medium'>Result</th>
                    <th className='px-3 py-2 font-medium'>Points</th>
                    <th className='px-3 py-2 font-medium'>Attendance</th>
                    <th className='px-3 py-2 font-medium'>
                      <span className='sr-only'>Lesson marks</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(row => (
                    <tr
                      key={row.course_uuid ?? row.course_title}
                      data-testid='programme-course'
                      className='border-t align-top'
                    >
                      <td className='px-3 py-2'>
                        <div className='font-medium'>{row.course_title ?? 'Course'}</div>
                        {row.course_code && (
                          <div className='text-muted-foreground text-xs'>{row.course_code}</div>
                        )}
                      </td>
                      <td className='px-3 py-2'>{row.is_required ? 'Mandatory' : 'Optional'}</td>
                      <td className='px-3 py-2 tabular-nums'>
                        {row.is_required && row.weight_percentage != null
                          ? `${Number(row.weight_percentage)}%`
                          : '—'}
                      </td>
                      <td className='px-3 py-2'>
                        <div className='font-semibold tabular-nums'>{percent(row.final_grade)}</div>
                        <div className='text-muted-foreground text-xs'>
                          {row.final_grade == null ? 'No result yet' : (row.grade_band ?? '')}
                        </div>
                      </td>
                      <td className='px-3 py-2'>
                        <StatusBadge
                          tone={resultTone(row.result_status)}
                          label={courseResultLabel(row.result_status)}
                        />
                      </td>
                      <td className='px-3 py-2 tabular-nums'>
                        {row.is_required ? points(row.contribution) : "Doesn't count"}
                      </td>
                      <td className='px-3 py-2'>
                        <div className='font-semibold tabular-nums'>
                          {attendancePercent(row.attendance_percentage)}
                        </div>
                        <div className='text-muted-foreground text-xs'>{attendanceLine(row)}</div>
                      </td>
                      <td className='px-3 py-2 text-right'>
                        {row.course_enrollment_uuid && row.course_uuid ? (
                          <Button
                            type='button'
                            variant='link'
                            size='sm'
                            className='h-auto px-0'
                            aria-label={`Lesson marks for ${row.course_title ?? 'this course'}`}
                            onClick={() => setMarksFor(row)}
                          >
                            Lesson marks
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  <tr className='bg-muted/30 border-t font-semibold'>
                    <td colSpan={5} className='px-3 py-2'>
                      Program mark{' '}
                      <span className='text-muted-foreground font-normal'>· {facts.sumNote}</span>
                    </td>
                    <td className='px-3 py-2 tabular-nums'>{percent(report.final_grade)}</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
            <p className='text-muted-foreground text-xs'>
              Points = course final × weight. Only mandatory courses with a result count. Excused
              sessions are left out of attendance.
            </p>
          </div>

          <div className='grid gap-6 xl:grid-cols-2'>
            <ProgramSkillsList skills={skills} audience={audience} walletHref={walletHref} />
            <ProgramRemarksList remarks={report.remarks ?? []} />
          </div>
        </div>
      </section>

      {marksFor && (
        <LessonMarksSheet
          course={marksFor}
          audience={audience}
          learnerName={learnerName}
          onClose={() => setMarksFor(null)}
        />
      )}
      {printHref && (
        <ProgramReportPreviewSheet
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          report={report}
          learnerName={learnerName}
          printHref={printHref}
        />
      )}
    </div>
  );
}

type Rule = { state: 'ok' | 'bad' | 'wait'; title: string; detail: string };

const RULE_DOT: Record<Rule['state'], string> = {
  ok: 'bg-success/10 text-success',
  bad: 'bg-destructive/10 text-destructive',
  wait: 'bg-muted text-muted-foreground',
};

function RuleRow({ rule }: { rule: Rule }) {
  const Icon = rule.state === 'ok' ? Check : rule.state === 'bad' ? X : Clock;
  return (
    <li className='flex items-start gap-3' data-state={rule.state}>
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full',
          RULE_DOT[rule.state]
        )}
        aria-label={rule.state === 'ok' ? 'Met' : rule.state === 'bad' ? 'Not met' : 'Waiting'}
      >
        <Icon className='size-3.5' />
      </span>
      <span className='flex flex-col'>
        <span className='text-sm font-medium'>{rule.title}</span>
        <span className='text-muted-foreground text-xs'>{rule.detail}</span>
      </span>
    </li>
  );
}

/** Lowest score that counts as achieved on the platform scale, e.g. 70. */
function useAchievedFrom() {
  const query = useQuery({ ...listSkillLevelsOptions(), staleTime: STALE_TIMES.reference });
  const levels = query.data?.data ?? [];
  const achieved = levels
    .filter(level => level.counts_as_achieved)
    .map(level => Number(level.min_percentage));
  return achieved.length ? Math.min(...achieved) : null;
}

/** Skills with their level, latest evidence and, for staff and guardians, the history behind it. */
export function ProgramSkillsList({
  skills,
  audience,
  walletHref,
}: {
  skills: ProgramReportSkill[];
  audience: ReportAudience;
  walletHref?: string;
}) {
  const achievedFrom = useAchievedFrom();
  const firstWithHistory = skills.find(skill => (skill.history ?? []).length > 0)?.skill_uuid;
  const [open, setOpen] = useState<string | null>(
    audience === 'instructor' ? (firstWithHistory ?? null) : null
  );

  return (
    <section className='flex flex-col gap-3' aria-label='Skills' data-testid='programme-skills'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h3 className='text-sm font-semibold'>Skills</h3>
        <span className='text-muted-foreground text-xs'>
          Latest evidence sets the level
          {achievedFrom == null ? '' : ` · Achieved from ${achievedFrom}%`}
        </span>
      </div>
      {skills.length === 0 && (
        <p className='text-muted-foreground text-sm'>This program has no target skills yet.</p>
      )}
      {skills.map(skill => {
        const history = sortedHistory(skill);
        const latest = history.find(item => !item.superseded) ?? history[0];
        const canToggle = audience !== 'learner' && history.length > 0;
        const isOpen = canToggle && open === skill.skill_uuid;
        return (
          <div
            key={skill.skill_uuid ?? skill.skill_name}
            data-testid='programme-skill'
            className='flex flex-col gap-2 rounded-md border p-3'
          >
            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex min-w-[180px] flex-1 flex-col'>
                <span className='font-medium'>{skill.skill_name}</span>
                <span className='text-muted-foreground text-xs'>
                  {latest
                    ? `Latest ${shortDate(latest.graded_at)} · ${evidenceSource(latest).replace(' · ', ', ')}`
                    : 'No graded work linked to this skill has been marked yet.'}
                </span>
              </div>
              <span className='font-semibold tabular-nums'>{percent(skill.score)}</span>
              <StatusBadge
                tone={levelTone(skill.level_name, skill.counts_as_achieved)}
                label={skill.level_name ?? 'Not assessed yet'}
              />
              {canToggle && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : (skill.skill_uuid ?? null))}
                >
                  {isOpen ? 'Hide evidence' : `Evidence (${history.length})`}
                  <ChevronDown
                    className={cn('size-4 transition-transform', isOpen && 'rotate-180')}
                  />
                </Button>
              )}
            </div>
            {audience === 'learner' && skill.counts_as_achieved && walletHref && (
              <Link
                href={walletHref}
                className='text-primary inline-flex items-center gap-1.5 text-xs font-semibold'
              >
                <ShieldCheck className='size-3.5' /> Verified in your Skills Wallet
              </Link>
            )}
            {isOpen && <EvidenceTable history={history} />}
          </div>
        );
      })}
      <p className='text-muted-foreground text-xs'>
        {audience === 'learner'
          ? 'Achieved skills are added to your Skills Wallet as verified. Open a skill there to see every piece of evidence.'
          : 'Evidence comes from graded rubric criteria and assessments linked to each skill. A regrade replaces the earlier score; both stay listed.'}
      </p>
    </section>
  );
}

/** Every graded piece of evidence for one skill, regrades included. */
export function EvidenceTable({ history }: { history: ProgramReportEvidence[] }) {
  return (
    <div className='overflow-x-auto rounded-md border' data-testid='evidence-table'>
      <table className='w-full min-w-[560px] text-sm'>
        <thead className='bg-muted/50 text-muted-foreground text-left text-xs'>
          <tr>
            <th className='px-3 py-2 font-medium'>Graded</th>
            <th className='px-3 py-2 font-medium'>From</th>
            <th className='px-3 py-2 font-medium'>Evidence</th>
            <th className='px-3 py-2 font-medium'>Level</th>
            <th className='px-3 py-2 font-medium'>Graded by</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item, index) => {
            const note = evidenceNote(item, history);
            return (
              <tr
                key={`${item.course_assessment_uuid}-${String(item.graded_at)}-${index}`}
                className={cn('border-t', item.superseded && 'text-muted-foreground line-through')}
                data-superseded={item.superseded ? 'true' : undefined}
              >
                <td className='px-3 py-2 whitespace-nowrap'>{shortDate(item.graded_at)}</td>
                <td className='px-3 py-2'>
                  <div>{evidenceSource(item)}</div>
                  {note && <div className='text-xs no-underline'>{note}</div>}
                </td>
                <td className='px-3 py-2 tabular-nums'>{percent(item.score)}</td>
                <td className='px-3 py-2'>{item.level_name ?? '—'}</td>
                <td className='px-3 py-2'>{item.graded_by_name ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The latest remark, with earlier ones a click away. */
export function ProgramRemarksList({ remarks }: { remarks: ProgramRemark[] }) {
  const [showEarlier, setShowEarlier] = useState(false);
  const ordered = useMemo(
    () =>
      [...remarks].sort(
        (a, b) => new Date(b.created_date ?? 0).getTime() - new Date(a.created_date ?? 0).getTime()
      ),
    [remarks]
  );
  const [latest, ...earlier] = ordered;
  const shown = showEarlier ? ordered : latest ? [latest] : [];

  return (
    <section className='flex flex-col gap-3' aria-label='Progress remarks'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h3 className='text-sm font-semibold'>Progress remarks</h3>
        {latest?.next_review_date && (
          <span className='text-muted-foreground text-xs'>
            Next review {shortDate(latest.next_review_date)}
          </span>
        )}
      </div>
      {ordered.length === 0 && <p className='text-muted-foreground text-sm'>No remarks yet.</p>}
      {shown.map(remark => (
        <RemarkArticle key={remark.uuid} remark={remark} />
      ))}
      {earlier.length > 0 && (
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='self-start'
          aria-expanded={showEarlier}
          onClick={() => setShowEarlier(value => !value)}
        >
          {showEarlier
            ? `Hide earlier ${earlier.length === 1 ? 'remark' : 'remarks'}`
            : `Show ${earlier.length} earlier ${earlier.length === 1 ? 'remark' : 'remarks'}`}
        </Button>
      )}
      <p className='text-muted-foreground text-xs'>
        Earlier remarks are kept. Only the learner&apos;s class instructor can add one.
      </p>
    </section>
  );
}

const REMARK_PARTS = [
  { key: 'strengths', label: 'Strengths' },
  { key: 'improvements', label: 'Areas to improve' },
  { key: 'recommendations', label: 'Recommendations' },
] as const;

export function RemarkArticle({ remark }: { remark: ProgramRemark }) {
  return (
    <article data-testid='programme-remark' className='flex flex-col gap-3 rounded-md border p-4'>
      <div className='flex flex-wrap items-baseline justify-between gap-2 text-sm'>
        <span className='font-semibold'>{remark.author_name ?? 'Instructor'}</span>
        <span className='text-muted-foreground text-xs'>{shortDate(remark.created_date)}</span>
      </div>
      {REMARK_PARTS.map(part =>
        remark[part.key] ? (
          <div key={part.key} className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-xs font-semibold'>{part.label}</span>
            <RichTextRenderer htmlString={remark[part.key] ?? ''} />
          </div>
        ) : null
      )}
      {remark.next_review_date && (
        <span className='text-muted-foreground text-xs'>
          Next review {shortDate(remark.next_review_date)}
        </span>
      )}
    </article>
  );
}
