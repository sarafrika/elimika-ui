'use client';

import { Button } from '@/components/ui/button';
import type { UserDomain } from '@/lib/types';
import { cn } from '@/lib/utils';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import Link from 'next/link';
import type { CoursesHeroAction } from './courses-data';

const actionToneClasses = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  success: 'bg-success text-success-foreground hover:bg-success/90',
  warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
} as const;

type CoursesHeroProps = {
  actions: CoursesHeroAction[];
  domain: UserDomain;
};

export function CoursesHero({ actions, domain }: CoursesHeroProps) {
  return (
    <section className='border-border bg-card relative overflow-hidden rounded-[20px] border px-4 py-4 sm:px-5 sm:py-5'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <h1 className='text-foreground text-[clamp(1.55rem,2vw,2.2rem)] font-semibold leading-tight tracking-[-0.03em]'>
            What would you like to do?
          </h1>
          <p className='text-muted-foreground mt-1 text-[clamp(0.82rem,1.1vw,1rem)]'>
            Explore programs, take a short course, or browse by category
          </p>
        </div>

        <button
          type='button'
          aria-label='More options'
          className='text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center border border-transparent transition-colors'
        >
          {/* <Ellipsis className='size-4' /> */}
        </button>
      </div>

      <div className='mt-5 flex flex-wrap gap-3'>
        {actions.map(action => (
          <Button
            key={action.title}
            asChild
            className={cn(
              'h-auto min-h-14 min-w-[200px] flex-1 items-start justify-start gap-3 rounded-[8px] px-4 py-3 text-left shadow-none sm:min-w-[220px]',
              actionToneClasses[action.tone]
            )}
          >
            <Link href={buildWorkspaceAliasPath(domain, action.href)}>
              <span className='mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-[4px] bg-background/15'>
                <action.icon className='size-4' />
              </span>
              <span className='flex min-w-0 flex-1 flex-col'>
                <span className='text-sm font-semibold sm:text-[0.95rem]'>{action.title}</span>
                <span className='mt-0.5 text-[0.72rem] font-medium opacity-90 sm:text-xs'>
                  {action.subtitle}
                </span>
              </span>
            </Link>
          </Button>
        ))}
      </div>

      {/* <div className='pointer-events-none absolute inset-y-0 right-0 hidden w-[28%] min-w-[220px] bg-gradient-to-l from-muted/60 via-secondary/30 to-transparent lg:block'>
        <div className='absolute right-10 top-5 h-10 w-16 border border-border bg-card/85' />
        <div className='absolute right-20 top-20 h-20 w-20 rounded-full bg-primary/6' />
        <div className='absolute bottom-6 right-8 flex items-center gap-3'>
          <div className='h-14 w-20 border border-border bg-card/80' />
          <ArrowRight className='size-5 text-primary/50' />
        </div>
      </div> */}
    </section>
  );
}
