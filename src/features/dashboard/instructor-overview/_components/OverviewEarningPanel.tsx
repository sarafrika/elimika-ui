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
    <article className='rounded-[10px] border border-[#e6e8fb] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(99,102,241,0.04)]'>
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-1'>
          <p className='text-[1rem] font-medium text-slate-600'>{item.subtitle}</p>
          <h3 className='text-[1.05rem] font-semibold text-slate-900 sm:text-[1.12rem]'>
            {item.title}
          </h3>
        </div>
        {isTimeline ? (
          <ActionButton label='eer Rport' tone='muted' />
        ) : (
          <InitialsGroup initials={item.attendeeInitials} />
        )}
      </div>

      <div className='mt-3 flex flex-col gap-3 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between'>
        <div className='space-y-1 text-[0.96rem] text-slate-600'>
          <div className='flex items-center gap-2'>
            <Clock3 className='size-4 text-slate-400' />
            <span>{item.valueLabel}</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-[#4285f4]'>{item.provider}</span>
            <span>|</span>
            <span>{item.students}</span>
          </div>
        </div>

        {item.actionLabel ? <ActionButton label={item.actionLabel} /> : null}
      </div>
    </article>
  );
}

export function OverviewEarningPanel({ earningOverview }: OverviewEarningPanelProps) {
  return (
    <OverviewSectionShell title='Earning Overview' onActionLabel='See All'>
      <div className='space-y-3'>
        {earningOverview.map(item => (
          <EarningCard key={item.id} item={item} />
        ))}
      </div>
    </OverviewSectionShell>
  );
}
