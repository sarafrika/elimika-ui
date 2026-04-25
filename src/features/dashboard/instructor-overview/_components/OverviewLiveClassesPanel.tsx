import { EllipsisVertical } from 'lucide-react';
import { OverviewSectionShell } from './OverviewSectionShell';
import { ActionButton, InitialsGroup } from './OverviewSharedBits';
import type { OverviewLiveClass } from './overview-data';

type OverviewLiveClassesPanelProps = {
  liveClasses: OverviewLiveClass[];
};

function LiveClassRow({ liveClass }: { liveClass: OverviewLiveClass }) {
  return (
    <article className='rounded-[10px] border border-border bg-card px-4 py-3 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <p className='text-[0.9rem] font-medium text-muted-foreground'>
          {liveClass.timeLabel}
        </p>
        <button
          type='button'
          aria-label={`${liveClass.title} options`}
          className='text-muted-foreground transition hover:text-foreground'
        >
          <EllipsisVertical className='size-4' />
        </button>
      </div>

      <h3 className='mt-1 text-[1.05rem] font-semibold text-foreground sm:text-[1.1rem]'>
        {liveClass.title}
      </h3>

      <div className='mt-3 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between'>
        <div className='flex flex-wrap items-center gap-2 text-[0.9rem] text-muted-foreground'>
          <span className='font-semibold text-primary'>
            {liveClass.provider}
          </span>
          <span>|</span>
          <span>{liveClass.students}</span>
        </div>

        <div className='flex items-center gap-3'>
          <InitialsGroup initials={liveClass.attendeeInitials} />
          <ActionButton href={liveClass.href} label={liveClass.actionLabel} />
        </div>
      </div>
    </article>
  );
}

export function OverviewLiveClassesPanel({ liveClasses }: OverviewLiveClassesPanelProps) {
  return (
    <OverviewSectionShell title='Live Classes' onActionLabel='See All' onActionHref='/dashboard/classes'>
      {liveClasses.length ? (
        <div className='space-y-3'>
          {liveClasses.map(liveClass => (
            <LiveClassRow key={liveClass.id} liveClass={liveClass} />
          ))}
        </div>
      ) : (
        <p className='rounded-[10px] border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground'>
          No live or imminent class instances found.
        </p>
      )}
    </OverviewSectionShell>
  );
}
