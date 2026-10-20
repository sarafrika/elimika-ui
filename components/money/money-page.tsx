'use client';

import type { ComponentType, ReactNode } from 'react';
import { PageHeader } from '@/components/dashboard/page-header';
import { type SectionTab, SectionTabs } from '@/components/data-display/section-tabs';
import { StatCard, StatCardSkeleton } from '@/components/data-display/stat-tile';
import type { StatusTone } from '@/components/data-display/tone';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface MoneyStat {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: StatusTone;
}

interface MoneyPageProps<T extends string> {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  /** The first stat is the headline: filled in the role's colour. */
  stats: MoneyStat[];
  loadingStats?: boolean;
  tabs: readonly SectionTab<T>[];
  tab: T;
  onTabChange: (tab: T) => void;
  hrefFor?: (tab: T) => string;
  /** One `SectionTabPanel` per tab. */
  children: ReactNode;
}

/** Every role's money page: header, stat row, section tabs. Only the domain colour differs. */
export function MoneyPage<T extends string>({
  eyebrow,
  title,
  description,
  actions,
  stats,
  loadingStats,
  tabs,
  tab,
  onTabChange,
  hrefFor,
  children,
}: MoneyPageProps<T>) {
  const [headline, ...rest] = stats;
  return (
    <div className={cn(surfaceTheme.page, 'space-y-6')}>
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
      <section aria-label='Summary' className={surfaceTheme.statGrid}>
        {loadingStats ? (
          stats.map(stat => <StatCardSkeleton key={stat.label} />)
        ) : (
          <>
            {headline ? <HeadlineStat {...headline} /> : null}
            {rest.map(stat => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </>
        )}
      </section>
      <SectionTabs label={`${title} sections`} tabs={tabs} value={tab} onValueChange={onTabChange} hrefFor={hrefFor}>
        {children}
      </SectionTabs>
    </div>
  );
}

function HeadlineStat({ label, value, hint, icon: Icon }: MoneyStat) {
  return (
    <div className='bg-primary text-primary-foreground flex items-start justify-between gap-3 rounded-md p-5'>
      <div className='min-w-0 space-y-1'>
        <p className='truncate text-xs font-medium tracking-wide uppercase opacity-85'>{label}</p>
        <p className='text-2xl font-bold tabular-nums'>{value}</p>
        {hint ? <p className='text-xs opacity-85'>{hint}</p> : null}
      </div>
      {Icon ? (
        <span className='bg-primary-foreground/15 flex size-10 shrink-0 items-center justify-center rounded-md'>
          <Icon className='size-5' />
        </span>
      ) : null}
    </div>
  );
}

export function MoneyValueSkeleton() {
  return <Skeleton className='h-7 w-28' />;
}
