'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ProgramReport } from '@/services/client/types.gen';
import { percent, shortDate } from './use-program-report';

/** Skill levels with the evidence history behind each one. */
export function ProgramSkillsView({
  report,
  audience = 'learner',
}: {
  report: ProgramReport;
  audience?: 'learner' | 'instructor';
}) {
  const skills = report.skills ?? [];
  const [picked, setPicked] = useState<string>();
  const selected = skills.find(skill => skill.skill_uuid === picked) ?? skills[0];
  if (!selected)
    return (
      <p className='text-muted-foreground text-sm'>This programme has no target skills yet.</p>
    );
  const history = selected.history ?? [];

  return (
    <div className='flex flex-wrap items-start gap-4' data-testid='programme-skills'>
      <ul className='min-w-[260px] flex-1 space-y-2' aria-label='Skills'>
        {skills.map(skill => {
          const active = skill.skill_uuid === selected.skill_uuid;
          return (
            <li key={skill.skill_uuid}>
              <Button
                type='button'
                variant='outline'
                aria-pressed={active}
                onClick={() => setPicked(skill.skill_uuid)}
                className={`h-auto min-h-14 w-full justify-between gap-2 text-left ${active ? 'border-primary bg-primary/5' : ''}`}
              >
                <span className='flex flex-col'>
                  <span className='font-medium'>{skill.skill_name}</span>
                  <span className='text-muted-foreground text-xs'>
                    {skill.score == null
                      ? 'Not assessed yet'
                      : `Latest ${percent(skill.score)} · ${shortDate(skill.graded_at)}`}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${skill.counts_as_achieved ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                >
                  {skill.level_name ?? 'No evidence yet'}
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
      <div className='min-w-0 flex-[2] basis-[480px] space-y-3'>
        <h3 className='text-lg font-semibold'>{selected.skill_name}</h3>
        {selected.counts_as_achieved && audience === 'learner' && (
          <p role='status' className='bg-primary/10 text-primary rounded-md px-3 py-2 text-sm'>
            In your skills wallet as verified · from {report.program_title}
          </p>
        )}
        {history.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No evidence yet.</p>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <table className='w-full min-w-[560px] text-sm'>
              <thead className='bg-muted/50 text-left'>
                <tr>
                  <th className='px-3 py-2'>Date</th>
                  <th className='px-3 py-2'>From</th>
                  <th className='px-3 py-2'>Evidence</th>
                  <th className='px-3 py-2'>Level</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr
                    key={`${item.course_assessment_uuid}-${index}`}
                    className={`border-t ${item.superseded ? 'text-muted-foreground' : ''}`}
                  >
                    <td className='px-3 py-2 whitespace-nowrap'>{shortDate(item.graded_at)}</td>
                    <td className='px-3 py-2'>
                      {item.source_title}
                      {item.superseded && <span className='ml-2 text-xs'>(regraded)</span>}
                    </td>
                    <td className='px-3 py-2 font-mono'>{percent(item.score)}</td>
                    <td className='px-3 py-2'>{item.level_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className='text-muted-foreground text-xs'>
          The level comes from the most recent graded work. If an instructor corrects a grade, the
          change is kept here.
        </p>
      </div>
    </div>
  );
}
