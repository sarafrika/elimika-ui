import { Clock3 } from 'lucide-react';
import { OverviewSectionShell } from './OverviewSectionShell';
import { ActionButton, InitialsGroup } from './OverviewSharedBits';
import type { OverviewEarningCard } from './overview-data';

type OverviewEarningPanelProps = {
  earningOverview: OverviewEarningCard[];
};

function EarningCard({ item }: { item: OverviewEarningCard }) {
  const isTimeline = !!item.actionLabel;

  return (
    <article className='border-border/70 bg-card/80 rounded-[12px] border px-3.5 py-3 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-1'>
          <p className='text-muted-foreground text-[0.9rem] font-medium'>{item.subtitle}</p>
          <h3 className='text-foreground text-[1rem] font-semibold sm:text-[1.05rem]'>
            {item.title}
          </h3>
        </div>
        {isTimeline ? (
          <ActionButton href='#' label='View report' tone='muted' />
        ) : (
          <InitialsGroup initials={item.attendeeInitials} />
        )}
      </div>

      <div className='mt-3 flex flex-col gap-3 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between'>
        <div className='text-muted-foreground space-y-1.5 text-[0.9rem]'>
          <div className='flex items-center gap-2'>
            <Clock3 className='size-4' />
            <span>{item.valueLabel}</span>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-primary font-semibold'>{item.provider}</span>
            <span className='text-muted-foreground/60'>|</span>
            <span>{item.students}</span>
          </div>
        </div>

        {item.actionLabel ? <ActionButton label={item.actionLabel} href='#' /> : null}
      </div>
    </article>
  );
}

export function OverviewEarningPanel({ earningOverview }: OverviewEarningPanelProps) {
  return (
    <OverviewSectionShell
      title='Earning Overview'
      onActionLabel='See All'
      onActionHref='/dashboard/instructor/revenue'
    >
      {earningOverview.length ? (
        <div className='space-y-3'>
          {earningOverview.map(item => (
            <EarningCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className='border-border bg-card text-muted-foreground rounded-[10px] border border-dashed px-4 py-6 text-sm'>
          No payment activity is available for this instructor yet.
        </p>
      )}
    </OverviewSectionShell>
  );
}
