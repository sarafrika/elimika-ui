import { ChevronRight, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { evidenceItems, highlights, insightHighlight } from './portfolio-data';

type RatingProps = {
  value: number;
};

function Rating({ value }: RatingProps) {
  return (
    <span className='inline-flex items-center gap-0.5' aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={cn(
            'text-base leading-none',
            star <= value
              ? 'text-[color-mix(in_srgb,var(--el-accent-amber)_90%,var(--foreground))]'
              : 'text-muted-foreground/35'
          )}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function SidebarCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='bg-card rounded-lg border p-4 shadow-sm' aria-labelledby={title}>
      <h2 id={title} className='text-foreground mb-3 text-lg font-semibold'>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function PortfolioSidebar() {
  const InsightIcon = insightHighlight.icon;

  return (
    <aside className='grid gap-4 xl:content-start'>
      <SidebarCard title='Portfolio Insights'>
        <div className='space-y-4'>
          <div className='bg-secondary/30 rounded-xl border p-4'>
            <div className='grid grid-cols-3 gap-3'>
              {evidenceItems.map(item => (
                <div
                  key={item.label}
                  className='bg-background/70 rounded-lg border px-3 py-2 text-center'
                >
                  <p className='text-foreground text-xl font-semibold'>
                    {item.value}
                  </p>
                  <p className='text-muted-foreground mt-1 text-[11px] leading-4'>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className='mt-4 space-y-3'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>
                  Total Evidence
                </span>

                <span className='text-foreground font-semibold'>
                  8 Verified
                </span>
              </div>

              <div className='bg-muted flex h-2 overflow-hidden rounded-full'>
                <span className='w-[62%] bg-[color-mix(in_srgb,var(--el-accent-amber)_78%,var(--warning))]' />
                <span className='w-[5%] bg-[color-mix(in_srgb,var(--success)_35%,var(--card))]' />
                <span className='bg-success/70 w-[24%]' />
                <span className='bg-muted-foreground/25 flex-1' />
              </div>

              <div className='grid grid-cols-2 gap-3 text-sm'>
                <div className='bg-background/60 rounded-lg border p-2'>
                  <p className='text-muted-foreground text-[11px] uppercase'>
                    Pending
                  </p>
                  <p className='text-foreground mt-1 font-semibold'>
                    1
                  </p>
                </div>

                <div className='bg-background/60 rounded-lg border p-2'>
                  <p className='text-muted-foreground text-[11px] uppercase'>
                    Verified
                  </p>
                  <p className='text-foreground mt-1 font-semibold'>
                    7
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarCard>

      <SidebarCard title='Portfolio Highlights'>
        <div className='bg-secondary/20 divide-y rounded-xl border'>
          {highlights.map(item => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className='hover:bg-accent/40 flex items-center gap-3 px-4 py-3 transition-colors'
              >
                <span className='bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-lg'>
                  <Icon className='size-5' />
                </span>

                <div className='min-w-0 flex-1'>
                  <h3 className='text-foreground truncate text-sm font-semibold'>
                    {item.title}
                  </h3>

                  <div className='mt-1'>
                    <Rating value={item.rating} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <Button className='mt-4 w-full justify-between'>
          View Report
          <ChevronRight className='size-4' />
        </Button>
      </SidebarCard>

      <SidebarCard title='Portfolio Recognition'>
        <div className='bg-secondary/20 overflow-hidden rounded-xl border'>
          <div className='flex items-center gap-2 border-b px-4 py-3'>
            <span className='bg-primary/10 text-primary grid size-8 place-items-center rounded-md'>
              <Trophy className='size-4' />
            </span>

            <div>
              <p className='text-foreground text-sm font-semibold'>
                Portfolio Badge
              </p>

              <p className='text-muted-foreground text-xs'>
                Recognition status
              </p>
            </div>
          </div>

          <div className='space-y-4 p-4'>
            <div className='flex items-center gap-3'>
              <span className='bg-success/15 text-success grid size-11 shrink-0 place-items-center rounded-lg'>
                <InsightIcon className='size-6' />
              </span>

              <div className='min-w-0'>
                <h3 className='text-foreground truncate text-sm font-semibold'>
                  {insightHighlight.title}
                </h3>

                <div className='mt-1'>
                  <Rating value={insightHighlight.rating} />
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-muted-foreground'>
                  Completion
                </span>

                <span className='text-foreground font-medium'>
                  78%
                </span>
              </div>

              <Progress
                value={78}
                className='bg-muted h-2'
                indicatorClassName='bg-success'
              />
            </div>
          </div>
        </div>

        <Button className='mt-4 w-full justify-between'>
          Upload Case Study
          <ChevronRight className='size-4' />
        </Button>
      </SidebarCard>
    </aside>
  );
}
