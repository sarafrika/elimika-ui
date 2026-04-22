import { BadgeCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import type { SharedSkill } from '../types';

type TopSkillsPanelProps = {
  skills: SharedSkill[];
};

export function TopSkillsPanel({ skills }: TopSkillsPanelProps) {
  const topSkills = skills.slice(0, 4);

  return (
    <article className='border-border/60 bg-card rounded-lg border p-3 shadow-sm'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h2 className='text-foreground text-sm font-semibold sm:text-base'>Top Skills</h2>
        <span className='text-muted-foreground text-[10px]'>Credential strength</span>
      </div>

      <div className='space-y-3'>
        <div className='relative mx-auto grid aspect-square w-full max-w-52 place-items-center'>
          <div className='border-border absolute inset-[7%] rounded-full border' />
          <div className='border-border absolute inset-[22%] rounded-full border' />
          <div className='border-border absolute inset-[37%] rounded-full border' />
          <div
            className='bg-primary/20 border-primary/70 absolute inset-[16%] border'
            style={{
              clipPath: 'polygon(50% 4%, 91% 29%, 79% 82%, 23% 82%, 8% 29%)',
            }}
          />
          <div className='bg-card text-primary relative grid size-11 place-items-center rounded-full border shadow-sm'>
            <BadgeCheck className='size-5' aria-hidden='true' />
          </div>
          <span className='text-muted-foreground absolute top-0 text-[10px]'>Web Design</span>
          <span className='text-muted-foreground absolute top-[42%] right-0 text-[10px]'>
            Strategy
          </span>
          <span className='text-muted-foreground absolute right-4 bottom-2 text-[10px]'>Data</span>
          <span className='text-muted-foreground absolute bottom-2 left-2 text-[10px]'>
            Marketing
          </span>
        </div>

        <div className='min-w-0 space-y-2'>
          <p className='text-foreground text-xs font-semibold sm:text-sm'>Top Skills</p>
          {topSkills.length > 0 ? (
            topSkills.map(skill => (
              <div
                key={skill.id}
                className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3'
              >
                <div className='min-w-0'>
                  <div className='mb-1 flex items-center justify-between gap-2'>
                    <span className='text-foreground truncate text-xs'>{skill.name}</span>
                    <span className='text-muted-foreground text-[10px]'>{skill.version}</span>
                  </div>
                  <Progress value={skill.score} className='h-1 rounded-sm' />
                </div>
                <span className='text-muted-foreground text-[10px]'>{skill.score}%</span>
              </div>
            ))
          ) : (
            <p className='text-muted-foreground text-xs'>Skills you add will appear here.</p>
          )}
        </div>

        <Button type='button' variant='outline' size='sm' className='h-8 w-full rounded-md text-xs'>
          View Verified Skills
        </Button>
      </div>
    </article>
  );
}
