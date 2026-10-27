'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentsByIds } from '@/hooks/use-batched-lookups';
import { resultLabel } from '@/lib/grades';
import { STALE_TIMES } from '@/lib/query-client';
import { getClassProgrammeProgressOptions } from '@/services/client/@tanstack/react-query.gen';
import { percent } from './use-program-report';

/** A programme class's learners with their programme marks and skill levels, or per-skill attainment. */
export function ClassProgrammeProgress({
  classUuid,
  studentHref,
}: {
  classUuid: string;
  studentHref?: (studentUuid: string) => string;
}) {
  const [view, setView] = useState<'learners' | 'skills'>('learners');
  const query = useQuery({
    ...getClassProgrammeProgressOptions({ path: { classUuid } }),
    enabled: Boolean(classUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const progress = query.data?.data;
  const learners = progress?.learners ?? [];
  const { studentMap } = useStudentsByIds(learners.map(learner => learner.student_uuid ?? ''));

  if (query.isLoading) return <Skeleton className='h-48 w-full' />;
  if (query.isError || !progress)
    return (
      <EmptyState
        variant='compact'
        title='No programme for this class'
        description="This class's course isn't part of a programme."
      />
    );

  const skills = progress.skills ?? [];
  return (
    <section className='space-y-4' aria-label='Programme progress' data-testid='class-programme'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-base font-semibold'>{progress.program_title}</h3>
        <div role='group' aria-label='View' className='flex gap-2'>
          <Button
            type='button'
            size='sm'
            variant={view === 'learners' ? 'default' : 'outline'}
            aria-pressed={view === 'learners'}
            onClick={() => setView('learners')}
          >
            Learners
          </Button>
          <Button
            type='button'
            size='sm'
            variant={view === 'skills' ? 'default' : 'outline'}
            aria-pressed={view === 'skills'}
            onClick={() => setView('skills')}
          >
            Skill attainment
          </Button>
        </div>
      </div>
      {view === 'learners' ? (
        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full min-w-[760px] text-sm'>
            <thead className='bg-muted/50 text-left'>
              <tr>
                <th className='px-3 py-2'>Learner</th>
                <th className='px-3 py-2'>Programme mark</th>
                <th className='px-3 py-2'>Mandatory passed</th>
                {skills.map(skill => (
                  <th key={skill.skill_uuid} className='px-3 py-2'>
                    {skill.skill_name}
                  </th>
                ))}
                <th className='px-3 py-2'>Result</th>
              </tr>
            </thead>
            <tbody>
              {learners.map(learner => {
                const student = studentMap[learner.student_uuid ?? ''];
                const name = student?.full_name ?? 'Learner';
                return (
                  <tr key={learner.student_uuid} className='border-t'>
                    <td className='px-3 py-2 font-medium'>
                      {studentHref && learner.student_uuid ? (
                        <Link href={studentHref(learner.student_uuid)}>{name}</Link>
                      ) : (
                        name
                      )}
                    </td>
                    <td className='px-3 py-2 font-mono'>
                      {percent(learner.final_grade)}
                      {learner.final_grade_provisional ? ' prov.' : ''}
                    </td>
                    <td className='px-3 py-2'>
                      {learner.mandatory_passed} of {learner.mandatory_total}
                    </td>
                    {(learner.skill_levels ?? []).map(level => (
                      <td key={level.skill_uuid} className='px-3 py-2'>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${level.counts_as_achieved ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted text-muted-foreground'}`}
                        >
                          {level.level_name ?? '—'}
                        </span>
                      </td>
                    ))}
                    <td className='px-3 py-2'>{resultLabel(learner.result_status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {learners.length === 0 && (
            <p className='text-muted-foreground p-4 text-sm'>
              No learners in this class are enrolled in the programme.
            </p>
          )}
        </div>
      ) : (
        <div className='space-y-4'>
          {skills.map(skill => {
            const total =
              (skill.achieved ?? 0) +
                (skill.developing ?? 0) +
                (skill.not_achieved ?? 0) +
                (skill.no_evidence ?? 0) || 1;
            const width = (count?: number) => `${((count ?? 0) / total) * 100}%`;
            return (
              <div key={skill.skill_uuid} className='space-y-1.5'>
                <div className='flex justify-between text-sm'>
                  <span className='font-medium'>{skill.skill_name}</span>
                  <span className='text-muted-foreground'>
                    {skill.achieved} achieved · {Math.round(((skill.achieved ?? 0) / total) * 100)}%
                  </span>
                </div>
                <div
                  role='img'
                  aria-label={`${skill.skill_name}: ${skill.achieved} achieved, ${skill.developing} developing, ${skill.not_achieved} not achieved, ${skill.no_evidence} no evidence`}
                  className='bg-muted flex h-4 overflow-hidden rounded'
                >
                  <div className='bg-primary h-full' style={{ width: width(skill.achieved) }} />
                  <div
                    className='bg-primary/40 h-full'
                    style={{ width: width(skill.developing) }}
                  />
                  <div
                    className='bg-warning/60 h-full'
                    style={{ width: width(skill.not_achieved) }}
                  />
                </div>
              </div>
            );
          })}
          <p className='text-muted-foreground text-xs'>
            Counts cover this class&apos;s learners only.
          </p>
        </div>
      )}
    </section>
  );
}
