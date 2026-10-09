import type { ReactNode } from 'react';
import { SectionCardSkeleton, StatCardSkeleton, surfaceTheme } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Route-level loading shapes for the instructor dashboard; each mirrors a page archetype. */

function range(count: number) {
  return Array.from({ length: count }, (_, index) => index);
}

function PageShell({ wide = false, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? `${surfaceTheme.pageWide} py-4` : surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>{children}</div>
    </div>
  );
}

export function PageHeaderSkeleton({ actions = 0 }: { actions?: number }) {
  return (
    <div className='flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-56 max-w-full' />
        <Skeleton className='h-4 w-96 max-w-full' />
      </div>
      {actions > 0 ? (
        <div className='flex gap-2'>
          {range(actions).map(item => (
            <Skeleton key={item} className='h-10 w-32 rounded-md' />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StatRow({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className={surfaceTheme.statGrid}>
      {range(count).map(item => (
        <StatCardSkeleton key={item} />
      ))}
    </div>
  );
}

function TabsRow({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className='flex gap-2 overflow-hidden'>
      {range(count).map(item => (
        <Skeleton key={item} className='h-9 w-28 shrink-0 rounded-md' />
      ))}
    </div>
  );
}

function Toolbar() {
  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
      <Skeleton className='h-10 w-full rounded-md sm:max-w-sm' />
      <Skeleton className='h-10 w-full rounded-md sm:w-40' />
      <Skeleton className='h-10 w-full rounded-md sm:w-40' />
    </div>
  );
}

function RowsCard({ rows }: { rows: number }) {
  return (
    <div className={cn(surfaceTheme.card, 'divide-border/60 divide-y')}>
      <div className='flex items-center gap-4 px-5 py-3'>
        <Skeleton className='h-3 w-24' />
        <Skeleton className='ml-auto h-3 w-16' />
      </div>
      {range(rows).map(item => (
        <div key={item} className='flex items-center gap-4 px-5 py-4'>
          <Skeleton className='size-10 shrink-0 rounded-full' />
          <div className='min-w-0 flex-1 space-y-2'>
            <Skeleton className='h-4 w-1/2' />
            <Skeleton className='h-3 w-1/3' />
          </div>
          <Skeleton className='hidden h-6 w-20 rounded-full sm:block' />
        </div>
      ))}
    </div>
  );
}

function CardTile() {
  return (
    <div className={cn(surfaceTheme.card, 'overflow-hidden')}>
      <Skeleton className='h-36 w-full rounded-none' />
      <div className='space-y-2 p-4'>
        <Skeleton className='h-5 w-3/4' />
        <Skeleton className='h-3 w-1/2' />
        <div className='flex gap-2 pt-2'>
          <Skeleton className='h-6 w-16 rounded-full' />
          <Skeleton className='h-6 w-20 rounded-full' />
        </div>
      </div>
    </div>
  );
}

/** Header, optional stats and tabs, a filter bar and a table/list of rows. */
export function ListPageSkeleton({
  stats = 0,
  tabs = 0,
  rows = 6,
  actions = 1,
  filters = true,
}: {
  stats?: number;
  tabs?: number;
  rows?: number;
  actions?: number;
  filters?: boolean;
}) {
  return (
    <PageShell>
      <PageHeaderSkeleton actions={actions} />
      <StatRow count={stats} />
      <TabsRow count={tabs} />
      {filters ? <Toolbar /> : null}
      <RowsCard rows={rows} />
    </PageShell>
  );
}

/** Header, optional stats and tabs, a filter bar and a grid of media cards. */
export function CardGridPageSkeleton({
  stats = 0,
  tabs = 0,
  cards = 6,
  actions = 0,
}: {
  stats?: number;
  tabs?: number;
  cards?: number;
  actions?: number;
}) {
  return (
    <PageShell wide>
      <PageHeaderSkeleton actions={actions} />
      <StatRow count={stats} />
      <TabsRow count={tabs} />
      <Toolbar />
      <div className={surfaceTheme.cardGrid}>
        {range(cards).map(item => (
          <CardTile key={item} />
        ))}
      </div>
    </PageShell>
  );
}

/** Header, KPI row, a chart beside a side panel, then a detail list. */
export function DashboardPageSkeleton({ stats = 4 }: { stats?: number }) {
  return (
    <PageShell>
      <PageHeaderSkeleton actions={1} />
      <StatRow count={stats} />
      <div className='grid gap-4 lg:grid-cols-3'>
        <div className={cn(surfaceTheme.cardPadded, 'space-y-4 lg:col-span-2')}>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='h-64 w-full' />
        </div>
        <SectionCardSkeleton rows={5} />
      </div>
      <RowsCard rows={4} />
    </PageShell>
  );
}

/** Back link, hero card with facts, tabs, then main content beside an aside. */
export function DetailPageSkeleton({ tabs = 3, aside = true }: { tabs?: number; aside?: boolean }) {
  return (
    <PageShell>
      <Skeleton className='h-4 w-28' />
      <div className={cn(surfaceTheme.cardPadded, 'flex flex-col gap-4 sm:flex-row')}>
        <Skeleton className='h-28 w-full shrink-0 rounded-md sm:w-44' />
        <div className='flex-1 space-y-3'>
          <Skeleton className='h-7 w-2/3' />
          <Skeleton className='h-4 w-1/2' />
          <div className='flex flex-wrap gap-2 pt-1'>
            {range(4).map(item => (
              <Skeleton key={item} className='h-6 w-24 rounded-full' />
            ))}
          </div>
        </div>
      </div>
      <TabsRow count={tabs} />
      <div className={cn('grid gap-4', aside && 'lg:grid-cols-3')}>
        <div className={cn('space-y-4', aside && 'lg:col-span-2')}>
          <SectionCardSkeleton rows={5} />
          <SectionCardSkeleton rows={4} />
        </div>
        {aside ? <SectionCardSkeleton rows={6} /> : null}
      </div>
    </PageShell>
  );
}

/** Left rail (lessons, sessions, nav) beside a main working pane. */
export function WorkspacePageSkeleton({ tabs = 3 }: { tabs?: number }) {
  return (
    <PageShell wide>
      <PageHeaderSkeleton actions={1} />
      <TabsRow count={tabs} />
      <div className='grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]'>
        <div className={cn(surfaceTheme.card, 'space-y-2 p-3')}>
          {range(7).map(item => (
            <Skeleton key={item} className='h-12 w-full rounded-md' />
          ))}
        </div>
        <div className='space-y-4'>
          <div className={cn(surfaceTheme.cardPadded, 'space-y-3')}>
            <Skeleton className='h-6 w-1/2' />
            <Skeleton className='h-4 w-1/3' />
            <Skeleton className='h-56 w-full' />
          </div>
          <SectionCardSkeleton rows={4} />
        </div>
      </div>
    </PageShell>
  );
}

/** Header, optional stepper, then stacked field sections and a submit bar. */
export function FormPageSkeleton({
  sections = 3,
  steps = 0,
}: {
  sections?: number;
  steps?: number;
}) {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      {steps > 0 ? (
        <div className='flex items-center gap-3'>
          {range(steps).map(item => (
            <div key={item} className='flex flex-1 items-center gap-2'>
              <Skeleton className='size-8 shrink-0 rounded-full' />
              <Skeleton className='hidden h-3 flex-1 sm:block' />
            </div>
          ))}
        </div>
      ) : null}
      {range(sections).map(item => (
        <div key={item} className={cn(surfaceTheme.cardPadded, 'space-y-4')}>
          <Skeleton className='h-5 w-48' />
          <div className='grid gap-4 sm:grid-cols-2'>
            {range(4).map(field => (
              <div key={field} className='space-y-2'>
                <Skeleton className='h-3 w-24' />
                <Skeleton className='h-10 w-full rounded-md' />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className='flex justify-end gap-2'>
        <Skeleton className='h-10 w-24 rounded-md' />
        <Skeleton className='h-10 w-32 rounded-md' />
      </div>
    </PageShell>
  );
}

/** Header, view toolbar and a seven-day calendar grid. */
export function CalendarPageSkeleton({ aside = false }: { aside?: boolean }) {
  return (
    <PageShell wide>
      <PageHeaderSkeleton actions={1} />
      <div className='flex flex-wrap items-center gap-2'>
        <Skeleton className='h-9 w-24 rounded-md' />
        <Skeleton className='h-9 w-9 rounded-md' />
        <Skeleton className='h-9 w-9 rounded-md' />
        <Skeleton className='h-6 w-40' />
        <Skeleton className='ml-auto h-9 w-48 rounded-md' />
      </div>
      <div className={cn('grid gap-4', aside && 'lg:grid-cols-[minmax(0,1fr)_320px]')}>
        <div className={cn(surfaceTheme.card, 'grid grid-cols-7 gap-px overflow-hidden p-px')}>
          {range(7).map(item => (
            <Skeleton key={`h${item}`} className='h-8 rounded-none' />
          ))}
          {range(35).map(item => (
            <Skeleton key={item} className='h-20 rounded-none opacity-60 sm:h-24' />
          ))}
        </div>
        {aside ? <SectionCardSkeleton rows={6} /> : null}
      </div>
    </PageShell>
  );
}

/** A profile section rendered inside ProfileSectionLayout: heading plus entry cards. */
export function ProfileSectionSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className='flex w-full flex-col gap-4'>
      <div className='flex items-center justify-between gap-3'>
        <div className='space-y-2'>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-72 max-w-full' />
        </div>
        <Skeleton className='h-10 w-28 rounded-md' />
      </div>
      {range(items).map(item => (
        <div key={item} className={cn(surfaceTheme.cardPadded, 'flex gap-4')}>
          <Skeleton className='size-12 shrink-0 rounded-md' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-5 w-1/2' />
            <Skeleton className='h-4 w-1/3' />
            <Skeleton className='h-3 w-3/4' />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tabbed settings: tab strip then a main panel beside a summary panel. */
export function SettingsPageSkeleton() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <TabsRow count={5} />
      <div className='grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]'>
        <SectionCardSkeleton rows={7} />
        <SectionCardSkeleton rows={4} />
      </div>
    </PageShell>
  );
}
