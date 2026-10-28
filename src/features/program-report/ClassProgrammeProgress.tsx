'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CircleCheck, CircleX, Clock, Layers3, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StatCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentsByIds } from '@/hooks/use-batched-lookups';
import { resultLabel } from '@/lib/grades';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { getClassProgrammeProgressOptions } from '@/services/client/@tanstack/react-query.gen';
import type { ClassProgrammeLearner, ClassProgrammeSkill } from '@/services/client/types.gen';
import { ProgramPills } from './LearnerProgrammesPanel';
import { levelTone, resultTone } from './report-model';
import { percent } from './use-program-report';

/** "3 achieved · 2 developing · 1 no evidence", zero counts left out. */
function attainmentCaption(skill: ClassProgrammeSkill) {
  const parts = [
    [skill.achieved, 'achieved'],
    [skill.developing, 'developing'],
    [skill.not_achieved, 'not achieved'],
    [skill.no_evidence, 'no evidence'],
  ]
    .filter(([count]) => Number(count ?? 0) > 0)
    .map(([count, label]) => `${count} ${label}`);
  return parts.length ? parts.join(' · ') : 'No learners yet';
}

/**
 * The class's Program tab: learners' program marks and skill levels, and how many have achieved
 * each skill. Handles a course that sits in several programs and a class with no program.
 */
export function ClassProgrammeProgress({
  classUuid,
  studentHref,
  classReportHref,
}: {
  classUuid: string;
  studentHref?: (learner: { userUuid: string; studentUuid: string }) => string;
  /** The class report grid, where the lesson marks behind each course final are. */
  classReportHref?: string;
}) {
  const [programUuid, setProgramUuid] = useState<string>();
  const query = useQuery({
    ...getClassProgrammeProgressOptions({
      path: { classUuid },
      query: programUuid ? { program_uuid: programUuid } : undefined,
    }),
    enabled: Boolean(classUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const progress = query.data?.success === false ? undefined : query.data?.data;
  const learners = progress?.status === 'READY' ? (progress.learners ?? []) : [];
  const { studentMap } = useStudentsByIds(learners.map(learner => learner.student_uuid ?? ''));

  if (query.isLoading) return <Skeleton className='h-48 w-full' />;
  if (query.isError || !progress)
    return (
      <Alert variant='destructive' data-testid='class-programme-error'>
        <AlertTriangle className='size-4' />
        <AlertTitle>Program progress didn&apos;t load</AlertTitle>
        <AlertDescription className='flex flex-wrap items-center justify-between gap-3'>
          <span>
            Something went wrong on our side. Your marks are safe. Try again; if it keeps failing,
            use the class report for course marks.
          </span>
          <Button type='button' variant='outline' size='sm' onClick={() => void query.refetch()}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );

  const options = (progress.programmes ?? []).map(option => ({
    id: option.program_uuid ?? '',
    label: option.title ?? 'Program',
  }));

  if (progress.status === 'NO_PROGRAMME')
    return (
      <section
        data-testid='class-programme-empty'
        className={cn(
          surfaceTheme.cardPadded,
          'flex flex-col items-center gap-3 py-10 text-center'
        )}
      >
        <span className='bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full'>
          <Layers3 className='size-6' />
        </span>
        <h2 className='text-lg font-semibold'>No learners here are in a program</h2>
        <p className='text-muted-foreground max-w-lg text-sm'>
          This class&apos;s course is not part of a program, or none of its learners enrolled
          through one. Course marks are on the class report.
        </p>
        {classReportHref && (
          <Button asChild variant='outline'>
            <Link href={classReportHref}>Open class report</Link>
          </Button>
        )}
      </section>
    );

  if (progress.status === 'PROGRAMME_CHOICE_REQUIRED')
    return (
      <section
        data-testid='class-programme-picker'
        className={cn(surfaceTheme.cardPadded, 'flex flex-col gap-3')}
      >
        <p className='text-sm'>
          This class&apos;s course is part of {options.length} programs. Pick one to see its
          progress for this class.
        </p>
        <ProgramPills
          label='Program'
          options={options}
          value={programUuid}
          onChange={setProgramUuid}
        />
      </section>
    );

  const skills = progress.skills ?? [];
  const count = (status: string) =>
    learners.filter(learner => (learner.result_status ?? 'IN_PROGRESS').toUpperCase() === status)
      .length;
  return (
    <div className='flex flex-col gap-4' data-testid='class-programme'>
      {options.length > 1 && (
        <section className={cn(surfaceTheme.cardPadded, 'flex flex-col gap-3')}>
          <p className='text-sm'>
            This class&apos;s course is part of {options.length} programs. Pick one to see its
            progress for this class.
          </p>
          <ProgramPills
            label='Program'
            options={options}
            value={progress.program_uuid}
            onChange={setProgramUuid}
          />
        </section>
      )}

      <div className={surfaceTheme.statGrid}>
        <StatCard label='Learners in the program' value={learners.length} icon={Users} />
        <StatCard label='Passed' value={count('PASSED')} icon={CircleCheck} tone='success' />
        <StatCard label='In progress' value={count('IN_PROGRESS')} icon={Clock} tone='neutral' />
        <StatCard label='Failed' value={count('FAILED')} icon={CircleX} tone='destructive' />
      </div>

      <section className={cn(surfaceTheme.cardPadded, 'flex flex-col gap-3')} aria-label='Learners'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-base font-semibold'>{progress.program_title} · Learners</h2>
            <span className='text-muted-foreground text-sm'>
              Program marks and skill levels for this class&apos;s learners. Open a learner to read
              the full report and write remarks.
            </span>
          </div>
          {classReportHref && (
            <Button asChild variant='outline' size='sm'>
              <Link href={classReportHref}>Class report (lesson marks)</Link>
            </Button>
          )}
        </div>
        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full min-w-[760px] text-sm'>
            <thead className='bg-muted/50 text-muted-foreground text-left text-xs'>
              <tr>
                <th className='px-3 py-2 font-medium'>Learner</th>
                <th className='px-3 py-2 font-medium'>Program mark</th>
                <th className='px-3 py-2 font-medium'>Mandatory passed</th>
                {skills.map(skill => (
                  <th key={skill.skill_uuid} className='px-3 py-2 font-medium'>
                    {skill.skill_name}
                  </th>
                ))}
                <th className='px-3 py-2 font-medium'>Result</th>
              </tr>
            </thead>
            <tbody>
              {learners.map(learner => (
                <LearnerRow
                  key={learner.student_uuid}
                  learner={learner}
                  name={studentMap[learner.student_uuid ?? '']?.full_name ?? 'Learner'}
                  skills={skills}
                  href={
                    studentHref && learner.user_uuid && learner.student_uuid
                      ? studentHref({
                          userUuid: learner.user_uuid,
                          studentUuid: learner.student_uuid,
                        })
                      : undefined
                  }
                />
              ))}
            </tbody>
          </table>
          {learners.length === 0 && (
            <p className='text-muted-foreground p-4 text-sm'>
              No learners in this class are enrolled in the program.
            </p>
          )}
        </div>
        <p className='text-muted-foreground text-xs'>
          A dash means no evidence yet. A skill with no linked assessment can&apos;t be assessed
          until the program is updated.
        </p>
      </section>

      <section
        className={cn(surfaceTheme.cardPadded, 'flex flex-col gap-4')}
        aria-label='Skill attainment'
      >
        <div className='flex flex-col gap-1'>
          <h2 className='text-base font-semibold'>Skill attainment</h2>
          <span className='text-muted-foreground text-sm'>
            Share of this class&apos;s {learners.length} learners who have achieved each skill.
          </span>
        </div>
        {skills.length === 0 && (
          <p className='text-muted-foreground text-sm'>This program has no target skills yet.</p>
        )}
        {skills.map(skill => {
          const total =
            Number(skill.achieved ?? 0) +
            Number(skill.developing ?? 0) +
            Number(skill.not_achieved ?? 0) +
            Number(skill.no_evidence ?? 0);
          const share = total ? Math.round((Number(skill.achieved ?? 0) / total) * 100) : 0;
          const unassessed = total > 0 && Number(skill.no_evidence ?? 0) === total;
          const caption = unassessed
            ? 'Not assessed yet. No graded evidence for this skill so far.'
            : attainmentCaption(skill);
          return (
            <div
              key={skill.skill_uuid}
              className='grid items-center gap-2 sm:grid-cols-[220px_1fr_56px]'
              data-testid='skill-attainment'
            >
              <span className='text-sm font-medium'>{skill.skill_name}</span>
              <div className='flex flex-col gap-1'>
                <div
                  role='img'
                  aria-label={`${skill.skill_name}: ${caption}`}
                  className='bg-muted h-2 overflow-hidden rounded-full'
                >
                  <div className='bg-primary h-2' style={{ width: `${share}%` }} />
                </div>
                <span className='text-muted-foreground text-xs'>{caption}</span>
              </div>
              <span className='text-right text-sm font-semibold tabular-nums'>{share}%</span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function LearnerRow({
  learner,
  name,
  skills,
  href,
}: {
  learner: ClassProgrammeLearner;
  name: string;
  skills: ClassProgrammeSkill[];
  href?: string;
}) {
  const levels = new Map(
    (learner.skill_levels ?? []).map(level => [level.skill_uuid ?? '', level])
  );
  return (
    <tr className='border-t'>
      <td className='px-3 py-2 font-medium'>
        {href ? (
          <Link href={href} className='text-primary hover:underline'>
            {name}
          </Link>
        ) : (
          name
        )}
      </td>
      <td className='px-3 py-2'>
        <div className='font-semibold tabular-nums'>{percent(learner.final_grade)}</div>
        <div className='text-muted-foreground text-xs'>
          {learner.final_grade == null
            ? 'No course result yet'
            : learner.final_grade_provisional
              ? 'Provisional'
              : 'Final'}
        </div>
      </td>
      <td className='px-3 py-2 tabular-nums'>
        {learner.mandatory_passed ?? 0} of {learner.mandatory_total ?? 0}
      </td>
      {skills.map(skill => {
        const level = levels.get(skill.skill_uuid ?? '');
        return (
          <td key={skill.skill_uuid} className='px-3 py-2'>
            {level?.level_name ? (
              <StatusBadge
                tone={levelTone(level.level_name, level.counts_as_achieved)}
                label={level.level_name}
              />
            ) : (
              <span className='text-muted-foreground'>—</span>
            )}
          </td>
        );
      })}
      <td className='px-3 py-2'>
        <StatusBadge
          tone={resultTone(learner.result_status)}
          label={resultLabel(learner.result_status)}
        />
      </td>
    </tr>
  );
}
