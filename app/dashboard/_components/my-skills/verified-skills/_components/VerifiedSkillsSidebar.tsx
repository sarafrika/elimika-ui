import { Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import type { SkillInsight, SuggestedSkill } from '../types';

type VerifiedSkillsSidebarProps = {
  insights: SkillInsight[];
  suggestions: SuggestedSkill[];
  report: {
    verifiedRecords: number;
    categories: number;
    averageScore: number;
  };
};

const suggestionToneClassNames = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
} as const;

export function VerifiedSkillsSidebar({ insights, suggestions, report }: VerifiedSkillsSidebarProps) {
  return (
    <aside className='grid gap-4 lg:sticky lg:top-4 lg:self-start'>
      <section className='border-border/60 bg-card rounded-lg border p-3 shadow-sm'>
        <h2 className='text-foreground mb-3 text-sm font-semibold sm:text-base'>Skill Insights</h2>
        <div className='space-y-2'>
          <p className='text-muted-foreground text-xs font-medium'>Skills Strength Rating</p>
          {insights.map(item => (
            <div key={item.name} className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2'>
              <span className='text-muted-foreground truncate text-xs'>{item.name}</span>
              <Rating value={item.rating} />
            </div>
          ))}
        </div>
      </section>

      <section className='border-border/60 bg-card rounded-lg border p-3 shadow-sm'>
        <h2 className='text-foreground mb-3 text-sm font-semibold sm:text-base'>
          Suggested Skills to Develop
        </h2>
        <div className='space-y-2'>
          {suggestions.map(item => {
            const Icon = item.icon;

            return (
              <div key={item.id} className='border-border/60 bg-background rounded-md border p-2'>
                <div className='mb-2 flex items-center gap-2'>
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-md',
                      suggestionToneClassNames[item.tone]
                    )}
                  >
                    <Icon className='size-4' />
                  </span>
                  <div className='min-w-0'>
                    <p className='text-foreground truncate text-xs font-medium'>{item.name}</p>
                    <p className='text-muted-foreground text-[10px]'>Level {item.level}</p>
                  </div>
                </div>
                <Progress value={item.progress} className='h-1 rounded-sm' />
              </div>
            );
          })}
        </div>
      </section>

      <section className='border-border/60 bg-card rounded-lg border p-3 shadow-sm'>
        <h2 className='text-foreground mb-3 text-sm font-semibold sm:text-base'>Skill Report</h2>
        <div className='space-y-3'>
          <div>
            <p className='text-muted-foreground text-xs'>Verified records</p>
            <p className='text-foreground text-sm font-semibold'>{report.verifiedRecords}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-xs'>Skill groups</p>
            <p className='text-foreground text-sm font-semibold'>{report.categories}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-xs'>Average strength</p>
            <p className='text-foreground text-sm font-semibold'>{report.averageScore}%</p>
          </div>
          <Button type='button' size='sm' className='h-8 w-full rounded-md text-xs'>
            View Report
          </Button>
        </div>
      </section>
    </aside>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <span className='flex items-center gap-0.5' aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            'size-3',
            index < value ? 'fill-primary text-primary' : 'fill-muted text-muted'
          )}
        />
      ))}
    </span>
  );
}
