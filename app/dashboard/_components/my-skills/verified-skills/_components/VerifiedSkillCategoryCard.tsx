import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import type { VerifiedSkill, VerifiedSkillCategory } from '../types';

type VerifiedSkillCategoryCardProps = {
  category: VerifiedSkillCategory;
};

const toneClassNames = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-muted text-muted-foreground',
} as const;

export function VerifiedSkillCategoryCard({ category }: VerifiedSkillCategoryCardProps) {
  const CategoryIcon = category.skills[0]?.icon;
  const featured = category.skills.slice(0, 3);
  const supporting = category.skills.slice(3);

  return (
    <article className='border-border/60 bg-card self-start rounded-lg border p-3 shadow-sm'>
      <div className='mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <div className='flex min-w-0 items-center gap-2'>
            <span className='bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-md'>
              {CategoryIcon ? <CategoryIcon className='size-4' /> : null}
            </span>
            <div className='min-w-0'>
              <h2 className='text-foreground truncate text-sm font-semibold sm:text-base'>
                {category.title}
              </h2>
              <p
                className={cn(
                  'text-[10px] font-medium sm:text-xs',
                  category.level === 'Advanced'
                    ? 'text-primary'
                    : category.level === 'Intermediate'
                      ? 'text-warning'
                      : 'text-muted-foreground'
                )}
              >
                {category.level}
              </p>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2 sm:justify-end'>
          <Button variant='outline' size='sm' className='h-7 rounded-md text-xs'>
            Details
          </Button>
          <Button variant='outline' size='sm' className='h-7 rounded-md text-xs'>
            Enroll
          </Button>
        </div>
      </div>

      <div className='mb-3 flex items-center gap-1.5'>
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'size-2 rounded-full',
              index < category.indicators ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      <div className='grid items-start gap-2 md:grid-cols-3'>
        {featured.map(skill => (
          <VerifiedSkillPill key={skill.id} skill={skill} />
        ))}
      </div>

      {supporting.length > 0 ? (
        <div className='mt-2 flex flex-wrap items-center gap-2'>
          {supporting.map(skill => (
            <button
              key={skill.id}
              type='button'
              className='bg-muted text-primary hover:bg-muted/80 flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium'
            >
              <ExternalLink className='size-3.5 shrink-0' />
              <span className='truncate'>
                {skill.name}
                {skill.hours ? ` (${skill.hours})` : ''}
              </span>
              <span className='text-muted-foreground'>Enroll</span>
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function VerifiedSkillPill({ skill }: { skill: VerifiedSkill }) {
  const Icon = skill.icon;

  return (
    <div className='border-border/60 bg-background min-w-0 self-start rounded-md border p-2'>
      <div className='mb-2 flex items-start gap-2'>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-md',
            toneClassNames[skill.tone]
          )}
        >
          <Icon className='size-4' />
        </span>
        <div className='min-w-0'>
          <p className='text-foreground truncate text-xs font-medium sm:text-sm'>{skill.name}</p>
          <p className='text-muted-foreground truncate text-[10px]'>{skill.category}</p>
        </div>
      </div>
      <Progress value={skill.score} className='h-1 rounded-sm' />
    </div>
  );
}
