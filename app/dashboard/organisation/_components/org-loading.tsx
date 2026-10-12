import type { ReactNode } from 'react';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { SectionCardSkeleton } from '@/components/data-display/section-card';
import { StatCardSkeleton } from '@/components/data-display/stat-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { OrgPage, orgStack } from './org-page';

/** Route-level skeleton pieces for organisation pages, shaped like their loaded sections. */
const range = (count: number) => Array.from({ length: count }, (_, index) => index);

export function OrgLoadingPage({
  children,
  width = 'wide',
}: {
  children: ReactNode;
  width?: 'wide' | 'standard';
}) {
  return (
    <OrgPage width={width}>
      <div className={orgStack} aria-busy='true'>
        {children}
      </div>
    </OrgPage>
  );
}

export function HeaderSkeleton({
  action = true,
  back = false,
}: {
  action?: boolean;
  back?: boolean;
}) {
  return (
    <div className='space-y-3'>
      {back ? <Skeleton className='h-4 w-28' /> : null}
      <div className='flex flex-wrap items-end justify-between gap-4 border-b pb-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        {action ? <Skeleton className='h-9 w-32' /> : null}
      </div>
    </div>
  );
}

export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={surfaceTheme.statGrid}>
      {range(count).map(item => (
        <StatCardSkeleton key={item} />
      ))}
    </div>
  );
}

export function ToolbarSkeleton({ filters = 1 }: { filters?: number }) {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <Skeleton className='h-9 w-full max-w-xs' />
      {range(filters).map(item => (
        <Skeleton key={item} className='h-9 w-40' />
      ))}
    </div>
  );
}

export function TabsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className='flex gap-2 overflow-hidden border-b pb-2'>
      {range(count).map(item => (
        <Skeleton key={item} className='h-8 w-24 shrink-0' />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={cn(surfaceTheme.card, 'space-y-2 p-3')}>
      <Skeleton className='h-8 w-full' />
      {range(rows).map(item => (
        <Skeleton key={item} className='h-12 w-full' />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6, wide = false }: { count?: number; wide?: boolean }) {
  return (
    <div className={wide ? surfaceTheme.cardGridWide : surfaceTheme.cardGrid}>
      {range(count).map(item => (
        <div key={item} className={cn(surfaceTheme.card, 'space-y-3 p-4')}>
          <Skeleton className='h-32 w-full rounded-md' />
          <Skeleton className='h-5 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
          <Skeleton className='h-8 w-full' />
        </div>
      ))}
    </div>
  );
}

/** Header, KPI row, search/filter bar and a table: the common list page. */
export function OrgListLoading({
  stats = 4,
  filters = 1,
  rows = 6,
  action = true,
  tabs = 0,
}: {
  stats?: number;
  filters?: number;
  rows?: number;
  action?: boolean;
  tabs?: number;
}) {
  return (
    <OrgLoadingPage>
      <HeaderSkeleton action={action} />
      {stats > 0 ? <StatRowSkeleton count={stats} /> : null}
      {tabs > 0 ? <TabsSkeleton count={tabs} /> : null}
      <ToolbarSkeleton filters={filters} />
      <TableSkeleton rows={rows} />
    </OrgLoadingPage>
  );
}

/** Back link, identity band, tab strip, then main content beside a side rail. */
export function OrgRecordLoading({
  stats = 0,
  width = 'wide',
}: {
  stats?: number;
  width?: 'wide' | 'standard';
}) {
  return (
    <OrgLoadingPage width={width}>
      <Skeleton className='h-4 w-28' />
      <div className='bg-card grid gap-5 rounded-2xl border p-4 sm:p-5 md:grid-cols-[200px_minmax(0,1fr)]'>
        <Skeleton className='h-[120px] rounded-xl' />
        <div className='flex flex-col gap-3'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-8 w-3/4' />
          <Skeleton className='h-4 w-full max-w-prose' />
          <Skeleton className='h-4 w-1/2' />
        </div>
      </div>
      {stats > 0 ? <StatRowSkeleton count={stats} /> : null}
      <TabsSkeleton />
      <div className='grid gap-4 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <SectionCardSkeleton rows={6} />
        </div>
        <SectionCardSkeleton rows={4} />
      </div>
    </OrgLoadingPage>
  );
}

/** Header followed by stacked form sections with a two-column field grid. */
export function OrgFormLoading({
  sections = 2,
  back = false,
}: {
  sections?: number;
  back?: boolean;
}) {
  return (
    <OrgLoadingPage width='standard'>
      <HeaderSkeleton action={false} back={back} />
      {range(sections).map(section => (
        <div key={section} className={cn(surfaceTheme.cardPadded, 'space-y-4')}>
          <Skeleton className='h-5 w-48' />
          <div className='grid gap-4 sm:grid-cols-2'>
            {range(4).map(field => (
              <div key={field} className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-9 w-full' />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className='flex justify-end'>
        <Skeleton className='h-9 w-32' />
      </div>
    </OrgLoadingPage>
  );
}
