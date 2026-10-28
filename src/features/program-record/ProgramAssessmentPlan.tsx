'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { Check, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import {
  getCourseAssessmentsOptions,
  getProgramCoursesOptions,
  getProgramSkillsOptions,
  getTrainingProgramByUuidOptions,
  listSkillLevelsOptions,
  searchProgramCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ProgramSkillMapping } from '@/services/client/types.gen';

const MAX_COURSES_WITH_COMPONENTS = 40;
const PILL = 'whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold';
const EDITOR_HREF = '/dashboard/course-creator/courses/create-program';
const COURSE_GRADING_HREF = '/dashboard/course-creator/course-management/create-new-course?id=';

type PlanCheck = {
  key: string;
  title: string;
  detail: string;
  ok: boolean;
  /** Where "Fix" goes for an editor; a warning-only check still offers it. */
  fix?: { step: number } | { href: string };
};

const fmt = (value: number) => String(Math.round(value * 100) / 100);

/**
 * The program's assessment plan: weights, pass rule, skills and what still blocks
 * publishing. Course components only load when `withComponents` is set (the tab is open).
 */
export function useProgramAssessmentPlan(
  programUuid: string,
  { enabled = true, withComponents = true }: { enabled?: boolean; withComponents?: boolean } = {}
) {
  const on = enabled && Boolean(programUuid);
  const programQ = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid } }),
    enabled: on,
    staleTime: STALE_TIMES.entity,
  });
  const coursesQ = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid } }),
    enabled: on,
    staleTime: STALE_TIMES.reference,
  });
  const linksQ = useQuery({
    ...searchProgramCoursesOptions({
      query: { searchParams: { programUuid }, pageable: { page: 0, size: 100 } },
    }),
    enabled: on,
    staleTime: STALE_TIMES.entity,
  });
  const skillsQ = useQuery({
    ...getProgramSkillsOptions({ path: { programUuid } }),
    enabled: on,
    staleTime: STALE_TIMES.entity,
  });
  const levelsQ = useQuery({
    ...listSkillLevelsOptions(),
    enabled: on && withComponents,
    staleTime: STALE_TIMES.reference,
  });

  const links = useMemo(
    () =>
      linksQ.data?.error || linksQ.data?.success === false
        ? []
        : (linksQ.data?.data?.content ?? []).filter(row => row.program_uuid === programUuid),
    [linksQ.data, programUuid]
  );
  const courses = useMemo(
    () =>
      coursesQ.data?.error || coursesQ.data?.success === false ? [] : (coursesQ.data?.data ?? []),
    [coursesQ.data]
  );
  const ordered = useMemo(
    () => [...links].sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0)),
    [links]
  );
  const components = useQueries({
    queries: ordered.slice(0, MAX_COURSES_WITH_COMPONENTS).map(link => ({
      ...getCourseAssessmentsOptions({
        path: { courseUuid: link.course_uuid },
        query: { pageable: { size: 50 } },
      }),
      enabled: on && withComponents,
      staleTime: STALE_TIMES.entity,
    })),
  });

  const program = programQ.data?.data;
  const skills = useMemo(() => skillsQ.data?.data ?? [], [skillsQ.data]);
  const levels = levelsQ.data?.data ?? [];
  const componentsLoaded = withComponents && components.every(query => !query.isLoading);

  const plan = useMemo(() => {
    const byUuid = new Map(courses.map(course => [course.uuid ?? '', course]));
    const rows = ordered.map((link, index) => {
      const course = byUuid.get(link.course_uuid);
      const parts = components[index]?.data?.data?.content;
      const componentTotal = parts?.reduce(
        (sum, part) => sum + Number(part.weight_percentage ?? 0),
        0
      );
      return {
        courseUuid: link.course_uuid,
        title: course?.name ?? 'Course',
        code: course?.course_code ?? '',
        required: link.is_required !== false,
        weight: link.weight_percentage == null ? undefined : Number(link.weight_percentage),
        passMark: course?.pass_mark == null ? undefined : Number(course.pass_mark),
        componentCount: parts?.length ?? 0,
        componentTotal,
      };
    });
    const mandatory = rows.filter(row => row.required);
    const mandatoryTotal = mandatory.reduce((sum, row) => sum + (row.weight ?? 0), 0);
    const weightsOk = mandatory.length === 0 || Math.round(mandatoryTotal * 100) === 10000;
    const passMark = program?.pass_mark == null ? undefined : Number(program.pass_mark);
    const unlinked = skills.filter(skill => !skill.ready);
    const off = rows.filter(
      row => row.componentCount > 0 && Math.round(row.componentTotal ?? 0) !== 100
    );
    const titleOf = (uuid?: string) => (uuid ? byUuid.get(uuid)?.name : undefined) ?? 'Course';

    const checks: PlanCheck[] = [
      {
        key: 'weights',
        title: 'Mandatory weights total 100%',
        detail:
          mandatory.length === 0
            ? 'No mandatory courses'
            : weightsOk
              ? mandatory.map(row => fmt(row.weight ?? 0)).join(' + ')
              : `They total ${fmt(mandatoryTotal)}%`,
        ok: weightsOk,
        fix: { step: 2 },
      },
      {
        key: 'pass-mark',
        title: 'Program pass mark set',
        detail: passMark == null ? 'No pass mark yet' : `${fmt(passMark)}%`,
        ok: passMark != null,
        fix: { step: 2 },
      },
      {
        key: 'skills',
        title: 'Every skill has a link',
        detail:
          skills.length === 0
            ? 'No target skills chosen'
            : unlinked.length === 0
              ? `${skills.length} of ${skills.length} skills linked`
              : `${unlinked.map(skill => skill.skill_name).join(', ')} ${unlinked.length === 1 ? 'has' : 'have'} none`,
        ok: unlinked.length === 0,
        fix: { step: 3 },
      },
    ];
    if (withComponents)
      checks.push({
        key: 'components',
        title: "Every course's components total 100%",
        detail:
          off.length === 0
            ? componentsLoaded
              ? 'All courses total 100%'
              : 'Checking course grading…'
            : `${off.map(row => `${row.title} totals ${fmt(row.componentTotal ?? 0)}%`).join('; ')}. Fixed in the course's grading; a warning only, it doesn't block publishing.`,
        ok: off.length === 0,
        fix: off[0]
          ? { href: `${COURSE_GRADING_HREF}${encodeURIComponent(off[0].courseUuid)}` }
          : undefined,
      });

    const skillRows = skills.map(skill => {
      const groups = new Map<string, ProgramSkillMapping[]>();
      for (const mapping of skill.mappings ?? []) {
        const list = groups.get(mapping.course_assessment_uuid) ?? [];
        list.push(mapping);
        groups.set(mapping.course_assessment_uuid, list);
      }
      const from = [...groups.values()]
        .map(list => {
          const first = list[0];
          const criteria = list.filter(row => row.rubric_criteria_uuid);
          const detail = criteria.length
            ? criteria
                .map(
                  row =>
                    `${row.rubric_criteria_name ?? 'Criterion'} ${fmt(Number(row.share_percentage))}`
                )
                .join(', ')
            : 'whole score';
          return `${titleOf(first?.course_uuid)} · ${first?.course_assessment_title ?? 'Assessment'} (${detail})`;
        })
        .join(' · ');
      return {
        uuid: skill.skill_uuid ?? skill.skill_name ?? '',
        name: skill.skill_name ?? 'Skill',
        from: from || 'No assessment linked yet',
        ready: skill.ready === true,
      };
    });

    return {
      rows,
      mandatoryCount: mandatory.length,
      mandatoryTotal,
      passMark,
      skills: skillRows,
      checks,
      fixCount: checks.filter(check => !check.ok).length,
    };
  }, [courses, ordered, components, program?.pass_mark, skills, withComponents, componentsLoaded]);

  const scale = [...levels]
    .sort((a, b) => Number(a.min_percentage) - Number(b.min_percentage))
    .map(level => `${level.name} from ${fmt(Number(level.min_percentage))}%`)
    .join(', ');

  return {
    ...plan,
    scale,
    loading: programQ.isLoading || coursesQ.isLoading || linksQ.isLoading || skillsQ.isLoading,
    error: programQ.isError || linksQ.isError || skillsQ.isError,
    retry: () => {
      void programQ.refetch();
      void linksQ.refetch();
      void skillsQ.refetch();
    },
  };
}

export type ProgramAssessmentPlan = ReturnType<typeof useProgramAssessmentPlan>;

/** The Assessment tab for the people who build and approve a program. */
export function ProgramAssessmentPlanPanel({
  programUuid,
  plan,
  canEdit,
}: {
  programUuid: string;
  plan: ProgramAssessmentPlan;
  /** The course creator gets edit and Fix links; an admin reads the same summary. */
  canEdit: boolean;
}) {
  const editHref = (step: number) =>
    `${EDITOR_HREF}?id=${encodeURIComponent(programUuid)}&step=${step}`;

  if (plan.loading) return <Skeleton className='h-72 w-full rounded-2xl' />;
  if (plan.error)
    return (
      <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-6 text-sm'>
        Unable to load this program&apos;s assessment plan.
        <Button type='button' variant='outline' onClick={plan.retry}>
          Try again
        </Button>
      </div>
    );

  const done = plan.checks.filter(check => check.ok).length;

  return (
    <div data-testid='assessment-plan' className='flex flex-wrap items-start gap-3.5'>
      <div className='flex min-w-0 flex-[2_1_640px] flex-col gap-3.5'>
        <section
          aria-label='Pass rule and weights'
          className='bg-card flex flex-col gap-3 rounded-2xl border p-5'
        >
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-lg font-semibold'>Pass rule &amp; weights</h2>
              <span className='text-muted-foreground text-sm'>
                {plan.passMark == null ? (
                  'No program pass mark yet. Learners also need every mandatory course passed.'
                ) : (
                  <>
                    Pass with a program mark of at least <strong>{fmt(plan.passMark)}%</strong> and
                    every mandatory course passed.
                  </>
                )}
              </span>
            </div>
            {canEdit && (
              <Link
                href={editHref(2)}
                className='text-primary text-sm font-semibold hover:underline'
              >
                Edit pass rule &amp; weights
              </Link>
            )}
          </div>
          {plan.rows.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No courses in this program yet.</p>
          ) : (
            <div className='overflow-x-auto rounded-xl border'>
              <table className='w-full min-w-[560px] border-collapse text-[13px]'>
                <thead>
                  <tr className='bg-muted text-left'>
                    <th className='px-3 py-2.5'>Course</th>
                    <th className='px-3 py-2.5'>Counts</th>
                    <th className='px-3 py-2.5 text-right'>Weight</th>
                    <th className='px-3 py-2.5 text-right'>Course pass mark</th>
                    <th className='px-3 py-2.5'>Course components</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.rows.map(row => {
                    const off =
                      row.componentCount > 0 && Math.round(row.componentTotal ?? 0) !== 100;
                    return (
                      <tr key={row.courseUuid} className='border-t'>
                        <td className='px-3 py-2.5'>
                          <div className='font-semibold'>{row.title}</div>
                          {row.code && (
                            <div className='text-muted-foreground font-mono text-xs'>
                              {row.code}
                            </div>
                          )}
                        </td>
                        <td className='px-3 py-2.5'>{row.required ? 'Mandatory' : 'Optional'}</td>
                        <td className='px-3 py-2.5 text-right font-mono'>
                          {row.required && row.weight != null ? `${fmt(row.weight)}%` : '—'}
                        </td>
                        <td className='px-3 py-2.5 text-right font-mono'>
                          {row.passMark == null ? '—' : `${fmt(row.passMark)}%`}
                        </td>
                        <td className='px-3 py-2.5'>
                          {row.componentTotal == null ? (
                            <span className='text-muted-foreground'>…</span>
                          ) : row.componentCount === 0 ? (
                            <span className='text-muted-foreground'>No graded components</span>
                          ) : off ? (
                            <span className={cn(PILL, 'bg-warning/10 text-warning')}>
                              Total {fmt(row.componentTotal)}% · fix in the course
                            </span>
                          ) : (
                            <span className='text-foreground/80'>Total 100%</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className='bg-secondary border-t-2'>
                    <td colSpan={2} className='px-3 py-2.5 font-semibold'>
                      Mandatory total
                    </td>
                    <td className='px-3 py-2.5 text-right font-mono font-semibold'>
                      {fmt(plan.mandatoryTotal)}%
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-label='Skills' className='bg-card flex flex-col gap-3 rounded-2xl border p-5'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='flex flex-col gap-1'>
              <h2 className='text-lg font-semibold'>Skills</h2>
              <span className='text-muted-foreground text-sm'>
                {plan.scale
                  ? `Levels use the platform scale: ${plan.scale}.`
                  : 'Levels use the platform skill scale.'}
              </span>
            </div>
            {canEdit && (
              <Link
                href={editHref(3)}
                className='text-primary text-sm font-semibold hover:underline'
              >
                Edit skills
              </Link>
            )}
          </div>
          {plan.skills.length === 0 ? (
            <p className='text-muted-foreground text-sm'>This program has no target skills.</p>
          ) : (
            plan.skills.map(skill => (
              <div
                key={skill.uuid}
                className='flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-3'
              >
                <div className='flex min-w-0 flex-[1_1_300px] flex-col gap-0.5'>
                  <span className='text-sm font-semibold'>{skill.name}</span>
                  <span className='text-muted-foreground text-xs'>{skill.from}</span>
                </div>
                <span
                  className={cn(
                    PILL,
                    skill.ready ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                  )}
                >
                  {skill.ready ? 'Ready' : 'Needs links'}
                </span>
              </div>
            ))
          )}
        </section>
      </div>

      <section
        aria-label='Ready to publish'
        className='bg-card flex flex-[1_1_320px] flex-col gap-2.5 rounded-2xl border p-5'
      >
        <div className='flex items-baseline justify-between gap-2'>
          <h2 className='text-base font-semibold'>Ready to publish</h2>
          <span className='text-muted-foreground text-sm'>
            {done} of {plan.checks.length} done
          </span>
        </div>
        {plan.checks.map(check => {
          const href = !check.fix
            ? undefined
            : 'step' in check.fix
              ? editHref(check.fix.step)
              : check.fix.href;
          return (
            <div
              key={check.key}
              data-testid={`check-${check.key}`}
              className='flex items-start gap-2.5 rounded-[10px] border px-3 py-2.5'
            >
              <span
                aria-hidden
                className={cn(
                  'inline-flex size-6 shrink-0 items-center justify-center rounded-full',
                  check.ok ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                )}
              >
                {check.ok ? <Check className='size-3.5' /> : <CircleAlert className='size-3.5' />}
              </span>
              <div className='flex flex-1 flex-col gap-0.5'>
                <span className='text-sm font-semibold'>
                  {check.title}
                  <span className='sr-only'>{check.ok ? ' (done)' : ' (to fix)'}</span>
                </span>
                <span className='text-muted-foreground text-sm'>{check.detail}</span>
              </div>
              {canEdit && !check.ok && href && (
                <Button asChild variant='outline' size='sm' className='h-9'>
                  <Link href={href} aria-label={`Fix: ${check.title}`}>
                    Fix
                  </Link>
                </Button>
              )}
            </div>
          );
        })}
        <div
          role='note'
          className='bg-primary/5 border-primary/15 text-primary rounded-xl border px-3.5 py-3 text-sm'
        >
          This tab shows the plan. Learner results are seen by the learner, their guardians and
          their class instructors. Platform admins see this same summary.
        </div>
      </section>
    </div>
  );
}
