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
    <article className='rounded-[10px] border border-border bg-card px-4 py-3 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-1'>
          <p className='text-[1rem] font-medium text-muted-foreground'>{item.subtitle}</p>
          <h3 className='text-[1.05rem] font-semibold text-foreground sm:text-[1.12rem]'>
            {item.title}
          </h3>
        </div>
        {isTimeline ? (
          <ActionButton href='#' label='eer Rport' tone='muted' />
        ) : (
          <InitialsGroup initials={item.attendeeInitials} />
        )}
      </div>

      <div className='mt-3 flex flex-col gap-3 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between'>
        <div className='space-y-1 text-[0.96rem] text-muted-foreground'>
          <div className='flex items-center gap-2'>
            <Clock3 className='size-4 text-muted-foreground' />
            <span>{item.valueLabel}</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-primary'>{item.provider}</span>
            <span>|</span>
            <span>{item.students}</span>
          </div>
        </div>

        {item.actionLabel ? <ActionButton label={item.actionLabel} href={''} /> : null}
      </div>
    </article>
  );
}

export function OverviewEarningPanel({ earningOverview }: OverviewEarningPanelProps) {
  return (
    <OverviewSectionShell title='Earning Overview' onActionLabel='See All' onActionHref='/dashboard/revenue'>
      {earningOverview.length ? (
        <div className='space-y-3'>
          {earningOverview.map(item => (
            <EarningCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className='rounded-[10px] border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground'>
          No payment activity is available for this instructor yet.
        </p>
      )}
    </OverviewSectionShell>
  );
}
