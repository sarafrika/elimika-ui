import type { ReactNode } from 'react';
import { ChevronRight, Trophy } from 'lucide-react';

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
    <aside className='grid gap-4 lg:grid-cols-2 xl:grid-cols-1 xl:content-start'>
      <SidebarCard title='Portfolio Insights'>
        <div className='bg-secondary/40 rounded-md border p-3'>
          <div className='grid grid-cols-3 gap-2 text-center'>
            {evidenceItems.map(item => (
              <div key={item.label}>
                <p className='text-foreground text-2xl font-semibold'>{item.value}</p>
                <p className='text-muted-foreground text-xs leading-4'>{item.label}</p>
              </div>
            ))}
          </div>
          <div className='my-4 border-t' />
          <div className='space-y-3'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground font-medium'>Total Evidence:</span>
              <span className='text-foreground font-semibold'>8 Verified</span>
            </div>
            <div className='bg-muted flex h-3 overflow-hidden rounded-full'>
              <span className='w-[62%] bg-[color-mix(in_srgb,var(--el-accent-amber)_78%,var(--warning))]' />
              <span className='w-[5%] bg-[color-mix(in_srgb,var(--success)_35%,var(--card))]' />
              <span className='bg-success/70 w-[24%]' />
              <span className='bg-muted-foreground/25 flex-1' />
            </div>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Pending Verifications:</span>
                <strong className='text-foreground'>1</strong>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Verified Evidence:</span>
                <strong className='text-foreground'>7</strong>
              </div>
            </div>
          </div>
        </div>
      </SidebarCard>

      <SidebarCard title='Portfolio Highlights'>
        <div className='bg-secondary/30 divide-y rounded-md border'>
          {highlights.map(item => {
            const Icon = item.icon;

            return (
              <article key={item.title} className='flex items-center gap-3 p-3'>
                <span className='text-primary grid size-9 shrink-0 place-items-center rounded-md'>
                  <Icon className='size-6' />
                </span>
                <div className='min-w-0'>
                  <h3 className='text-foreground truncate text-sm font-semibold'>{item.title}</h3>
                  <Rating value={item.rating} />
                </div>
              </article>
            );
          })}
        </div>
        <Button className='mt-4 w-full'>
          View Report
          <ChevronRight className='size-4' />
        </Button>
      </SidebarCard>

      <SidebarCard title='Portfolio Insights'>
        <div className='bg-secondary/30 rounded-md border'>
          <div className='text-foreground flex items-center gap-2 border-b px-3 py-2 text-sm font-medium'>
            <Trophy className='text-primary size-4' />
            Portfolio ledgless
          </div>
          <div className='p-3'>
            <p className='text-muted-foreground text-sm'>Relevant for</p>
            <article className='mt-3 flex items-center gap-3'>
              <span className='bg-success text-success-foreground grid size-10 shrink-0 place-items-center rounded-md'>
                <InsightIcon className='size-6' />
              </span>
              <div>
                <h3 className='text-foreground text-sm font-semibold'>{insightHighlight.title}</h3>
                <Rating value={insightHighlight.rating} />
              </div>
            </article>
            <Progress value={78} className='bg-muted mt-3 h-2' indicatorClassName='bg-success' />
          </div>
        </div>
        <Button className='mt-4 w-full'>
          Upload Case Study
          <ChevronRight className='size-4' />
        </Button>
      </SidebarCard>
    </aside>
  );
}
